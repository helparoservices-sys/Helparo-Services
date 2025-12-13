-- Fix referral code generation to use HELP prefix
-- Also fix the convert_referral function to work properly

-- Update generate_referral_code to use HELP prefix and be deterministic
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing TEXT;
  v_code TEXT;
BEGIN
  -- Check for ANY existing referral code for this user (as referrer)
  SELECT referral_code INTO v_existing
  FROM public.referrals
  WHERE referrer_id = p_user_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Generate new deterministic code: HELP prefix + 8 chars from user ID
  -- This is deterministic - same user always gets same code
  v_code := 'HELP' || UPPER(SUBSTRING(REPLACE(p_user_id::TEXT, '-', ''), 1, 8));

  -- Insert the new referral record
  INSERT INTO public.referrals(referrer_id, referral_code, status)
  VALUES(p_user_id, v_code, 'initiated');

  RETURN v_code;
END;$$;

COMMENT ON FUNCTION public.generate_referral_code IS 'Creates or returns existing referral code for user. Generates deterministic HELP prefix codes.';

-- Update convert_referral to be more robust and prevent issues
CREATE OR REPLACE FUNCTION public.convert_referral(p_referral_code TEXT, p_new_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ref_id UUID;
  v_referrer_id UUID;
BEGIN
  -- Normalize the code to uppercase
  p_referral_code := UPPER(TRIM(p_referral_code));
  
  -- Ensure new user doesn't already have a converted referral (they already used a code before)
  IF EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referred_user_id = p_new_user_id AND status IN ('converted', 'rewarded')
  ) THEN
    RETURN FALSE; -- User already used a referral code
  END IF;

  -- Find the referral and its owner
  SELECT id, referrer_id INTO v_ref_id, v_referrer_id
  FROM public.referrals
  WHERE referral_code = p_referral_code 
    AND status = 'initiated'
  LIMIT 1;

  -- Check if code exists
  IF v_ref_id IS NULL THEN
    RETURN FALSE; -- Invalid code or already converted
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_new_user_id THEN
    RETURN FALSE; -- Can't use own code
  END IF;

  -- Update the referral record to mark as converted
  UPDATE public.referrals
  SET referred_user_id = p_new_user_id,
      status = 'converted',
      converted_at = timezone('utc'::text, now())
  WHERE id = v_ref_id;

  RETURN TRUE;
END;$$;

COMMENT ON FUNCTION public.convert_referral IS 'Marks referral as converted by linking new user. Prevents self-referral and duplicate usage.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_referral TO authenticated;

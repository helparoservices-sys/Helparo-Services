-- =============================================
-- AUTO-VERIFY USERS ON SIGNUP
-- Automatically set is_verified = TRUE when profile is created
-- This triggers the welcome bonus immediately
-- =============================================

-- Create function to auto-verify new users
CREATE OR REPLACE FUNCTION public.auto_verify_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set is_verified to TRUE for new users
  NEW.is_verified := TRUE;
  
  RAISE NOTICE 'Auto-verified new user: %', NEW.id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_verify_user ON public.profiles;

-- Create trigger to run before INSERT
CREATE TRIGGER trigger_auto_verify_user
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_verify_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.auto_verify_new_user TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.auto_verify_new_user IS 'Automatically verifies new users on signup by setting is_verified = TRUE';

-- =============================================
-- VERIFY EXISTING UNVERIFIED USERS (OPTIONAL)
-- Uncomment this block if you want to verify all existing users
-- =============================================

/*
UPDATE public.profiles
SET is_verified = TRUE,
    updated_at = now()
WHERE is_verified = FALSE;
*/

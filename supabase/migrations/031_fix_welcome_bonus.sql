-- =============================================
-- FIX WELCOME BONUS TRIGGER
-- Grant bonus when user verifies email (is_verified becomes TRUE)
-- =============================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_welcome_bonus ON public.profiles;

-- Update function to grant bonus on email verification
CREATE OR REPLACE FUNCTION public.grant_welcome_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bonus_amount NUMERIC(10,2) := 50.00;  -- ₹50 welcome bonus
BEGIN
  -- Grant bonus when user verifies email (is_verified changes from FALSE to TRUE)
  IF NEW.is_verified = TRUE AND (OLD IS NULL OR OLD.is_verified = FALSE) THEN
    
    -- Check if welcome bonus already granted
    IF EXISTS (
      SELECT 1 FROM public.user_bonuses
      WHERE user_id = NEW.id AND bonus_type = 'welcome'
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Create wallet if doesn't exist
    INSERT INTO public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
    VALUES (NEW.id, v_bonus_amount, 0, 'INR')
    ON CONFLICT (user_id) DO UPDATE
    SET available_balance = wallet_accounts.available_balance + v_bonus_amount,
        updated_at = now();
    
    -- Record bonus transaction in user_bonuses
    INSERT INTO public.user_bonuses (
      user_id, 
      bonus_type, 
      amount, 
      status, 
      description,
      credited_at
    ) VALUES (
      NEW.id,
      'welcome',
      v_bonus_amount,
      'credited',
      'Welcome bonus - Thank you for joining Helparo!',
      now()
    );
    
    RAISE NOTICE 'Welcome bonus of ₹% granted to user %', v_bonus_amount, NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger for INSERT and UPDATE
CREATE TRIGGER trigger_welcome_bonus
  AFTER INSERT OR UPDATE OF is_verified ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_welcome_bonus();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.grant_welcome_bonus TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.grant_welcome_bonus IS 'Automatically grants ₹50 welcome bonus when user verifies their email (is_verified becomes TRUE)';

-- =============================================
-- MANUAL BACKFILL FOR EXISTING VERIFIED USERS
-- Run this to grant bonus to users who verified before this fix
-- =============================================

DO $$
DECLARE
  v_user RECORD;
  v_bonus_amount NUMERIC(10,2) := 50.00;
BEGIN
  FOR v_user IN 
    SELECT p.id, p.full_name
    FROM public.profiles p
    WHERE p.is_verified = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM public.user_bonuses ub
        WHERE ub.user_id = p.id AND ub.bonus_type = 'welcome'
      )
  LOOP
    -- Create wallet if doesn't exist
    INSERT INTO public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
    VALUES (v_user.id, v_bonus_amount, 0, 'INR')
    ON CONFLICT (user_id) DO UPDATE
    SET available_balance = wallet_accounts.available_balance + v_bonus_amount,
        updated_at = now();
    
    -- Record bonus
    INSERT INTO public.user_bonuses (
      user_id, 
      bonus_type, 
      amount, 
      status, 
      description,
      credited_at
    ) VALUES (
      v_user.id,
      'welcome',
      v_bonus_amount,
      'credited',
      'Welcome bonus - Thank you for joining Helparo!',
      now()
    );
    
    RAISE NOTICE 'Backfilled welcome bonus for user: % (%)', v_user.full_name, v_user.id;
  END LOOP;
END $$;

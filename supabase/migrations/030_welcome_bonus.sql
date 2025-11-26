-- =====================================================
-- WELCOME BONUS SYSTEM
-- Automatically grant ₹50 bonus when users verify email
-- =====================================================

-- 1. Create user_bonuses table to track all bonus credits
CREATE TABLE IF NOT EXISTS public.user_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL CHECK (bonus_type IN ('welcome', 'referral', 'campaign', 'loyalty', 'promotion')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'credited' CHECK (status IN ('pending', 'credited', 'expired', 'cancelled')),
  description TEXT,
  credited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_bonuses_user_id ON public.user_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bonuses_type ON public.user_bonuses(bonus_type);
CREATE INDEX IF NOT EXISTS idx_user_bonuses_status ON public.user_bonuses(status);
CREATE INDEX IF NOT EXISTS idx_user_bonuses_created ON public.user_bonuses(created_at DESC);

-- 3. RLS Policies
ALTER TABLE public.user_bonuses ENABLE ROW LEVEL SECURITY;

-- Users can view their own bonuses
CREATE POLICY "Users can view own bonuses"
  ON public.user_bonuses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all bonuses
CREATE POLICY "Admins can view all bonuses"
  ON public.user_bonuses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only system can insert bonuses (via trigger or admin function)
CREATE POLICY "System can insert bonuses"
  ON public.user_bonuses
  FOR INSERT
  WITH CHECK (true);

-- 4. Function to grant welcome bonus
CREATE OR REPLACE FUNCTION public.grant_welcome_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bonus_amount NUMERIC(10,2) := 50.00;  -- ₹50 welcome bonus
  v_wallet_exists BOOLEAN;
BEGIN
  -- Only grant bonus if email is verified
  IF NEW.email_verified = TRUE AND (OLD.email_verified IS NULL OR OLD.email_verified = FALSE) THEN
    
    -- Check if welcome bonus already granted
    IF EXISTS (
      SELECT 1 FROM public.user_bonuses
      WHERE user_id = NEW.id AND bonus_type = 'welcome'
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Create wallet if doesn't exist
    INSERT INTO public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
    VALUES (NEW.id, 0, 0, 'INR')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Add welcome bonus to wallet
    UPDATE public.wallet_accounts
    SET 
      available_balance = available_balance + v_bonus_amount,
      updated_at = now()
    WHERE user_id = NEW.id;
    
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
    
    -- Create ledger entry for audit trail
    INSERT INTO public.ledger_entries (
      account_user_id,
      entry_type,
      amount,
      description,
      created_at
    ) VALUES (
      NEW.id,
      'credit',
      v_bonus_amount,
      'Welcome bonus - Thank you for joining Helparo!',
      now()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_welcome_bonus ON public.profiles;

CREATE TRIGGER trigger_welcome_bonus
  AFTER INSERT OR UPDATE OF email_verified ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_welcome_bonus();

-- 6. Admin function to manually grant bonus (if needed)
CREATE OR REPLACE FUNCTION public.admin_grant_bonus(
  p_user_id UUID,
  p_bonus_type TEXT,
  p_amount NUMERIC(10,2),
  p_description TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bonus_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if caller is admin
  SELECT role = 'admin' INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can grant manual bonuses';
  END IF;
  
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Bonus amount must be positive';
  END IF;
  
  -- Create wallet if doesn't exist
  INSERT INTO public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
  VALUES (p_user_id, 0, 0, 'INR')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add bonus to wallet
  UPDATE public.wallet_accounts
  SET 
    available_balance = available_balance + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record bonus
  INSERT INTO public.user_bonuses (
    user_id,
    bonus_type,
    amount,
    status,
    description,
    credited_at,
    expires_at
  ) VALUES (
    p_user_id,
    p_bonus_type,
    p_amount,
    'credited',
    COALESCE(p_description, 'Manual bonus from admin'),
    now(),
    p_expires_at
  )
  RETURNING id INTO v_bonus_id;
  
  -- Create ledger entry
  INSERT INTO public.ledger_entries (
    account_user_id,
    entry_type,
    amount,
    description,
    created_at
  ) VALUES (
    p_user_id,
    'credit',
    p_amount,
    COALESCE(p_description, 'Manual bonus from admin'),
    now()
  );
  
  RETURN v_bonus_id;
END;
$$;

-- 7. Function to get user's bonus history
CREATE OR REPLACE FUNCTION public.get_user_bonuses(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  bonus_type TEXT,
  amount NUMERIC(10,2),
  status TEXT,
  description TEXT,
  credited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check permission
  IF p_user_id != auth.uid() THEN
    -- Check if caller is admin
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;
  
  RETURN QUERY
  SELECT 
    ub.id,
    ub.bonus_type,
    ub.amount,
    ub.status,
    ub.description,
    ub.credited_at,
    ub.expires_at,
    ub.created_at
  FROM public.user_bonuses ub
  WHERE ub.user_id = p_user_id
  ORDER BY ub.created_at DESC;
END;
$$;

-- 8. Grant permissions
GRANT SELECT ON public.user_bonuses TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_welcome_bonus TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_bonus TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_bonuses TO authenticated;

-- 9. Comments
COMMENT ON TABLE public.user_bonuses IS 'Tracks all bonus credits given to users (welcome, referral, campaigns, etc.)';
COMMENT ON FUNCTION public.grant_welcome_bonus IS 'Automatically grants ₹50 welcome bonus when user verifies email';
COMMENT ON FUNCTION public.admin_grant_bonus IS 'Allows admins to manually grant bonuses to users';
COMMENT ON FUNCTION public.get_user_bonuses IS 'Returns bonus history for a user';

-- 10. Trigger updated_at timestamp
CREATE TRIGGER set_timestamp_user_bonuses
  BEFORE UPDATE ON public.user_bonuses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

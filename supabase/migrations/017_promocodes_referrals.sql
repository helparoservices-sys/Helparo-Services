-- Promocodes & Referral System
-- Migration 017: Promo codes, referral tracking, rewards, validation logic

-- ============================================================================
-- ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE promo_discount_type AS ENUM ('flat','percent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE referral_status AS ENUM ('initiated','converted','rewarded','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE referral_reward_type AS ENUM ('wallet_credit','promo_code','subscription_bonus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reward_status AS ENUM ('pending','granted','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- PROMO CODES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type promo_discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,            -- If percent, 0-100; if flat, rupees
  max_discount_rupees NUMERIC(10,2),                -- Optional cap for percent type
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  usage_limit_total INTEGER,                        -- Global usage cap
  usage_limit_per_user INTEGER,                     -- Per-user cap
  min_order_amount_rupees NUMERIC(10,2),            -- Minimum order to apply
  allowed_roles TEXT[] DEFAULT ARRAY['customer'],   -- Roles that can use it
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_date ON public.promo_codes(start_date,end_date);

DROP TRIGGER IF EXISTS trg_update_promo_codes ON public.promo_codes;
CREATE TRIGGER trg_update_promo_codes
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROMO CODE USAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.promo_code_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  applied_amount_paise INTEGER NOT NULL,            -- Discount in paise
  order_amount_paise INTEGER NOT NULL,              -- Original order amount in paise
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON public.promo_code_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_promo ON public.promo_code_usages(promo_id);

ALTER TABLE public.promo_code_usages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REFERRAL TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status referral_status NOT NULL DEFAULT 'initiated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REFERRAL REWARDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type referral_reward_type NOT NULL,
  amount_paise INTEGER,                   -- For wallet_credit
  linked_promo_id UUID REFERENCES public.promo_codes(id),
  status reward_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  granted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON public.referral_rewards(referrer_id);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Promo codes: admins manage, public read active
DROP POLICY IF EXISTS "Public read active promo codes" ON public.promo_codes;
CREATE POLICY "Public read active promo codes" ON public.promo_codes
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins manage promo codes" ON public.promo_codes
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Promo code usages: user reads own, inserts own
DROP POLICY IF EXISTS "Users insert promo usage" ON public.promo_code_usages;
CREATE POLICY "Users insert promo usage" ON public.promo_code_usages
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own promo usage" ON public.promo_code_usages;
CREATE POLICY "Users read own promo usage" ON public.promo_code_usages
  FOR SELECT USING (user_id = auth.uid());

-- Referrals: referrer reads own referrals
DROP POLICY IF EXISTS "Referrers read referrals" ON public.referrals;
CREATE POLICY "Referrers read referrals" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid());

DROP POLICY IF EXISTS "System insert referrals" ON public.referrals;
CREATE POLICY "System insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (true);

-- Referral rewards: referrer reads own rewards
DROP POLICY IF EXISTS "Referrers read rewards" ON public.referral_rewards;
CREATE POLICY "Referrers read rewards" ON public.referral_rewards
  FOR SELECT USING (referrer_id = auth.uid());

DROP POLICY IF EXISTS "System manage rewards" ON public.referral_rewards;
CREATE POLICY "System manage rewards" ON public.referral_rewards
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Generate referral code (idempotent for user)
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing TEXT;
  v_code TEXT;
BEGIN
  SELECT referral_code INTO v_existing
  FROM public.referrals
  WHERE referrer_id = p_user_id AND referred_user_id IS NULL
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  v_code := UPPER(substr(md5(p_user_id || now()::text),1,8));

  INSERT INTO public.referrals(referrer_id, referral_code)
  VALUES(p_user_id, v_code);

  RETURN v_code;
END;$$;

COMMENT ON FUNCTION public.generate_referral_code IS 'Creates or returns existing referral code for user.';

-- Convert referral when new user signs up using code
CREATE OR REPLACE FUNCTION public.convert_referral(p_referral_code TEXT, p_new_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ref_id UUID;
BEGIN
  UPDATE public.referrals
  SET referred_user_id = p_new_user_id,
      status = 'converted',
      converted_at = timezone('utc'::text, now())
  WHERE referral_code = p_referral_code AND status = 'initiated'
  RETURNING id INTO v_ref_id;

  RETURN v_ref_id IS NOT NULL;
END;$$;

COMMENT ON FUNCTION public.convert_referral IS 'Marks referral as converted by linking new user.';

-- Validate promo code for a given order amount & user
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code TEXT,
  p_order_amount_rupees NUMERIC(10,2),
  p_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
  is_valid BOOLEAN,
  reason TEXT,
  discount_rupees NUMERIC(10,2),
  final_amount_rupees NUMERIC(10,2)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_p promo_codes%ROWTYPE;
  v_total_used INTEGER;
  v_user_used INTEGER;
  v_discount NUMERIC(10,2);
  v_final NUMERIC(10,2);
BEGIN
  SELECT * INTO v_p FROM public.promo_codes WHERE code = p_code AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'CODE_NOT_FOUND', 0, p_order_amount_rupees;
    RETURN;
  END IF;

  IF CURRENT_DATE < v_p.start_date OR CURRENT_DATE > v_p.end_date THEN
    RETURN QUERY SELECT FALSE, 'EXPIRED_OR_NOT_STARTED', 0, p_order_amount_rupees;
    RETURN;
  END IF;

  IF v_p.min_order_amount_rupees IS NOT NULL AND p_order_amount_rupees < v_p.min_order_amount_rupees THEN
    RETURN QUERY SELECT FALSE, 'MIN_ORDER_NOT_MET', 0, p_order_amount_rupees;
    RETURN;
  END IF;

  IF v_p.allowed_roles IS NOT NULL THEN
    PERFORM 1 FROM public.profiles WHERE id = p_user_id AND role = ANY(v_p.allowed_roles);
    IF NOT FOUND THEN
      RETURN QUERY SELECT FALSE, 'ROLE_NOT_ALLOWED', 0, p_order_amount_rupees;
      RETURN;
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_total_used FROM public.promo_code_usages WHERE promo_id = v_p.id;
  IF v_p.usage_limit_total IS NOT NULL AND v_total_used >= v_p.usage_limit_total THEN
    RETURN QUERY SELECT FALSE, 'GLOBAL_LIMIT_REACHED', 0, p_order_amount_rupees;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_user_used FROM public.promo_code_usages WHERE promo_id = v_p.id AND user_id = p_user_id;
  IF v_p.usage_limit_per_user IS NOT NULL AND v_user_used >= v_p.usage_limit_per_user THEN
    RETURN QUERY SELECT FALSE, 'USER_LIMIT_REACHED', 0, p_order_amount_rupees;
    RETURN;
  END IF;

  IF v_p.discount_type = 'flat' THEN
    v_discount := v_p.discount_value;
  ELSE
    v_discount := (p_order_amount_rupees * (v_p.discount_value / 100.0));
    IF v_p.max_discount_rupees IS NOT NULL THEN
      v_discount := LEAST(v_discount, v_p.max_discount_rupees);
    END IF;
  END IF;

  v_discount := LEAST(v_discount, p_order_amount_rupees);
  v_final := p_order_amount_rupees - v_discount;

  RETURN QUERY SELECT TRUE, 'OK', v_discount, v_final;
END;$$;

COMMENT ON FUNCTION public.validate_promo_code IS 'Checks promo code validity & computes discount.';

-- Apply promo code (records usage) returning discount & final amounts
CREATE OR REPLACE FUNCTION public.apply_promo_code(
  p_code TEXT,
  p_request_id UUID,
  p_order_amount_rupees NUMERIC(10,2),
  p_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
  discount_rupees NUMERIC(10,2),
  final_amount_rupees NUMERIC(10,2)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result RECORD;
  v_promo_id UUID;
  v_discount_paise INTEGER;
  v_order_paise INTEGER := (p_order_amount_rupees * 100)::INTEGER;
BEGIN
  SELECT * INTO v_result FROM public.validate_promo_code(p_code, p_order_amount_rupees, p_user_id);
  IF NOT v_result.is_valid THEN
    RAISE EXCEPTION 'Promo invalid: %', v_result.reason;
  END IF;

  SELECT id INTO v_promo_id FROM public.promo_codes WHERE code = p_code;

  v_discount_paise := (v_result.discount_rupees * 100)::INTEGER;

  INSERT INTO public.promo_code_usages(promo_id, user_id, request_id, applied_amount_paise, order_amount_paise)
  VALUES(v_promo_id, p_user_id, p_request_id, v_discount_paise, v_order_paise);

  RETURN QUERY SELECT v_result.discount_rupees, v_result.final_amount_rupees;
END;$$;

COMMENT ON FUNCTION public.apply_promo_code IS 'Applies validated promo code and records usage.';

-- Grant referral reward (wallet credit)
CREATE OR REPLACE FUNCTION public.grant_referral_wallet_reward(
  p_referral_id UUID,
  p_amount_rupees NUMERIC(10,2)
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_referrer UUID;
  v_amount_paise INTEGER := (p_amount_rupees * 100)::INTEGER;
  v_reward_id UUID;
BEGIN
  SELECT referrer_id INTO v_referrer FROM public.referrals WHERE id = p_referral_id AND status IN ('converted','rewarded');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referral not convertible for reward';
  END IF;

  INSERT INTO public.referral_rewards(referral_id, referrer_id, reward_type, amount_paise, status, granted_at)
  VALUES(p_referral_id, v_referrer, 'wallet_credit', v_amount_paise, 'granted', timezone('utc'::text, now()))
  RETURNING id INTO v_reward_id;

  UPDATE public.wallet_accounts
  SET available_balance = available_balance + v_amount_paise,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = v_referrer;

  UPDATE public.referrals
  SET status = 'rewarded', rewarded_at = timezone('utc'::text, now())
  WHERE id = p_referral_id;

  RETURN TRUE;
END;$$;

COMMENT ON FUNCTION public.grant_referral_wallet_reward IS 'Credits wallet for successful referral.';

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_referral TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_promo_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_referral_wallet_reward TO authenticated;

COMMENT ON MIGRATION IS 'Promo codes & referral tracking with validation, usage limits, and wallet rewards.';

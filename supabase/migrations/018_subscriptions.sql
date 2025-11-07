-- Subscription Plans & Helper Pro System
-- Migration 018: Plans, helper subscriptions, feature gating, commission discounts

-- ============================================================================
-- ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'pending',      -- created but not billed yet
    'active',       -- currently in effect
    'past_due',     -- payment failed / grace period
    'cancelled',    -- user initiated or admin cancellation
    'expired'       -- reached end date (non-renewing)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE billing_interval AS ENUM ('monthly','quarterly','yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE feature_key AS ENUM (
    'priority_bidding',        -- earlier visibility in open requests
    'reduced_commission',      -- lower commission percent
    'highlight_profile',       -- visual badge / highlight
    'larger_radius',           -- extended service radius km
    'instant_payout',          -- faster withdrawal processing
    'premium_support'          -- priority support channel
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- SUBSCRIPTION PLANS (Admin managed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,                     -- short code e.g. HELPER_PRO_M
  name TEXT NOT NULL,
  description TEXT,
  interval billing_interval NOT NULL,
  price_rupees NUMERIC(10,2) NOT NULL,
  commission_discount_percent NUMERIC(5,2),      -- reduces base commission for helper
  extra_radius_km INTEGER,                       -- additional radius granted
  priority_level INTEGER DEFAULT 0,              -- higher = earlier ordering in find_nearby
  included_features feature_key[] DEFAULT ARRAY[]::feature_key[],
  is_active BOOLEAN DEFAULT TRUE,
  trial_days INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_interval ON public.subscription_plans(interval);

DROP TRIGGER IF EXISTS trg_update_subscription_plans ON public.subscription_plans;
CREATE TRIGGER trg_update_subscription_plans
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.helper_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  next_billing_at TIMESTAMPTZ,
  last_billing_at TIMESTAMPTZ,
  cashfree_subscription_id TEXT,              -- if using Cashfree recurring APIs
  renewal_order_id TEXT,                      -- payment_orders.order_id for current cycle
  interval billing_interval NOT NULL,
  price_rupees NUMERIC(10,2) NOT NULL,        -- snapshot of price at time of start
  applied_commission_discount_percent NUMERIC(5,2),
  applied_extra_radius_km INTEGER,
  applied_priority_level INTEGER,
  included_features feature_key[] DEFAULT ARRAY[]::feature_key[],
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_helper_subscriptions_helper ON public.helper_subscriptions(helper_id);
CREATE INDEX IF NOT EXISTS idx_helper_subscriptions_status ON public.helper_subscriptions(status);

DROP TRIGGER IF EXISTS trg_update_helper_subscriptions ON public.helper_subscriptions;
CREATE TRIGGER trg_update_helper_subscriptions
  BEFORE UPDATE ON public.helper_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.helper_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FEATURE OVERRIDES (ad-hoc grants – e.g. promo trials)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_feature_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature feature_key NOT NULL,
  value JSONB,                          -- e.g. {"radius_km": 25}
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_feature_overrides_helper ON public.subscription_feature_overrides(helper_id);

ALTER TABLE public.subscription_feature_overrides ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Plans: public can read active, admins manage
DROP POLICY IF EXISTS "Public read active plans" ON public.subscription_plans;
CREATE POLICY "Public read active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage plans" ON public.subscription_plans;
CREATE POLICY "Admins manage plans" ON public.subscription_plans
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Helper subscriptions: helpers view own, insert own via subscribe function, admins view all
DROP POLICY IF EXISTS "Helpers view own subscriptions" ON public.helper_subscriptions;
CREATE POLICY "Helpers view own subscriptions" ON public.helper_subscriptions
  FOR SELECT USING (helper_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all subscriptions" ON public.helper_subscriptions;
CREATE POLICY "Admins view all subscriptions" ON public.helper_subscriptions
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Helpers insert subscriptions" ON public.helper_subscriptions;
CREATE POLICY "Helpers insert subscriptions" ON public.helper_subscriptions
  FOR INSERT WITH CHECK (helper_id = auth.uid());

DROP POLICY IF EXISTS "Helpers cancel own active subscriptions" ON public.helper_subscriptions;
CREATE POLICY "Helpers cancel own active subscriptions" ON public.helper_subscriptions
  FOR UPDATE USING (helper_id = auth.uid() AND status IN ('active','pending','past_due'));

-- Feature overrides: helper sees own; admin manages
DROP POLICY IF EXISTS "Helpers view overrides" ON public.subscription_feature_overrides;
CREATE POLICY "Helpers view overrides" ON public.subscription_feature_overrides
  FOR SELECT USING (helper_id = auth.uid());

DROP POLICY IF EXISTS "System manage overrides" ON public.subscription_feature_overrides;
CREATE POLICY "System manage overrides" ON public.subscription_feature_overrides
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Admin create subscription plan
CREATE OR REPLACE FUNCTION public.create_subscription_plan(
  p_code TEXT,
  p_name TEXT,
  p_description TEXT,
  p_interval billing_interval,
  p_price_rupees NUMERIC(10,2),
  p_commission_discount_percent NUMERIC(5,2) DEFAULT NULL,
  p_extra_radius_km INTEGER DEFAULT NULL,
  p_priority_level INTEGER DEFAULT 0,
  p_features feature_key[] DEFAULT ARRAY[]::feature_key[],
  p_trial_days INTEGER DEFAULT 0
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  INSERT INTO public.subscription_plans (
    code,name,description,interval,price_rupees,commission_discount_percent,extra_radius_km,priority_level,included_features,trial_days,created_by
  ) VALUES (
    p_code,p_name,p_description,p_interval,p_price_rupees,p_commission_discount_percent,p_extra_radius_km,p_priority_level,p_features,p_trial_days,auth.uid()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;$$;

COMMENT ON FUNCTION public.create_subscription_plan IS 'Admin creates new subscription plan.';

-- Helper subscribes to plan (creates active subscription in pending state until payment confirmed)
CREATE OR REPLACE FUNCTION public.subscribe_helper(p_plan_code TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
  v_helper UUID := auth.uid();
  v_active_exists BOOLEAN;
  v_subscription_id UUID;
  v_trial_ends TIMESTAMPTZ;
BEGIN
  -- Load plan
  SELECT * INTO v_plan FROM public.subscription_plans WHERE code = p_plan_code AND is_active = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or inactive';
  END IF;

  -- Prevent duplicate active subscription for same interval plan (simplified rule)
  SELECT EXISTS (
    SELECT 1 FROM public.helper_subscriptions
    WHERE helper_id = v_helper AND status IN ('active','pending','past_due')
  ) INTO v_active_exists;

  IF v_active_exists THEN
    RAISE EXCEPTION 'Existing subscription active; cancel first';
  END IF;

  IF v_plan.trial_days > 0 THEN
    v_trial_ends := timezone('utc'::text, now()) + (v_plan.trial_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO public.helper_subscriptions (
    helper_id, plan_id, status, interval, price_rupees, applied_commission_discount_percent,
    applied_extra_radius_km, applied_priority_level, included_features, trial_ends_at
  ) VALUES (
    v_helper, v_plan.id, CASE WHEN v_plan.trial_days > 0 THEN 'active' ELSE 'pending' END, v_plan.interval,
    v_plan.price_rupees, v_plan.commission_discount_percent, v_plan.extra_radius_km, v_plan.priority_level,
    v_plan.included_features, v_trial_ends
  ) RETURNING id INTO v_subscription_id;

  -- Immediately allocate benefits (radius/priority) if trial active or payment confirmed later
  PERFORM public.allocate_subscription_benefits(v_subscription_id);

  RETURN v_subscription_id;
END;$$;

COMMENT ON FUNCTION public.subscribe_helper IS 'Helper initiates subscription to a plan.';

-- Allocate benefits to helper profile
CREATE OR REPLACE FUNCTION public.allocate_subscription_benefits(p_subscription_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub helper_subscriptions%ROWTYPE;
  v_radius INTEGER;
BEGIN
  SELECT * INTO v_sub FROM public.helper_subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Only allocate for active subscriptions
  IF v_sub.status NOT IN ('active','pending','past_due') THEN
    RETURN FALSE;
  END IF;

  -- Extend radius if specified (store as override record for auditable change)
  IF v_sub.applied_extra_radius_km IS NOT NULL THEN
    INSERT INTO public.subscription_feature_overrides (helper_id, feature, value, expires_at)
    VALUES (v_sub.helper_id, 'larger_radius', jsonb_build_object('extra_radius_km', v_sub.applied_extra_radius_km), v_sub.expires_at)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Other features simply recorded; actual enforcement done in application layer queries
  RETURN TRUE;
END;$$;

COMMENT ON FUNCTION public.allocate_subscription_benefits IS 'Writes overrides representing plan benefits for helper.';

-- Cancel subscription
CREATE OR REPLACE FUNCTION public.cancel_subscription(p_subscription_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_helper UUID := auth.uid();
BEGIN
  UPDATE public.helper_subscriptions
  SET status = 'cancelled', cancelled_at = timezone('utc'::text, now()), updated_at = timezone('utc'::text, now())
  WHERE id = p_subscription_id AND helper_id = v_helper AND status IN ('active','pending','past_due');

  RETURN FOUND;
END;$$;

COMMENT ON FUNCTION public.cancel_subscription IS 'Helper cancels own active/pending subscription.';

-- Get helper subscription status summary
CREATE OR REPLACE FUNCTION public.get_helper_subscription_status(p_helper_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  subscription_id UUID,
  plan_code TEXT,
  plan_name TEXT,
  status subscription_status,
  plan_interval billing_interval,
  price_rupees NUMERIC(10,2),
  commission_discount_percent NUMERIC(5,2),
  extra_radius_km INTEGER,
  priority_level INTEGER,
  included_features feature_key[],
  trial_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.id,
    sp.code,
    sp.name,
    hs.status,
  hs.interval AS plan_interval,
    hs.price_rupees,
    hs.applied_commission_discount_percent,
    hs.applied_extra_radius_km,
    hs.applied_priority_level,
    hs.included_features,
    hs.trial_ends_at,
    hs.expires_at
  FROM public.helper_subscriptions hs
  INNER JOIN public.subscription_plans sp ON sp.id = hs.plan_id
  WHERE hs.helper_id = p_helper_id
  ORDER BY hs.created_at DESC
  LIMIT 1;
END;$$;

COMMENT ON FUNCTION public.get_helper_subscription_status IS 'Returns latest subscription status for helper.';

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.create_subscription_plan TO authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_helper TO authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_subscription_benefits TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_helper_subscription_status TO authenticated;

COMMENT ON MIGRATION IS 'Subscription plans and helper subscriptions with feature gating & commission discounts.';

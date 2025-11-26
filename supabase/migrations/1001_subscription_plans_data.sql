-- Delete existing subscription data
DELETE FROM subscription_feature_overrides;
DELETE FROM helper_subscriptions;
DELETE FROM subscription_plans;

-- ============================================================================
-- SUBSCRIPTION PLANS FOR HELPERS
-- ============================================================================

-- 1. HELPER FREE PLAN (Default - No Charge)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('HELPER_FREE',
'Free Plan',
'Basic plan for helpers to get started. Standard commission applies with basic features.',
'monthly',
0.00,
0.00,
0,
0,
ARRAY[]::feature_key[],
true,
0);

-- 2. HELPER BASIC PLAN (Monthly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('HELPER_BASIC_M',
'Helper Basic - Monthly',
'Get more opportunities with reduced commission and extended service radius. Perfect for growing your business.',
'monthly',
299.00,
5.00,
5,
1,
ARRAY['reduced_commission', 'larger_radius']::feature_key[],
true,
7);

-- 3. HELPER PRO PLAN (Monthly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('HELPER_PRO_M',
'Helper Pro - Monthly',
'Maximize your earnings with priority bidding, profile highlighting, and significantly reduced commission.',
'monthly',
699.00,
10.00,
10,
3,
ARRAY['priority_bidding', 'reduced_commission', 'highlight_profile', 'larger_radius', 'premium_support']::feature_key[],
true,
14);

-- 4. HELPER PRO PLAN (Quarterly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('HELPER_PRO_Q',
'Helper Pro - Quarterly',
'Save 15% with quarterly billing. All Pro features included with extended service radius and priority support.',
'quarterly',
1799.00,
10.00,
10,
3,
ARRAY['priority_bidding', 'reduced_commission', 'highlight_profile', 'larger_radius', 'premium_support']::feature_key[],
true,
14);

-- 5. HELPER PREMIUM PLAN (Monthly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('HELPER_PREMIUM_M',
'Helper Premium - Monthly',
'Ultimate plan for professional helpers. Maximum commission discount, instant payouts, and top priority in all requests.',
'monthly',
1499.00,
15.00,
20,
5,
ARRAY['priority_bidding', 'reduced_commission', 'highlight_profile', 'larger_radius', 'instant_payout', 'premium_support']::feature_key[],
true,
14);

-- 6. HELPER PREMIUM PLAN (Quarterly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('HELPER_PREMIUM_Q',
'Helper Premium - Quarterly',
'Save 20% with quarterly billing. Ultimate benefits with instant payouts and maximum service radius.',
'quarterly',
3599.00,
15.00,
20,
5,
ARRAY['priority_bidding', 'reduced_commission', 'highlight_profile', 'larger_radius', 'instant_payout', 'premium_support']::feature_key[],
true,
14);

-- 7. HELPER PREMIUM PLAN (Yearly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('HELPER_PREMIUM_Y',
'Helper Premium - Yearly',
'Best value! Save 33% with annual billing. All premium features with maximum benefits for serious professionals.',
'yearly',
11999.00,
15.00,
20,
5,
ARRAY['priority_bidding', 'reduced_commission', 'highlight_profile', 'larger_radius', 'instant_payout', 'premium_support']::feature_key[],
true,
30);

-- ============================================================================
-- CUSTOMER SUBSCRIPTION PLANS (Additional tables needed)
-- ============================================================================

-- First, create customer_subscriptions table if it doesn't exist
-- This will be in a separate migration section below

-- 8. CUSTOMER FREE PLAN (Default)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('CUSTOMER_FREE',
'Free Plan',
'Standard access to all services. Book helpers and enjoy our platform at no monthly cost.',
'monthly',
0.00,
NULL,
0,
0,
ARRAY[]::feature_key[],
true,
0);

-- 9. CUSTOMER PLUS PLAN (Monthly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('CUSTOMER_PLUS_M',
'Customer Plus - Monthly',
'Get priority support and exclusive discounts on services. Perfect for regular users.',
'monthly',
199.00,
NULL,
0,
2,
ARRAY['premium_support']::feature_key[],
true,
7);

-- 10. CUSTOMER PREMIUM PLAN (Monthly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('CUSTOMER_PREMIUM_M',
'Customer Premium - Monthly',
'Premium experience with priority booking, dedicated support, and special offers on bundles.',
'monthly',
499.00,
NULL,
0,
4,
ARRAY['priority_bidding', 'premium_support']::feature_key[],
true,
14);

-- 11. CUSTOMER PREMIUM PLAN (Quarterly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('CUSTOMER_PREMIUM_Q',
'Customer Premium - Quarterly',
'Save 17% with quarterly billing. Enjoy premium benefits and exclusive service discounts.',
'quarterly',
1249.00,
NULL,
0,
4,
ARRAY['priority_bidding', 'premium_support']::feature_key[],
true,
14);

-- 12. CUSTOMER PREMIUM PLAN (Yearly)
INSERT INTO subscription_plans (code, name, description, interval, price_rupees, commission_discount_percent, extra_radius_km, priority_level, included_features, is_active, trial_days) VALUES
('CUSTOMER_PREMIUM_Y',
'Customer Premium - Yearly',
'Best value! Save 33% with annual billing. Maximum benefits for frequent service users.',
'yearly',
3999.00,
NULL,
0,
4,
ARRAY['priority_bidding', 'premium_support']::feature_key[],
true,
30);

-- ============================================================================
-- CREATE CUSTOMER SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  next_billing_at TIMESTAMPTZ,
  last_billing_at TIMESTAMPTZ,
  cashfree_subscription_id TEXT,
  renewal_order_id TEXT,
  interval billing_interval NOT NULL,
  price_rupees NUMERIC(10,2) NOT NULL,
  applied_priority_level INTEGER,
  included_features feature_key[] DEFAULT ARRAY[]::feature_key[],
  trial_ends_at TIMESTAMPTZ,
  discount_percent NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_customer ON public.customer_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_status ON public.customer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_expires ON public.customer_subscriptions(expires_at);

DROP TRIGGER IF EXISTS trg_update_customer_subscriptions ON public.customer_subscriptions;
CREATE TRIGGER trg_update_customer_subscriptions
  BEFORE UPDATE ON public.customer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE SUBSCRIPTION BENEFITS TABLE (Track specific perks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  benefit_type TEXT NOT NULL CHECK (benefit_type IN ('service_discount', 'bundle_discount', 'free_booking', 'cashback', 'priority_support', 'extended_warranty')),
  benefit_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscription_benefits_plan ON public.subscription_benefits(plan_id);

DROP TRIGGER IF EXISTS trg_update_subscription_benefits ON public.subscription_benefits;
CREATE TRIGGER trg_update_subscription_benefits
  BEFORE UPDATE ON public.subscription_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.subscription_benefits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE SUBSCRIPTION USAGE TABLE (Track feature usage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('helper', 'customer')),
  feature_used feature_key NOT NULL,
  usage_count INTEGER DEFAULT 1,
  metadata JSONB,
  used_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription ON public.subscription_usage(subscription_id, subscription_type);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_feature ON public.subscription_usage(feature_used);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_used_at ON public.subscription_usage(used_at);

ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INSERT SUBSCRIPTION BENEFITS DATA
-- ============================================================================

-- Helper Basic Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'service_discount', '{"discount_percent": 5}'::jsonb, '5% reduced commission on all jobs' FROM subscription_plans WHERE code = 'HELPER_BASIC_M'
UNION ALL
SELECT id, 'extended_warranty', '{"extra_km": 5}'::jsonb, 'Extended service radius by 5km' FROM subscription_plans WHERE code = 'HELPER_BASIC_M';

-- Helper Pro Monthly Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'service_discount', '{"discount_percent": 10}'::jsonb, '10% reduced commission on all jobs' FROM subscription_plans WHERE code = 'HELPER_PRO_M'
UNION ALL
SELECT id, 'priority_support', '{"priority_level": 3}'::jsonb, 'Priority bidding and profile highlight' FROM subscription_plans WHERE code = 'HELPER_PRO_M'
UNION ALL
SELECT id, 'extended_warranty', '{"extra_km": 10}'::jsonb, 'Extended service radius by 10km' FROM subscription_plans WHERE code = 'HELPER_PRO_M';

-- Helper Pro Quarterly Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'service_discount', '{"discount_percent": 10, "quarterly_savings": 15}'::jsonb, '10% reduced commission + 15% plan savings' FROM subscription_plans WHERE code = 'HELPER_PRO_Q'
UNION ALL
SELECT id, 'priority_support', '{"priority_level": 3}'::jsonb, 'Priority bidding and profile highlight' FROM subscription_plans WHERE code = 'HELPER_PRO_Q'
UNION ALL
SELECT id, 'extended_warranty', '{"extra_km": 10}'::jsonb, 'Extended service radius by 10km' FROM subscription_plans WHERE code = 'HELPER_PRO_Q';

-- Helper Premium Monthly Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'service_discount', '{"discount_percent": 15}'::jsonb, '15% reduced commission on all jobs' FROM subscription_plans WHERE code = 'HELPER_PREMIUM_M'
UNION ALL
SELECT id, 'priority_support', '{"priority_level": 5, "instant_payout": true}'::jsonb, 'Top priority and instant payouts' FROM subscription_plans WHERE code = 'HELPER_PREMIUM_M'
UNION ALL
SELECT id, 'extended_warranty', '{"extra_km": 20}'::jsonb, 'Extended service radius by 20km' FROM subscription_plans WHERE code = 'HELPER_PREMIUM_M';

-- Helper Premium Quarterly Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'service_discount', '{"discount_percent": 15, "quarterly_savings": 20}'::jsonb, '15% reduced commission + 20% plan savings' FROM subscription_plans WHERE code = 'HELPER_PREMIUM_Q'
UNION ALL
SELECT id, 'priority_support', '{"priority_level": 5, "instant_payout": true}'::jsonb, 'Top priority and instant payouts' FROM subscription_plans WHERE code = 'HELPER_PREMIUM_Q'
UNION ALL
SELECT id, 'extended_warranty', '{"extra_km": 20}'::jsonb, 'Extended service radius by 20km' FROM subscription_plans WHERE code = 'HELPER_PREMIUM_Q';

-- Helper Premium Yearly Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'service_discount', '{"discount_percent": 15, "yearly_savings": 33}'::jsonb, '15% reduced commission + 33% plan savings' FROM subscription_plans WHERE code = 'HELPER_PREMIUM_Y'
UNION ALL
SELECT id, 'priority_support', '{"priority_level": 5, "instant_payout": true}'::jsonb, 'Top priority and instant payouts' FROM subscription_plans WHERE code = 'HELPER_PREMIUM_Y'
UNION ALL
SELECT id, 'extended_warranty', '{"extra_km": 20}'::jsonb, 'Extended service radius by 20km' FROM subscription_plans WHERE code = 'HELPER_PREMIUM_Y';

-- Customer Plus Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'priority_support', '{"priority_level": 2}'::jsonb, 'Priority customer support' FROM subscription_plans WHERE code = 'CUSTOMER_PLUS_M'
UNION ALL
SELECT id, 'service_discount', '{"discount_percent": 3}'::jsonb, '3% discount on selected services' FROM subscription_plans WHERE code = 'CUSTOMER_PLUS_M';

-- Customer Premium Monthly Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'priority_support', '{"priority_level": 4}'::jsonb, 'Premium customer support and priority booking' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_M'
UNION ALL
SELECT id, 'service_discount', '{"discount_percent": 5}'::jsonb, '5% discount on all services' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_M'
UNION ALL
SELECT id, 'bundle_discount', '{"discount_percent": 10}'::jsonb, '10% extra discount on service bundles' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_M'
UNION ALL
SELECT id, 'cashback', '{"cashback_percent": 2}'::jsonb, '2% cashback on all bookings' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_M';

-- Customer Premium Quarterly Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'priority_support', '{"priority_level": 4}'::jsonb, 'Premium customer support and priority booking' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_Q'
UNION ALL
SELECT id, 'service_discount', '{"discount_percent": 5, "quarterly_savings": 17}'::jsonb, '5% service discount + 17% plan savings' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_Q'
UNION ALL
SELECT id, 'bundle_discount', '{"discount_percent": 10}'::jsonb, '10% extra discount on service bundles' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_Q'
UNION ALL
SELECT id, 'cashback', '{"cashback_percent": 2}'::jsonb, '2% cashback on all bookings' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_Q';

-- Customer Premium Yearly Benefits
INSERT INTO subscription_benefits (plan_id, benefit_type, benefit_value, description)
SELECT id, 'priority_support', '{"priority_level": 4}'::jsonb, 'Premium customer support and priority booking' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_Y'
UNION ALL
SELECT id, 'service_discount', '{"discount_percent": 7, "yearly_savings": 33}'::jsonb, '7% service discount + 33% plan savings' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_Y'
UNION ALL
SELECT id, 'bundle_discount', '{"discount_percent": 15}'::jsonb, '15% extra discount on service bundles' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_Y'
UNION ALL
SELECT id, 'cashback', '{"cashback_percent": 3}'::jsonb, '3% cashback on all bookings' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_Y'
UNION ALL
SELECT id, 'free_booking', '{"free_bookings_per_month": 1}'::jsonb, '1 free service booking per month (up to ₹500)' FROM subscription_plans WHERE code = 'CUSTOMER_PREMIUM_Y';

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Customer Subscriptions Policies
DROP POLICY IF EXISTS "Customers view own subscriptions" ON public.customer_subscriptions;
CREATE POLICY "Customers view own subscriptions" ON public.customer_subscriptions
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all customer subscriptions" ON public.customer_subscriptions;
CREATE POLICY "Admins view all customer subscriptions" ON public.customer_subscriptions
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customers insert subscriptions" ON public.customer_subscriptions;
CREATE POLICY "Customers insert subscriptions" ON public.customer_subscriptions
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers cancel own subscriptions" ON public.customer_subscriptions;
CREATE POLICY "Customers cancel own subscriptions" ON public.customer_subscriptions
  FOR UPDATE USING (customer_id = auth.uid() AND status IN ('active','pending','past_due'));

-- Subscription Benefits Policies
DROP POLICY IF EXISTS "Public read active benefits" ON public.subscription_benefits;
CREATE POLICY "Public read active benefits" ON public.subscription_benefits
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage benefits" ON public.subscription_benefits;
CREATE POLICY "Admins manage benefits" ON public.subscription_benefits
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Subscription Usage Policies
DROP POLICY IF EXISTS "Users view own usage" ON public.subscription_usage;
CREATE POLICY "Users view own usage" ON public.subscription_usage
  FOR SELECT USING (
    (subscription_type = 'helper' AND subscription_id IN (SELECT id FROM helper_subscriptions WHERE helper_id = auth.uid()))
    OR
    (subscription_type = 'customer' AND subscription_id IN (SELECT id FROM customer_subscriptions WHERE customer_id = auth.uid()))
  );

DROP POLICY IF EXISTS "System insert usage" ON public.subscription_usage;
CREATE POLICY "System insert usage" ON public.subscription_usage
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view all usage" ON public.subscription_usage;
CREATE POLICY "Admins view all usage" ON public.subscription_usage
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ============================================================================
-- HELPER FUNCTIONS FOR CUSTOMERS
-- ============================================================================

-- Customer subscribes to plan
CREATE OR REPLACE FUNCTION public.subscribe_customer(p_plan_code TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
  v_customer UUID := auth.uid();
  v_active_exists BOOLEAN;
  v_subscription_id UUID;
  v_trial_ends TIMESTAMPTZ;
BEGIN
  -- Load plan
  SELECT * INTO v_plan FROM public.subscription_plans WHERE code = p_plan_code AND is_active = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or inactive';
  END IF;

  -- Check if plan is for customers
  IF v_plan.code NOT LIKE 'CUSTOMER_%' THEN
    RAISE EXCEPTION 'Invalid plan for customers';
  END IF;

  -- Prevent duplicate active subscription
  SELECT EXISTS (
    SELECT 1 FROM public.customer_subscriptions
    WHERE customer_id = v_customer AND status IN ('active','pending','past_due')
  ) INTO v_active_exists;

  IF v_active_exists THEN
    RAISE EXCEPTION 'Existing subscription active; cancel first';
  END IF;

  IF v_plan.trial_days > 0 THEN
    v_trial_ends := timezone('utc'::text, now()) + (v_plan.trial_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO public.customer_subscriptions (
    customer_id, plan_id, status, interval, price_rupees,
    applied_priority_level, included_features, trial_ends_at
  ) VALUES (
    v_customer, v_plan.id, CASE WHEN v_plan.trial_days > 0 THEN 'active' ELSE 'pending' END, v_plan.interval,
    v_plan.price_rupees, v_plan.priority_level, v_plan.included_features, v_trial_ends
  ) RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;$$;

COMMENT ON FUNCTION public.subscribe_customer IS 'Customer initiates subscription to a plan.';

-- Cancel customer subscription
CREATE OR REPLACE FUNCTION public.cancel_customer_subscription(p_subscription_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_customer UUID := auth.uid();
BEGIN
  UPDATE public.customer_subscriptions
  SET status = 'cancelled', cancelled_at = timezone('utc'::text, now()), updated_at = timezone('utc'::text, now())
  WHERE id = p_subscription_id AND customer_id = v_customer AND status IN ('active','pending','past_due');

  RETURN FOUND;
END;$$;

COMMENT ON FUNCTION public.cancel_customer_subscription IS 'Customer cancels own active/pending subscription.';

-- Get customer subscription status
CREATE OR REPLACE FUNCTION public.get_customer_subscription_status(p_customer_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  subscription_id UUID,
  plan_code TEXT,
  plan_name TEXT,
  status subscription_status,
  plan_interval billing_interval,
  price_rupees NUMERIC(10,2),
  priority_level INTEGER,
  included_features feature_key[],
  trial_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    sp.code,
    sp.name,
    cs.status,
    cs.interval AS plan_interval,
    cs.price_rupees,
    cs.applied_priority_level,
    cs.included_features,
    cs.trial_ends_at,
    cs.expires_at
  FROM public.customer_subscriptions cs
  INNER JOIN public.subscription_plans sp ON sp.id = cs.plan_id
  WHERE cs.customer_id = p_customer_id
  ORDER BY cs.created_at DESC
  LIMIT 1;
END;$$;

COMMENT ON FUNCTION public.get_customer_subscription_status IS 'Returns latest subscription status for customer.';

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.subscribe_customer TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_customer_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_subscription_status TO authenticated;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Helper Plans:
--   1. Free (₹0) - No benefits
--   2. Basic Monthly (₹299) - 5% commission discount, 5km extra radius, 7 day trial
--   3. Pro Monthly (₹699) - 10% commission discount, 10km extra radius, priority, 14 day trial
--   4. Pro Quarterly (₹1799) - Same as Pro Monthly with 15% savings
--   5. Premium Monthly (₹1499) - 15% commission discount, 20km radius, instant payout, 14 day trial
--   6. Premium Quarterly (₹3599) - Same as Premium Monthly with 20% savings
--   7. Premium Yearly (₹11999) - Same as Premium Monthly with 33% savings, 30 day trial
--
-- Customer Plans:
--   8. Free (₹0) - Standard access
--   9. Plus Monthly (₹199) - Priority support, 3% service discount, 7 day trial
--   10. Premium Monthly (₹499) - 5% service discount, 10% bundle discount, 2% cashback, 14 day trial
--   11. Premium Quarterly (₹1249) - Same as Premium Monthly with 17% savings
--   12. Premium Yearly (₹3999) - 7% service discount, 15% bundle discount, 3% cashback, 1 free booking/month, 30 day trial
--
-- New Tables Created:
--   - customer_subscriptions (tracks customer subscription status)
--   - subscription_benefits (detailed benefits for each plan)
--   - subscription_usage (tracks feature usage for analytics)

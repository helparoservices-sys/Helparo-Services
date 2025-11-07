-- Service Bundles & Seasonal Campaigns
-- Migration 023: Bundle packages and promotional campaigns

-- ============================================================================
-- SERVICE BUNDLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  bundle_type TEXT NOT NULL CHECK (bundle_type IN ('combo', 'package', 'subscription', 'seasonal')),
  total_original_price DECIMAL(10,2) NOT NULL,
  bundle_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_original_price > 0 THEN 
        ((total_original_price - bundle_price) / total_original_price) * 100
      ELSE 0 
    END
  ) STORED,
  validity_days INTEGER, -- null means unlimited
  max_redemptions INTEGER, -- null means unlimited
  is_active BOOLEAN DEFAULT TRUE,
  icon_url TEXT,
  banner_url TEXT,
  terms_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bundles_type ON public.service_bundles(bundle_type);
CREATE INDEX IF NOT EXISTS idx_bundles_active ON public.service_bundles(is_active);

DROP TRIGGER IF EXISTS trg_update_bundles ON public.service_bundles;
CREATE TRIGGER trg_update_bundles
  BEFORE UPDATE ON public.service_bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.service_bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view active bundles" ON public.service_bundles;
CREATE POLICY "Anyone view active bundles" ON public.service_bundles
  FOR SELECT USING (is_active = TRUE);

COMMENT ON TABLE public.service_bundles IS 'Service bundle packages with combo pricing';

-- ============================================================================
-- BUNDLE SERVICES (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bundle_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_id UUID NOT NULL REFERENCES public.service_bundles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  individual_price DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(bundle_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_services_bundle ON public.bundle_services(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_services_category ON public.bundle_services(category_id);

ALTER TABLE public.bundle_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view bundle services" ON public.bundle_services;
CREATE POLICY "Anyone view bundle services" ON public.bundle_services
  FOR SELECT USING (true);

-- ============================================================================
-- BUNDLE PURCHASES (user redemptions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bundle_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_id UUID NOT NULL REFERENCES public.service_bundles(id),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  purchase_price DECIMAL(10,2) NOT NULL,
  payment_id UUID REFERENCES public.payment_orders(id),
  valid_until TIMESTAMPTZ,
  services_used INTEGER DEFAULT 0,
  services_total INTEGER NOT NULL,
  is_expired BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bundle_purchases_customer ON public.bundle_purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_bundle_purchases_bundle ON public.bundle_purchases(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_purchases_valid ON public.bundle_purchases(valid_until);

DROP TRIGGER IF EXISTS trg_update_bundle_purchases ON public.bundle_purchases;
CREATE TRIGGER trg_update_bundle_purchases
  BEFORE UPDATE ON public.bundle_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.bundle_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own purchases" ON public.bundle_purchases;
CREATE POLICY "Users view own purchases" ON public.bundle_purchases
  FOR SELECT USING (customer_id = auth.uid());

-- ============================================================================
-- SEASONAL CAMPAIGNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.seasonal_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('festival', 'monsoon', 'summer', 'winter', 'new_year', 'special_event', 'flash_sale')),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat', 'bundle')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  applicable_to TEXT NOT NULL CHECK (applicable_to IN ('all_services', 'specific_services', 'specific_categories')),
  target_user_segment TEXT CHECK (target_user_segment IN ('all', 'new_users', 'existing_users', 'premium_users', 'inactive_users')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  banner_url TEXT,
  terms_conditions TEXT,
  max_redemptions_per_user INTEGER DEFAULT 1,
  total_redemptions INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_type ON public.seasonal_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.seasonal_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON public.seasonal_campaigns(is_active);

DROP TRIGGER IF EXISTS trg_update_campaigns ON public.seasonal_campaigns;
CREATE TRIGGER trg_update_campaigns
  BEFORE UPDATE ON public.seasonal_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.seasonal_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view active campaigns" ON public.seasonal_campaigns;
CREATE POLICY "Anyone view active campaigns" ON public.seasonal_campaigns
  FOR SELECT USING (
    is_active = TRUE 
    AND start_date <= timezone('utc'::text, now())
    AND end_date >= timezone('utc'::text, now())
  );

COMMENT ON TABLE public.seasonal_campaigns IS 'Festival and seasonal promotional campaigns';

-- ============================================================================
-- CAMPAIGN APPLICABLE SERVICES (for specific_services/categories)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaign_applicable_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.seasonal_campaigns(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_campaign_services_campaign ON public.campaign_applicable_services(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_services_category ON public.campaign_applicable_services(category_id);

ALTER TABLE public.campaign_applicable_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view campaign services" ON public.campaign_applicable_services;
CREATE POLICY "Anyone view campaign services" ON public.campaign_applicable_services
  FOR SELECT USING (true);

-- ============================================================================
-- CAMPAIGN REDEMPTIONS (usage tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaign_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.seasonal_campaigns(id),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  request_id UUID REFERENCES public.service_requests(id),
  discount_applied DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_campaign_redemptions_campaign ON public.campaign_redemptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_redemptions_customer ON public.campaign_redemptions(customer_id);

ALTER TABLE public.campaign_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own redemptions" ON public.campaign_redemptions;
CREATE POLICY "Users view own redemptions" ON public.campaign_redemptions
  FOR SELECT USING (customer_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Get active campaigns for service
CREATE OR REPLACE FUNCTION public.get_active_campaigns_for_service(
  p_category_id UUID,
  p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  discount_type TEXT,
  discount_value DECIMAL,
  max_discount DECIMAL,
  end_date TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.name,
    sc.discount_type,
    sc.discount_value,
    sc.max_discount_amount,
    sc.end_date
  FROM public.seasonal_campaigns sc
  WHERE sc.is_active = TRUE
    AND sc.start_date <= timezone('utc'::text, now())
    AND sc.end_date >= timezone('utc'::text, now())
    AND (
      sc.applicable_to = 'all_services'
      OR (
        sc.applicable_to = 'specific_categories'
        AND EXISTS (
          SELECT 1 FROM public.campaign_applicable_services
          WHERE campaign_id = sc.id AND category_id = p_category_id
        )
      )
    )
    -- Check user redemption limit
    AND (
      p_user_id IS NULL
      OR (
        SELECT COUNT(*) FROM public.campaign_redemptions
        WHERE campaign_id = sc.id AND customer_id = p_user_id
      ) < sc.max_redemptions_per_user
    )
  ORDER BY sc.discount_value DESC;
END;$$;

-- Purchase bundle
CREATE OR REPLACE FUNCTION public.purchase_bundle(
  p_bundle_id UUID,
  p_customer_id UUID,
  p_payment_id UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bundle_price DECIMAL(10,2);
  v_validity_days INTEGER;
  v_valid_until TIMESTAMPTZ;
  v_services_count INTEGER;
  v_purchase_id UUID;
BEGIN
  -- Get bundle details
  SELECT bundle_price, validity_days
  INTO v_bundle_price, v_validity_days
  FROM public.service_bundles
  WHERE id = p_bundle_id AND is_active = TRUE;

  IF v_bundle_price IS NULL THEN
    RAISE EXCEPTION 'Bundle not found or inactive';
  END IF;

  -- Calculate validity
  IF v_validity_days IS NOT NULL THEN
    v_valid_until := timezone('utc'::text, now()) + (v_validity_days || ' days')::INTERVAL;
  END IF;

  -- Count services in bundle
  SELECT COUNT(*) INTO v_services_count
  FROM public.bundle_services
  WHERE bundle_id = p_bundle_id;

  -- Create purchase
  INSERT INTO public.bundle_purchases (
    bundle_id, customer_id, purchase_price, payment_id,
    valid_until, services_total
  ) VALUES (
    p_bundle_id, p_customer_id, v_bundle_price, p_payment_id,
    v_valid_until, v_services_count
  ) RETURNING id INTO v_purchase_id;

  -- Award loyalty points (10% of purchase)
  PERFORM public.award_loyalty_points(
    p_customer_id,
    (v_bundle_price * 0.10)::INTEGER,
    'booking',
    v_purchase_id,
    'Bundle purchase: ' || (SELECT name FROM public.service_bundles WHERE id = p_bundle_id)
  );

  RETURN v_purchase_id;
END;$$;

-- Apply campaign discount
CREATE OR REPLACE FUNCTION public.apply_campaign_discount(
  p_campaign_id UUID,
  p_customer_id UUID,
  p_request_id UUID,
  p_original_amount DECIMAL
) RETURNS DECIMAL
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_discount_type TEXT;
  v_discount_value DECIMAL;
  v_max_discount DECIMAL;
  v_discount_amount DECIMAL;
  v_final_amount DECIMAL;
BEGIN
  -- Get campaign details
  SELECT discount_type, discount_value, max_discount_amount
  INTO v_discount_type, v_discount_value, v_max_discount
  FROM public.seasonal_campaigns
  WHERE id = p_campaign_id
    AND is_active = TRUE
    AND start_date <= timezone('utc'::text, now())
    AND end_date >= timezone('utc'::text, now());

  IF v_discount_type IS NULL THEN
    RAISE EXCEPTION 'Campaign not found or expired';
  END IF;

  -- Calculate discount
  IF v_discount_type = 'percentage' THEN
    v_discount_amount := (p_original_amount * v_discount_value / 100);
    IF v_max_discount IS NOT NULL THEN
      v_discount_amount := LEAST(v_discount_amount, v_max_discount);
    END IF;
  ELSIF v_discount_type = 'flat' THEN
    v_discount_amount := v_discount_value;
  END IF;

  v_final_amount := GREATEST(p_original_amount - v_discount_amount, 0);

  -- Record redemption
  INSERT INTO public.campaign_redemptions (
    campaign_id, customer_id, request_id,
    discount_applied, original_amount, final_amount
  ) VALUES (
    p_campaign_id, p_customer_id, p_request_id,
    v_discount_amount, p_original_amount, v_final_amount
  );

  -- Update campaign stats
  UPDATE public.seasonal_campaigns
  SET total_redemptions = total_redemptions + 1,
      total_revenue = total_revenue + v_final_amount
  WHERE id = p_campaign_id;

  RETURN v_final_amount;
END;$$;

-- Get bundle details with services
CREATE OR REPLACE FUNCTION public.get_bundle_details(p_bundle_id UUID)
RETURNS TABLE (
  bundle_name TEXT,
  bundle_description TEXT,
  bundle_type TEXT,
  original_price DECIMAL,
  bundle_price DECIMAL,
  discount_pct DECIMAL,
  category_name TEXT,
  service_qty INTEGER,
  service_price DECIMAL
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sb.name,
    sb.description,
    sb.bundle_type,
    sb.total_original_price,
    sb.bundle_price,
    sb.discount_percentage,
    sc.name,
    bs.quantity,
    bs.individual_price
  FROM public.service_bundles sb
  INNER JOIN public.bundle_services bs ON bs.bundle_id = sb.id
  INNER JOIN public.service_categories sc ON sc.id = bs.category_id
  WHERE sb.id = p_bundle_id
  ORDER BY bs.sort_order;
END;$$;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================
-- Insert sample bundles
DO $$
DECLARE
  v_bundle_id UUID;
  v_cleaning_id UUID;
  v_pest_id UUID;
BEGIN
  -- Get category IDs (if they exist)
  SELECT id INTO v_cleaning_id FROM public.service_categories WHERE slug = 'cleaning' LIMIT 1;
  SELECT id INTO v_pest_id FROM public.service_categories WHERE slug = 'pest-control' LIMIT 1;

  IF v_cleaning_id IS NOT NULL THEN
    -- Spring Cleaning Package
    INSERT INTO public.service_bundles (
      name, description, bundle_type,
      total_original_price, bundle_price, validity_days, icon_url
    ) VALUES (
      'Spring Cleaning Package',
      'Complete home refresh with cleaning services',
      'package',
      2500, 1999, 30,
      '/bundles/spring-cleaning.png'
    ) RETURNING id INTO v_bundle_id;

    INSERT INTO public.bundle_services (bundle_id, category_id, quantity, individual_price) VALUES
      (v_bundle_id, v_cleaning_id, 2, 1250);
    
    IF v_pest_id IS NOT NULL THEN
      INSERT INTO public.bundle_services (bundle_id, category_id, quantity, individual_price) VALUES
        (v_bundle_id, v_pest_id, 1, 500);
    END IF;
  END IF;
END $$;

-- Insert sample campaign
INSERT INTO public.seasonal_campaigns (
  name, description, campaign_type, discount_type, discount_value,
  min_order_amount, max_discount_amount, applicable_to, target_user_segment,
  start_date, end_date, banner_url
) VALUES (
  'Diwali Festival Sale',
  'Celebrate Diwali with 25% off on all home services',
  'festival',
  'percentage',
  25,
  500,
  500,
  'all_services',
  'all',
  timezone('utc'::text, now()),
  timezone('utc'::text, now()) + INTERVAL '30 days',
  '/campaigns/diwali-2024.jpg'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_active_campaigns_for_service TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_bundle TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_campaign_discount TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bundle_details TO authenticated;

COMMENT ON MIGRATION IS 'Service bundles and seasonal campaigns for promotions and package deals';

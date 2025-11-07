-- Enhanced Service Schema with Dynamic Pricing, Location Types, and Urgency Levels
-- Migration 011: Comprehensive service system upgrade

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Location type for service delivery
DO $$ BEGIN
  CREATE TYPE location_type AS ENUM ('home', 'shop', 'on_highway', 'remote');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Urgency level affecting pricing
DO $$ BEGIN
  CREATE TYPE urgency_level AS ENUM ('normal', 'urgent', 'emergency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Price structure type
DO $$ BEGIN
  CREATE TYPE price_type AS ENUM ('per_hour', 'per_unit', 'per_sqft', 'per_room', 'fixed', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- ENHANCED SERVICE CATEGORIES
-- ============================================================================

-- Add columns to service_categories for detailed pricing
ALTER TABLE public.service_categories
  ADD COLUMN IF NOT EXISTS price_type price_type DEFAULT 'per_hour',
  ADD COLUMN IF NOT EXISTS unit_name TEXT, -- e.g., 'foot', 'tap', 'switch', 'room'
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2), -- Base price for this service type
  ADD COLUMN IF NOT EXISTS icon TEXT, -- Icon name for UI
  ADD COLUMN IF NOT EXISTS image_url TEXT, -- Category image
  ADD COLUMN IF NOT EXISTS requires_location BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS supports_emergency BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_service_categories_display_order 
  ON public.service_categories(display_order);

COMMENT ON COLUMN public.service_categories.price_type IS 'How this service is priced';
COMMENT ON COLUMN public.service_categories.unit_name IS 'Unit for pricing (foot, tap, room, etc.)';
COMMENT ON COLUMN public.service_categories.base_price IS 'Base price before customization';
COMMENT ON COLUMN public.service_categories.supports_emergency IS 'Can be booked as emergency service';

-- ============================================================================
-- ENHANCED SERVICE REQUESTS
-- ============================================================================

-- Add comprehensive fields to service_requests
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS location_type location_type DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS urgency_level urgency_level DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS service_type_details JSONB DEFAULT '{}', -- Specific service details
  ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1, -- Number of units
  ADD COLUMN IF NOT EXISTS estimated_price DECIMAL(10,2), -- Calculated estimate
  ADD COLUMN IF NOT EXISTS surge_multiplier DECIMAL(5,2) DEFAULT 1.0, -- For surge pricing
  ADD COLUMN IF NOT EXISTS preferred_date DATE,
  ADD COLUMN IF NOT EXISTS preferred_time_start TIME,
  ADD COLUMN IF NOT EXISTS preferred_time_end TIME,
  ADD COLUMN IF NOT EXISTS is_flexible BOOLEAN DEFAULT TRUE, -- Flexible with timing
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}', -- Array of image URLs
  ADD COLUMN IF NOT EXISTS assigned_helper_id UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_service_requests_location 
  ON public.service_requests(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_service_requests_urgency 
  ON public.service_requests(urgency_level);

CREATE INDEX IF NOT EXISTS idx_service_requests_location_type 
  ON public.service_requests(location_type);

CREATE INDEX IF NOT EXISTS idx_service_requests_preferred_date 
  ON public.service_requests(preferred_date);

CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_helper 
  ON public.service_requests(assigned_helper_id);

COMMENT ON COLUMN public.service_requests.location_type IS 'Where service will be performed';
COMMENT ON COLUMN public.service_requests.urgency_level IS 'Urgency affecting pricing and matching';
COMMENT ON COLUMN public.service_requests.service_type_details IS 'JSON with specific service requirements (e.g., pipe_length, number_of_taps)';
COMMENT ON COLUMN public.service_requests.surge_multiplier IS '1.0 = normal, 1.5 = 50% surge, 2.0 = double price';
COMMENT ON COLUMN public.service_requests.assigned_helper_id IS 'Helper assigned to this request';

-- ============================================================================
-- ENHANCED HELPER SERVICES
-- ============================================================================

-- Add detailed pricing and service info to helper_services
ALTER TABLE public.helper_services
  ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10,2), -- Helper's custom price for this service
  ADD COLUMN IF NOT EXISTS price_type price_type DEFAULT 'per_hour',
  ADD COLUMN IF NOT EXISTS min_price DECIMAL(10,2), -- Minimum job price
  ADD COLUMN IF NOT EXISTS service_description TEXT,
  ADD COLUMN IF NOT EXISTS supports_emergency BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS emergency_price_multiplier DECIMAL(5,2) DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER DEFAULT 60, -- Typical response time
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.helper_services.custom_price IS 'Helper-specific pricing (overrides category base_price)';
COMMENT ON COLUMN public.helper_services.min_price IS 'Minimum charge regardless of job size';
COMMENT ON COLUMN public.helper_services.emergency_price_multiplier IS 'Multiplier for emergency bookings';

-- ============================================================================
-- ENHANCED HELPER PROFILES
-- ============================================================================

-- Add location and availability fields to helper_profiles
ALTER TABLE public.helper_profiles
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 10, -- How far they'll travel
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
  ADD COLUMN IF NOT EXISTS service_areas TEXT[] DEFAULT '{}', -- Array of areas they serve
  ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"monday":{"start":"09:00","end":"18:00","available":true},"tuesday":{"start":"09:00","end":"18:00","available":true},"wednesday":{"start":"09:00","end":"18:00","available":true},"thursday":{"start":"09:00","end":"18:00","available":true},"friday":{"start":"09:00","end":"18:00","available":true},"saturday":{"start":"09:00","end":"18:00","available":true},"sunday":{"start":"09:00","end":"18:00","available":false}}',
  ADD COLUMN IF NOT EXISTS emergency_availability BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_available_now BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS skills_specialization TEXT[] DEFAULT '{}', -- Array of skills
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
  ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_rate_percent DECIMAL(5,2) DEFAULT 100.0,
  ADD COLUMN IF NOT EXISTS completion_rate_percent DECIMAL(5,2) DEFAULT 100.0,
  ADD COLUMN IF NOT EXISTS average_response_minutes INTEGER;

CREATE INDEX IF NOT EXISTS idx_helper_profiles_location 
  ON public.helper_profiles(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_helper_profiles_available 
  ON public.helper_profiles(is_available_now);

CREATE INDEX IF NOT EXISTS idx_helper_profiles_emergency 
  ON public.helper_profiles(emergency_availability);

COMMENT ON COLUMN public.helper_profiles.service_radius_km IS 'Maximum distance helper will travel';
COMMENT ON COLUMN public.helper_profiles.working_hours IS 'JSON with weekly schedule';
COMMENT ON COLUMN public.helper_profiles.is_available_now IS 'Currently accepting jobs';
COMMENT ON COLUMN public.helper_profiles.skills_specialization IS 'Specific skills (e.g., pipe_welding, ac_repair)';

-- ============================================================================
-- ENHANCED PHONE NUMBER SUPPORT
-- ============================================================================

-- Add phone fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(5) DEFAULT '+91', -- India default
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_phone 
  ON public.profiles(country_code, phone_number);

COMMENT ON COLUMN public.profiles.country_code IS 'Country calling code (e.g., +91 for India)';
COMMENT ON COLUMN public.profiles.phone_number IS 'Phone number without country code';

-- ============================================================================
-- SURGE PRICING RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.surge_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
  urgency_level urgency_level,
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday), NULL = all days
  hour_start TIME,
  hour_end TIME,
  multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_surge_rules_category 
  ON public.surge_pricing_rules(category_id);

CREATE INDEX IF NOT EXISTS idx_surge_rules_active 
  ON public.surge_pricing_rules(is_active);

DROP TRIGGER IF EXISTS trg_update_surge_pricing_rules ON public.surge_pricing_rules;
CREATE TRIGGER trg_update_surge_pricing_rules
  BEFORE UPDATE ON public.surge_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.surge_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Policies for surge_pricing_rules
DROP POLICY IF EXISTS "Public can view active surge rules" ON public.surge_pricing_rules;
CREATE POLICY "Public can view active surge rules"
  ON public.surge_pricing_rules FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage surge rules" ON public.surge_pricing_rules;
CREATE POLICY "Admins manage surge rules"
  ON public.surge_pricing_rules FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- PRICE CALCULATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_service_price(
  p_category_id UUID,
  p_quantity INTEGER,
  p_urgency urgency_level,
  p_location_type location_type,
  p_helper_id UUID DEFAULT NULL
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_price DECIMAL(10,2);
  v_custom_price DECIMAL(10,2);
  v_min_price DECIMAL(10,2);
  v_final_price DECIMAL(10,2);
  v_surge_multiplier DECIMAL(5,2) := 1.0;
  v_urgency_multiplier DECIMAL(5,2) := 1.0;
BEGIN
  -- Get category base price
  SELECT base_price INTO v_base_price
  FROM public.service_categories
  WHERE id = p_category_id AND is_active = TRUE;

  IF v_base_price IS NULL THEN
    RETURN 0;
  END IF;

  -- Get helper's custom price if helper specified
  IF p_helper_id IS NOT NULL THEN
    SELECT custom_price, min_price INTO v_custom_price, v_min_price
    FROM public.helper_services
    WHERE helper_id = p_helper_id AND category_id = p_category_id;
    
    IF v_custom_price IS NOT NULL THEN
      v_base_price := v_custom_price;
    END IF;
  END IF;

  -- Apply urgency multiplier
  CASE p_urgency
    WHEN 'urgent' THEN v_urgency_multiplier := 1.3;
    WHEN 'emergency' THEN v_urgency_multiplier := 1.8;
    ELSE v_urgency_multiplier := 1.0;
  END CASE;

  -- Check for surge pricing (simplified - could be enhanced with time-based rules)
  SELECT COALESCE(MAX(multiplier), 1.0) INTO v_surge_multiplier
  FROM public.surge_pricing_rules
  WHERE is_active = TRUE
    AND (category_id = p_category_id OR category_id IS NULL)
    AND (urgency_level = p_urgency OR urgency_level IS NULL);

  -- Calculate final price
  v_final_price := v_base_price * p_quantity * v_urgency_multiplier * v_surge_multiplier;

  -- Apply minimum price if set
  IF v_min_price IS NOT NULL AND v_final_price < v_min_price THEN
    v_final_price := v_min_price;
  END IF;

  RETURN ROUND(v_final_price, 2);
END;
$$;

COMMENT ON FUNCTION public.calculate_service_price IS 'Calculate service price with quantity, urgency, and surge pricing';

-- ============================================================================
-- HELPER MATCHING FUNCTION (Distance-based)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.find_nearby_helpers(
  p_category_id UUID,
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8),
  p_urgency urgency_level DEFAULT 'normal',
  p_max_distance_km INTEGER DEFAULT 20,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  helper_id UUID,
  helper_name TEXT,
  distance_km DECIMAL(10,2),
  rating DECIMAL(3,2),
  total_reviews INTEGER,
  hourly_rate DECIMAL(10,2),
  is_available BOOLEAN,
  response_time_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hp.id,
    p.full_name,
    ROUND(
      (6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(hp.latitude)) * 
        cos(radians(hp.longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(hp.latitude))
      ))::numeric, 2
    ) AS distance_km,
    CASE 
      WHEN hp.rating_count > 0 THEN ROUND((hp.rating_sum::DECIMAL / hp.rating_count), 2)
      ELSE 0
    END AS rating,
    hp.rating_count,
    hs.hourly_rate,
    hp.is_available_now,
    hp.average_response_minutes
  FROM public.helper_profiles hp
  INNER JOIN public.profiles p ON p.id = hp.id
  INNER JOIN public.helper_services hs ON hs.helper_id = hp.id
  WHERE hp.verification_status = 'approved'
    AND hp.is_available_now = TRUE
    AND hs.category_id = p_category_id
    AND hs.is_available = TRUE
    AND hp.latitude IS NOT NULL
    AND hp.longitude IS NOT NULL
    -- Haversine distance formula (approximate)
    AND (
      6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(hp.latitude)) * 
        cos(radians(hp.longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(hp.latitude))
      )
    ) <= p_max_distance_km
    -- Emergency availability check
    AND (
      p_urgency != 'emergency' OR 
      (p_urgency = 'emergency' AND hp.emergency_availability = TRUE)
    )
  ORDER BY 
    -- Prioritize: emergency availability > distance > rating > response time
    CASE WHEN p_urgency = 'emergency' THEN hp.emergency_availability::int ELSE 0 END DESC,
    distance_km ASC,
    rating DESC,
    hp.average_response_minutes ASC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.find_nearby_helpers IS 'Find nearby helpers within distance, sorted by best match';

-- ============================================================================
-- SEED DETAILED SERVICE CATEGORIES
-- ============================================================================

-- Clear existing basic categories, insert detailed ones
DELETE FROM public.service_categories WHERE slug IN ('plumbing', 'electrical', 'cleaning', 'moving', 'appliance-repair');

-- PLUMBING CATEGORY & SUBCATEGORIES
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order, icon)
VALUES 
  ('plumbing', 'Plumbing Services', 'Professional plumbing solutions for homes and businesses', NULL, 'custom', NULL, 500, TRUE, 1, 'Wrench')
ON CONFLICT (slug) DO UPDATE SET 
  description = EXCLUDED.description,
  price_type = EXCLUDED.price_type,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency,
  display_order = EXCLUDED.display_order;

WITH plumbing_cat AS (SELECT id FROM public.service_categories WHERE slug = 'plumbing')
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
SELECT * FROM (VALUES
  ('pipe-repair', 'Pipe Repair', 'Pipe leakage and damage repair', (SELECT id FROM plumbing_cat), 'per_unit'::price_type, 'foot', 50, TRUE, 1),
  ('tap-fixing', 'Tap Fixing', 'Tap installation and repair', (SELECT id FROM plumbing_cat), 'per_unit'::price_type, 'tap', 200, TRUE, 2),
  ('cariphering', 'Cariphering Work', 'Complete plumbing carpentry work', (SELECT id FROM plumbing_cat), 'fixed'::price_type, 'job', 800, FALSE, 3),
  ('door-repair', 'Door Repair', 'Door fitting and repair services', (SELECT id FROM plumbing_cat), 'per_unit'::price_type, 'door', 400, FALSE, 4),
  ('drain-cleaning', 'Drain Cleaning', 'Blocked drain and sewage cleaning', (SELECT id FROM plumbing_cat), 'fixed'::price_type, 'job', 600, TRUE, 5)
) AS t(slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
ON CONFLICT (slug) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  price_type = EXCLUDED.price_type,
  unit_name = EXCLUDED.unit_name,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency;

-- ELECTRICAL CATEGORY & SUBCATEGORIES
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order, icon)
VALUES 
  ('electrical', 'Electrical Services', 'Certified electrical work and repairs', NULL, 'custom', NULL, 400, TRUE, 2, 'Zap')
ON CONFLICT (slug) DO UPDATE SET 
  description = EXCLUDED.description,
  price_type = EXCLUDED.price_type,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency,
  display_order = EXCLUDED.display_order;

WITH electrical_cat AS (SELECT id FROM public.service_categories WHERE slug = 'electrical')
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
SELECT * FROM (VALUES
  ('wiring', 'Wiring Services', 'New wiring and rewiring work', (SELECT id FROM electrical_cat), 'per_unit'::price_type, 'point', 150, FALSE, 1),
  ('switch-repair', 'Switch Repair', 'Switch and socket repair/replacement', (SELECT id FROM electrical_cat), 'per_unit'::price_type, 'switch', 100, TRUE, 2),
  ('appliance-fixing', 'Appliance Fixing', 'Electrical appliance repair', (SELECT id FROM electrical_cat), 'per_unit'::price_type, 'appliance', 300, FALSE, 3),
  ('fan-installation', 'Fan Installation', 'Ceiling and wall fan services', (SELECT id FROM electrical_cat), 'per_unit'::price_type, 'fan', 250, FALSE, 4),
  ('light-fitting', 'Light Fitting', 'Light fixture installation', (SELECT id FROM electrical_cat), 'per_unit'::price_type, 'light', 120, FALSE, 5)
) AS t(slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
ON CONFLICT (slug) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  price_type = EXCLUDED.price_type,
  unit_name = EXCLUDED.unit_name,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency;

-- CLEANING CATEGORY & SUBCATEGORIES
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order, icon)
VALUES 
  ('cleaning', 'Cleaning Services', 'Professional cleaning for homes and offices', NULL, 'custom', NULL, 300, FALSE, 3, 'Sparkles')
ON CONFLICT (slug) DO UPDATE SET 
  description = EXCLUDED.description,
  price_type = EXCLUDED.price_type,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency,
  display_order = EXCLUDED.display_order;

WITH cleaning_cat AS (SELECT id FROM public.service_categories WHERE slug = 'cleaning')
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
SELECT * FROM (VALUES
  ('home-cleaning', 'Home Cleaning', 'Regular home cleaning service', (SELECT id FROM cleaning_cat), 'per_room'::price_type, 'room', 200, FALSE, 1),
  ('office-cleaning', 'Office Cleaning', 'Commercial office cleaning', (SELECT id FROM cleaning_cat), 'per_sqft'::price_type, 'sqft', 3, FALSE, 2),
  ('deep-cleaning', 'Deep Cleaning', 'Intensive deep cleaning service', (SELECT id FROM cleaning_cat), 'per_hour'::price_type, 'hour', 400, FALSE, 3),
  ('kitchen-cleaning', 'Kitchen Cleaning', 'Specialized kitchen cleaning', (SELECT id FROM cleaning_cat), 'fixed'::price_type, 'job', 500, FALSE, 4),
  ('bathroom-cleaning', 'Bathroom Cleaning', 'Complete bathroom cleaning', (SELECT id FROM cleaning_cat), 'per_unit'::price_type, 'bathroom', 250, FALSE, 5)
) AS t(slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
ON CONFLICT (slug) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  price_type = EXCLUDED.price_type,
  unit_name = EXCLUDED.unit_name,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency;

-- CAR/BIKE REPAIR CATEGORY & SUBCATEGORIES
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order, icon)
VALUES 
  ('vehicle-repair', 'Vehicle Repair', 'Car and bike repair services', NULL, 'custom', NULL, 600, TRUE, 4, 'Car')
ON CONFLICT (slug) DO UPDATE SET 
  description = EXCLUDED.description,
  price_type = EXCLUDED.price_type,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency,
  display_order = EXCLUDED.display_order;

WITH vehicle_cat AS (SELECT id FROM public.service_categories WHERE slug = 'vehicle-repair')
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
SELECT * FROM (VALUES
  ('on-highway-emergency', 'Highway Emergency', 'Emergency breakdown service on highway', (SELECT id FROM vehicle_cat), 'fixed'::price_type, 'job', 1500, TRUE, 1),
  ('shop-repair', 'Workshop Repair', 'Complete repair at workshop', (SELECT id FROM vehicle_cat), 'per_hour'::price_type, 'hour', 400, FALSE, 2),
  ('home-service', 'Doorstep Service', 'Repair at your location', (SELECT id FROM vehicle_cat), 'fixed'::price_type, 'job', 800, FALSE, 3),
  ('bike-repair', 'Bike Repair', 'Motorcycle and scooter repair', (SELECT id FROM vehicle_cat), 'fixed'::price_type, 'job', 500, TRUE, 4),
  ('car-repair', 'Car Repair', 'Car repair and maintenance', (SELECT id FROM vehicle_cat), 'fixed'::price_type, 'job', 1000, TRUE, 5)
) AS t(slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
ON CONFLICT (slug) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  price_type = EXCLUDED.price_type,
  unit_name = EXCLUDED.unit_name,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency;

-- WINDOWS & DOORS CATEGORY & SUBCATEGORIES
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order, icon)
VALUES 
  ('windows-doors', 'Windows & Doors', 'Window and door installation and repair', NULL, 'custom', NULL, 350, FALSE, 5, 'DoorOpen')
ON CONFLICT (slug) DO UPDATE SET 
  description = EXCLUDED.description,
  price_type = EXCLUDED.price_type,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency,
  display_order = EXCLUDED.display_order;

WITH windows_cat AS (SELECT id FROM public.service_categories WHERE slug = 'windows-doors')
INSERT INTO public.service_categories (slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
SELECT * FROM (VALUES
  ('window-repair', 'Window Repair', 'Window fixing and repair', (SELECT id FROM windows_cat), 'per_unit'::price_type, 'window', 300, FALSE, 1),
  ('door-installation', 'Door Installation', 'New door installation', (SELECT id FROM windows_cat), 'per_unit'::price_type, 'door', 800, FALSE, 2),
  ('door-lock-repair', 'Lock Repair', 'Door lock fixing', (SELECT id FROM windows_cat), 'per_unit'::price_type, 'lock', 200, TRUE, 3),
  ('window-installation', 'Window Installation', 'New window installation', (SELECT id FROM windows_cat), 'per_unit'::price_type, 'window', 600, FALSE, 4)
) AS t(slug, name, description, parent_id, price_type, unit_name, base_price, supports_emergency, display_order)
ON CONFLICT (slug) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  price_type = EXCLUDED.price_type,
  unit_name = EXCLUDED.unit_name,
  base_price = EXCLUDED.base_price,
  supports_emergency = EXCLUDED.supports_emergency;

-- ============================================================================
-- SEED DEFAULT SURGE PRICING RULES
-- ============================================================================

INSERT INTO public.surge_pricing_rules (name, description, urgency_level, multiplier, is_active)
VALUES 
  ('Emergency Service Surge', 'Additional charge for emergency services', 'emergency'::urgency_level, 1.8, TRUE),
  ('Urgent Service Surge', 'Additional charge for urgent services', 'urgent'::urgency_level, 1.3, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UPDATE RLS POLICIES FOR ENHANCED FIELDS
-- ============================================================================

-- Helpers can view assigned requests (update existing policy)
DROP POLICY IF EXISTS "Helpers can view assigned requests" ON public.service_requests;
CREATE POLICY "Helpers can view assigned requests"
  ON public.service_requests FOR SELECT
  USING (
    assigned_helper_id = auth.uid()
    OR (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'helper')
      AND status = 'open'
    )
  );

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.calculate_service_price TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_helpers TO authenticated;

COMMENT ON MIGRATION IS 'Enhanced service schema with dynamic pricing, location types, urgency levels, phone numbers, and helper matching';

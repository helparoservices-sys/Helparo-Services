-- Create hierarchical service areas table
CREATE TABLE IF NOT EXISTS public.service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.service_areas(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL CHECK (level IN ('state', 'district', 'city', 'area')),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  pincode VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, slug)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_areas_parent ON service_areas(parent_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_level ON service_areas(level);
CREATE INDEX IF NOT EXISTS idx_service_areas_slug ON service_areas(slug);
CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_service_areas_location ON service_areas(latitude, longitude) WHERE latitude IS NOT NULL;

-- Enable RLS
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Policies (public read, admin write)
CREATE POLICY "Anyone can view active service areas"
  ON service_areas FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage service areas"
  ON service_areas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sample data for Andhra Pradesh
INSERT INTO service_areas (level, name, slug, latitude, longitude, display_order) VALUES
-- State
('state', 'Andhra Pradesh', 'andhra-pradesh', 15.9129, 79.7400, 1),
('state', 'Telangana', 'telangana', 18.1124, 79.0193, 2);

-- Get state IDs for further inserts
DO $$
DECLARE
  ap_id UUID;
  ts_id UUID;
  visakhapatnam_id UUID;
  guntur_id UUID;
  hyderabad_id UUID;
  warangal_id UUID;
BEGIN
  -- Get state IDs
  SELECT id INTO ap_id FROM service_areas WHERE slug = 'andhra-pradesh';
  SELECT id INTO ts_id FROM service_areas WHERE slug = 'telangana';

  -- Andhra Pradesh Districts
  INSERT INTO service_areas (parent_id, level, name, slug, latitude, longitude, display_order) VALUES
  (ap_id, 'district', 'Visakhapatnam', 'visakhapatnam', 17.6869, 83.2185, 1),
  (ap_id, 'district', 'Guntur', 'guntur', 16.3067, 80.4365, 2),
  (ap_id, 'district', 'Vijayawada', 'vijayawada', 16.5062, 80.6480, 3),
  (ap_id, 'district', 'Tirupati', 'tirupati', 13.6288, 79.4192, 4);

  -- Telangana Districts
  INSERT INTO service_areas (parent_id, level, name, slug, latitude, longitude, display_order) VALUES
  (ts_id, 'district', 'Hyderabad', 'hyderabad', 17.3850, 78.4867, 1),
  (ts_id, 'district', 'Warangal', 'warangal', 17.9689, 79.5941, 2),
  (ts_id, 'district', 'Khammam', 'khammam', 17.2473, 80.1514, 3);

  -- Get district IDs
  SELECT id INTO visakhapatnam_id FROM service_areas WHERE slug = 'visakhapatnam';
  SELECT id INTO guntur_id FROM service_areas WHERE slug = 'guntur';
  SELECT id INTO hyderabad_id FROM service_areas WHERE slug = 'hyderabad';
  SELECT id INTO warangal_id FROM service_areas WHERE slug = 'warangal';

  -- Visakhapatnam Cities
  INSERT INTO service_areas (parent_id, level, name, slug, latitude, longitude, display_order) VALUES
  (visakhapatnam_id, 'city', 'Visakhapatnam City', 'visakhapatnam-city', 17.6869, 83.2185, 1),
  (visakhapatnam_id, 'city', 'Vizianagaram', 'vizianagaram', 18.1067, 83.4132, 2);

  -- Guntur Cities
  INSERT INTO service_areas (parent_id, level, name, slug, latitude, longitude, display_order) VALUES
  (guntur_id, 'city', 'Guntur City', 'guntur-city', 16.3067, 80.4365, 1),
  (guntur_id, 'city', 'Tenali', 'tenali', 16.2428, 80.6433, 2);

  -- Hyderabad Cities
  INSERT INTO service_areas (parent_id, level, name, slug, latitude, longitude, display_order) VALUES
  (hyderabad_id, 'city', 'Hyderabad City', 'hyderabad-city', 17.3850, 78.4867, 1),
  (hyderabad_id, 'city', 'Secunderabad', 'secunderabad', 17.4399, 78.4983, 2);

  -- Warangal Cities
  INSERT INTO service_areas (parent_id, level, name, slug, latitude, longitude, display_order) VALUES
  (warangal_id, 'city', 'Warangal City', 'warangal-city', 17.9689, 79.5941, 1);

  -- Areas in Visakhapatnam City
  DECLARE vizag_city_id UUID;
  BEGIN
    SELECT id INTO vizag_city_id FROM service_areas WHERE slug = 'visakhapatnam-city';
    
    INSERT INTO service_areas (parent_id, level, name, slug, latitude, longitude, pincode, display_order) VALUES
    (vizag_city_id, 'area', 'Dwaraka Nagar', 'dwaraka-nagar', 17.7231, 83.3116, '530016', 1),
    (vizag_city_id, 'area', 'MVP Colony', 'mvp-colony', 17.7500, 83.3167, '530017', 2),
    (vizag_city_id, 'area', 'Gajuwaka', 'gajuwaka', 17.6970, 83.2118, '530026', 3),
    (vizag_city_id, 'area', 'Madhurawada', 'madhurawada', 17.7833, 83.3833, '530048', 4),
    (vizag_city_id, 'area', 'Rushikonda', 'rushikonda', 17.7833, 83.3833, '530045', 5);
  END;

  -- Areas in Hyderabad City
  DECLARE hyd_city_id UUID;
  BEGIN
    SELECT id INTO hyd_city_id FROM service_areas WHERE slug = 'hyderabad-city';
    
    INSERT INTO service_areas (parent_id, level, name, slug, latitude, longitude, pincode, display_order) VALUES
    (hyd_city_id, 'area', 'Banjara Hills', 'banjara-hills', 17.4126, 78.4486, '500034', 1),
    (hyd_city_id, 'area', 'Jubilee Hills', 'jubilee-hills', 17.4239, 78.4113, '500033', 2),
    (hyd_city_id, 'area', 'Gachibowli', 'gachibowli', 17.4399, 78.3487, '500032', 3),
    (hyd_city_id, 'area', 'Hitech City', 'hitech-city', 17.4485, 78.3908, '500081', 4),
    (hyd_city_id, 'area', 'Madhapur', 'madhapur', 17.4483, 78.3915, '500081', 5),
    (hyd_city_id, 'area', 'Kukatpally', 'kukatpally', 17.4948, 78.3979, '500072', 6),
    (hyd_city_id, 'area', 'Ameerpet', 'ameerpet', 17.4374, 78.4483, '500016', 7),
    (hyd_city_id, 'area', 'Dilsukhnagar', 'dilsukhnagar', 17.3687, 78.5248, '500060', 8);
  END;

END $$;

-- Update helper_profiles to use service_area_ids instead of text array
ALTER TABLE helper_profiles 
ADD COLUMN IF NOT EXISTS service_area_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN helper_profiles.service_area_ids IS 'References to service_areas table (hierarchical)';
COMMENT ON TABLE service_areas IS 'Hierarchical service areas: State > District > City > Area';

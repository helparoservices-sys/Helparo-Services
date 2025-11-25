-- Add location fields to profiles table for geolocation
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Add location to service_requests for better matching
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS service_location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS service_location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS service_address TEXT,
ADD COLUMN IF NOT EXISTS service_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS service_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS service_pincode VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_service_requests_location ON service_requests (service_location_lat, service_location_lng) WHERE service_location_lat IS NOT NULL AND service_location_lng IS NOT NULL;

-- Function to calculate distance between two points (in km)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371; -- Earth radius in km
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  
  a := SIN(dLat/2) * SIN(dLat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLon/2) * SIN(dLon/2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find nearby helpers within a radius
CREATE OR REPLACE FUNCTION find_nearby_helpers(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km INTEGER DEFAULT 10,
  service_cat VARCHAR DEFAULT NULL
) RETURNS TABLE (
  helper_id UUID,
  helper_name TEXT,
  distance_km DECIMAL,
  rating DECIMAL,
  total_jobs INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.full_name, p.email) as helper_name,
    calculate_distance(user_lat, user_lng, p.location_lat, p.location_lng) as distance_km,
    COALESCE(hs.average_rating, 0) as rating,
    COALESCE(hs.total_completed_jobs, 0) as total_jobs
  FROM profiles p
  LEFT JOIN helper_stats hs ON hs.helper_id = p.id
  WHERE 
    p.role = 'helper'
    AND p.location_lat IS NOT NULL
    AND p.location_lng IS NOT NULL
    AND calculate_distance(user_lat, user_lng, p.location_lat, p.location_lng) <= radius_km
    AND (service_cat IS NULL OR EXISTS (
      SELECT 1 FROM helper_services hs2
      WHERE hs2.helper_id = p.id
      AND hs2.category = service_cat
      AND hs2.is_active = true
    ))
  ORDER BY distance_km ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

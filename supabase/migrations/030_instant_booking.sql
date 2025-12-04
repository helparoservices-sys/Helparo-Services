-- Add instant booking fields to helper_profiles
ALTER TABLE helper_profiles
ADD COLUMN IF NOT EXISTS instant_booking_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS instant_booking_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS instant_booking_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS available_time_slots JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS auto_accept_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_concurrent_bookings INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER DEFAULT 30;

-- Add comments for documentation
COMMENT ON COLUMN helper_profiles.instant_booking_enabled IS 'Whether helper accepts instant bookings';
COMMENT ON COLUMN helper_profiles.instant_booking_price IS 'Fixed price for instant booking service';
COMMENT ON COLUMN helper_profiles.instant_booking_duration_minutes IS 'Standard service duration in minutes';
COMMENT ON COLUMN helper_profiles.available_time_slots IS 'Array of available time slots in format [{day: "monday", start: "09:00", end: "17:00"}]';
COMMENT ON COLUMN helper_profiles.auto_accept_enabled IS 'Automatically accept instant bookings without manual confirmation';
COMMENT ON COLUMN helper_profiles.max_concurrent_bookings IS 'Maximum number of bookings helper can handle simultaneously';
COMMENT ON COLUMN helper_profiles.response_time_minutes IS 'Average response time in minutes';

-- Create index for instant booking queries
CREATE INDEX IF NOT EXISTS idx_helper_profiles_instant_booking 
ON helper_profiles(instant_booking_enabled) 
WHERE instant_booking_enabled = TRUE AND is_approved = TRUE;

-- Add instant_booking type to booking_type enum if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type') THEN
    CREATE TYPE booking_type AS ENUM ('normal', 'instant');
  END IF;
END $$;

-- Add booking_type column to service_requests table
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS booking_type booking_type DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS assigned_helper_id UUID REFERENCES helper_profiles(id),
ADD COLUMN IF NOT EXISTS instant_booking_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for instant bookings
CREATE INDEX IF NOT EXISTS idx_service_requests_booking_type 
ON service_requests(booking_type);

CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_helper 
ON service_requests(assigned_helper_id);

-- RLS Policy: Customers can view instant booking enabled helpers
CREATE POLICY "Customers can view instant booking helpers"
  ON helper_profiles FOR SELECT
  USING (
    instant_booking_enabled = TRUE 
    AND is_approved = TRUE 
    AND verification_status = 'approved'
  );

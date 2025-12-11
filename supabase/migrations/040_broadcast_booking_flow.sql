-- Migration: Broadcast Booking Flow (Rapido-style)
-- This enables real-time job broadcasting to helpers with OTP verification

-- Add broadcast booking fields to service_requests
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS broadcast_status TEXT DEFAULT 'pending' CHECK (broadcast_status IN ('pending', 'broadcasting', 'accepted', 'cancelled', 'completed', 'expired')),
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'wallet', 'card')),
ADD COLUMN IF NOT EXISTS start_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS end_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS helper_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS helper_location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS helper_location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS helper_location_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS broadcast_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN ('customer', 'helper', 'system'));

-- Add helper's current location to helper_profiles
ALTER TABLE helper_profiles
ADD COLUMN IF NOT EXISTS current_location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_on_job BOOLEAN DEFAULT FALSE;

-- Create broadcast_notifications table for tracking job broadcasts
CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES helper_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'declined', 'expired')),
  distance_km DECIMAL(6, 2), -- Distance from helper to job location
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, helper_id)
);

-- Create helper_location_history for tracking (optional - for analytics)
CREATE TABLE IF NOT EXISTS helper_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id UUID NOT NULL REFERENCES helper_profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2), -- GPS accuracy in meters
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table if not exists
CREATE TABLE IF NOT EXISTS job_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES helper_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  behaviour_rating INTEGER CHECK (behaviour_rating >= 1 AND behaviour_rating <= 5),
  would_recommend BOOLEAN DEFAULT TRUE,
  tip_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, customer_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_request ON broadcast_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_helper ON broadcast_notifications(helper_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_status ON broadcast_notifications(status);
CREATE INDEX IF NOT EXISTS idx_helper_location_history_helper ON helper_location_history(helper_id);
CREATE INDEX IF NOT EXISTS idx_helper_location_history_request ON helper_location_history(request_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_broadcast_status ON service_requests(broadcast_status);
CREATE INDEX IF NOT EXISTS idx_helper_profiles_online ON helper_profiles(is_online) WHERE is_online = TRUE;
CREATE INDEX IF NOT EXISTS idx_job_ratings_helper ON job_ratings(helper_id);
CREATE INDEX IF NOT EXISTS idx_job_ratings_request ON job_ratings(request_id);

-- Function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DECIMAL,
  lng1 DECIMAL,
  lat2 DECIMAL,
  lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371; -- Earth's radius in km
  dlat DECIMAL;
  dlng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);
  a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2) * SIN(dlng/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate 6-digit OTP
CREATE OR REPLACE FUNCTION generate_otp() RETURNS VARCHAR(6) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE broadcast_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_ratings ENABLE ROW LEVEL SECURITY;

-- Broadcast notifications policies
CREATE POLICY "Helpers can view their own broadcast notifications"
  ON broadcast_notifications FOR SELECT
  USING (helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert broadcast notifications"
  ON broadcast_notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Helpers can update their own notifications"
  ON broadcast_notifications FOR UPDATE
  USING (helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid()));

-- Location history policies
CREATE POLICY "Helpers can insert their location"
  ON helper_location_history FOR INSERT
  WITH CHECK (helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Customers can view helper location for their jobs"
  ON helper_location_history FOR SELECT
  USING (
    request_id IN (SELECT id FROM service_requests WHERE customer_id = auth.uid())
    OR helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid())
  );

-- Ratings policies
CREATE POLICY "Customers can create ratings for their jobs"
  ON job_ratings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Anyone can view ratings"
  ON job_ratings FOR SELECT
  USING (TRUE);

-- Comments
COMMENT ON TABLE broadcast_notifications IS 'Tracks job broadcasts sent to helpers (Rapido-style)';
COMMENT ON TABLE helper_location_history IS 'GPS location history for helpers during active jobs';
COMMENT ON TABLE job_ratings IS 'Customer ratings and reviews for completed jobs';
COMMENT ON COLUMN service_requests.start_otp IS '6-digit OTP to start the work';
COMMENT ON COLUMN service_requests.end_otp IS '6-digit OTP to complete the work';
COMMENT ON COLUMN service_requests.broadcast_status IS 'Current status of the broadcast job flow';

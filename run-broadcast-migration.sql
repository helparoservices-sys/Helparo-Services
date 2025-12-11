-- =========================================
-- RUN THIS MIGRATION IN SUPABASE SQL EDITOR
-- For Broadcast Booking Flow (Rapido-style)
-- =========================================

-- Step 1: Add broadcast booking fields to service_requests
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS broadcast_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
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
ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

-- Step 2: Add helper's current location to helper_profiles
ALTER TABLE helper_profiles
ADD COLUMN IF NOT EXISTS current_location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_on_job BOOLEAN DEFAULT FALSE;

-- Step 3: Create broadcast_notifications table
CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES helper_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'sent',
  distance_km DECIMAL(6, 2),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, helper_id)
);

-- Step 4: Create job_ratings table
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

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_request ON broadcast_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_helper ON broadcast_notifications(helper_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_status ON broadcast_notifications(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_broadcast_status ON service_requests(broadcast_status);
CREATE INDEX IF NOT EXISTS idx_helper_profiles_online ON helper_profiles(is_online) WHERE is_online = TRUE;
CREATE INDEX IF NOT EXISTS idx_job_ratings_helper ON job_ratings(helper_id);
CREATE INDEX IF NOT EXISTS idx_job_ratings_request ON job_ratings(request_id);

-- Step 6: Enable RLS
ALTER TABLE broadcast_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_ratings ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies for broadcast_notifications
DROP POLICY IF EXISTS "Helpers can view their own broadcast notifications" ON broadcast_notifications;
CREATE POLICY "Helpers can view their own broadcast notifications"
  ON broadcast_notifications FOR SELECT
  USING (helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "System can insert broadcast notifications" ON broadcast_notifications;
CREATE POLICY "System can insert broadcast notifications"
  ON broadcast_notifications FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Helpers can update their own notifications" ON broadcast_notifications;
CREATE POLICY "Helpers can update their own notifications"
  ON broadcast_notifications FOR UPDATE
  USING (helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid()));

-- Step 8: Create RLS Policies for job_ratings
DROP POLICY IF EXISTS "Customers can create ratings for their jobs" ON job_ratings;
CREATE POLICY "Customers can create ratings for their jobs"
  ON job_ratings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view ratings" ON job_ratings;
CREATE POLICY "Anyone can view ratings"
  ON job_ratings FOR SELECT
  USING (TRUE);

-- Step 9: Enable realtime for broadcast_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE broadcast_notifications;

-- Step 10: Grant permissions
GRANT ALL ON broadcast_notifications TO authenticated;
GRANT ALL ON job_ratings TO authenticated;

-- Done! You should see "Success. No rows returned"
SELECT 'Migration completed successfully!' as status;

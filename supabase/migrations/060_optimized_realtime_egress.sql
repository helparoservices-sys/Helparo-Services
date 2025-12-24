-- Optimized Realtime Architecture for Egress Reduction
-- Migration 060: job_notifications, job_declines tables + find_matching_helpers RPC
-- Goal: Handle 1000+ users on Supabase free plan by minimizing realtime data transfer

-- ============================================================================
-- JOB NOTIFICATIONS TABLE
-- One row per (request_id, helper_id) - targeted notifications instead of broadcast
-- Helpers subscribe with filter: helper_id=eq.{their_id}
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES public.helper_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired, viewed
  distance_km DECIMAL(10,2),
  estimated_price DECIMAL(10,2),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  responded_at TIMESTAMPTZ,
  -- Minimal payload for realtime - NO heavy data like descriptions/photos
  -- Client fetches full details only when needed
  UNIQUE(request_id, helper_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_notifications_helper ON public.job_notifications(helper_id);
CREATE INDEX IF NOT EXISTS idx_job_notifications_request ON public.job_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_job_notifications_status ON public.job_notifications(status);
CREATE INDEX IF NOT EXISTS idx_job_notifications_sent_at ON public.job_notifications(sent_at DESC);

-- Enable RLS
ALTER TABLE public.job_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: helpers can only see their own notifications
DROP POLICY IF EXISTS "Helpers see own notifications" ON public.job_notifications;
CREATE POLICY "Helpers see own notifications" ON public.job_notifications
  FOR SELECT USING (
    helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "System can insert notifications" ON public.job_notifications;
CREATE POLICY "System can insert notifications" ON public.job_notifications
  FOR INSERT WITH CHECK (true); -- Inserted by service role/edge functions

DROP POLICY IF EXISTS "Helpers can update own notifications" ON public.job_notifications;
CREATE POLICY "Helpers can update own notifications" ON public.job_notifications
  FOR UPDATE USING (
    helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid())
  );

-- ============================================================================
-- JOB DECLINES TABLE
-- Track which helpers declined which jobs to prevent re-notification
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_declines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES public.helper_profiles(id) ON DELETE CASCADE,
  reason TEXT, -- Optional decline reason
  declined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(request_id, helper_id)
);

CREATE INDEX IF NOT EXISTS idx_job_declines_helper ON public.job_declines(helper_id);
CREATE INDEX IF NOT EXISTS idx_job_declines_request ON public.job_declines(request_id);

ALTER TABLE public.job_declines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Helpers see own declines" ON public.job_declines;
CREATE POLICY "Helpers see own declines" ON public.job_declines
  FOR SELECT USING (
    helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Helpers can insert own declines" ON public.job_declines;
CREATE POLICY "Helpers can insert own declines" ON public.job_declines
  FOR INSERT WITH CHECK (
    helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid())
  );

-- ============================================================================
-- ENABLE REALTIME FOR NEW TABLES
-- ============================================================================
ALTER TABLE public.job_notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.job_notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- FIND MATCHING HELPERS RPC
-- Called by backend when a job is created to find eligible helpers
-- Returns helper_ids with distance, sorted by distance
-- Excludes: helpers who declined, helpers who are on_job, helpers outside radius
-- ============================================================================
CREATE OR REPLACE FUNCTION find_matching_helpers(
  p_request_id UUID,
  p_category_id UUID,
  p_customer_lat DECIMAL,
  p_customer_lng DECIMAL,
  p_max_distance_km DECIMAL DEFAULT 15,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  helper_id UUID,
  distance_km DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hp.id AS helper_id,
    ROUND(
      (6371 * acos(
        cos(radians(p_customer_lat)) * cos(radians(hp.current_location_lat)) *
        cos(radians(hp.current_location_lng) - radians(p_customer_lng)) +
        sin(radians(p_customer_lat)) * sin(radians(hp.current_location_lat))
      ))::DECIMAL, 2
    ) AS distance_km
  FROM helper_profiles hp
  -- Join to check category expertise
  INNER JOIN helper_service_areas hsa ON hsa.helper_id = hp.id
  WHERE 
    -- Must be active and not on a job
    hp.is_active = true
    AND (hp.is_on_job IS NULL OR hp.is_on_job = false)
    -- Must have location
    AND hp.current_location_lat IS NOT NULL
    AND hp.current_location_lng IS NOT NULL
    -- Must serve this category (or be general helper)
    AND (hsa.category_id = p_category_id OR hsa.category_id IS NULL)
    -- Must not have declined this job
    AND NOT EXISTS (
      SELECT 1 FROM job_declines jd 
      WHERE jd.request_id = p_request_id AND jd.helper_id = hp.id
    )
    -- Must not already have a pending notification for this job
    AND NOT EXISTS (
      SELECT 1 FROM job_notifications jn 
      WHERE jn.request_id = p_request_id AND jn.helper_id = hp.id
    )
    -- Distance filter
    AND (6371 * acos(
      cos(radians(p_customer_lat)) * cos(radians(hp.current_location_lat)) *
      cos(radians(hp.current_location_lng) - radians(p_customer_lng)) +
      sin(radians(p_customer_lat)) * sin(radians(hp.current_location_lat))
    )) <= p_max_distance_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- EXPIRE OLD NOTIFICATIONS FUNCTION
-- Call periodically to mark old pending notifications as expired
-- ============================================================================
CREATE OR REPLACE FUNCTION expire_old_notifications(p_max_age_minutes INT DEFAULT 30)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE job_notifications
  SET status = 'expired', responded_at = NOW()
  WHERE status = 'pending'
    AND sent_at < NOW() - (p_max_age_minutes || ' minutes')::INTERVAL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- MARK JOB NOTIFICATIONS AS EXPIRED WHEN JOB IS ASSIGNED/CANCELLED
-- Trigger to auto-expire all pending notifications for a job when status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION expire_job_notifications_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When job is assigned or cancelled, expire all pending notifications
  IF NEW.status IN ('assigned', 'cancelled', 'completed') AND OLD.status != NEW.status THEN
    UPDATE job_notifications
    SET status = 'expired', responded_at = NOW()
    WHERE request_id = NEW.id
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expire_job_notifications ON public.service_requests;
CREATE TRIGGER trg_expire_job_notifications
  AFTER UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION expire_job_notifications_on_status_change();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_matching_helpers TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_notifications TO authenticated;

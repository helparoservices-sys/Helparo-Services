-- Fix SOS Alerts RLS Policy for Helpers
-- Helpers need to view SOS alerts they've acknowledged

-- =====================================================
-- DROP EXISTING HELPER SOS POLICIES IF ANY
-- =====================================================

DROP POLICY IF EXISTS "Helpers can view acknowledged SOS alerts" ON public.sos_alerts;
DROP POLICY IF EXISTS "Helpers can view active SOS alerts" ON public.sos_alerts;
DROP POLICY IF EXISTS "Helpers can update acknowledged SOS alerts" ON public.sos_alerts;

-- =====================================================
-- CREATE HELPER SOS POLICIES
-- =====================================================

-- 1. Helpers can view SOS alerts they have acknowledged
CREATE POLICY "Helpers can view acknowledged SOS alerts"
ON public.sos_alerts FOR SELECT
USING (
  auth.uid() = acknowledged_by
);

-- 2. Verified helpers can view active SOS alerts (so they can see alerts before accepting)
CREATE POLICY "Helpers can view active SOS alerts"
ON public.sos_alerts FOR SELECT
USING (
  status IN ('active', 'acknowledged') AND
  EXISTS (
    SELECT 1 FROM public.helper_profiles
    WHERE user_id = auth.uid() 
    AND verification_status = 'approved'
  )
);

-- 3. Helpers can update SOS alerts they've acknowledged (to mark as resolved)
-- Allow update if helper is the one who acknowledged OR if they are a verified helper and alert is active/acknowledged
CREATE POLICY "Helpers can update acknowledged SOS alerts"
ON public.sos_alerts FOR UPDATE
USING (
  auth.uid() = acknowledged_by OR
  (
    status IN ('active', 'acknowledged') AND
    EXISTS (
      SELECT 1 FROM public.helper_profiles
      WHERE user_id = auth.uid() 
      AND verification_status = 'approved'
    )
  )
);

-- =====================================================
-- ADD BOOKING NUMBER COLUMN IF MISSING
-- =====================================================

-- Add booking_number column if it doesn't exist
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS booking_number VARCHAR(15) UNIQUE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Helpers can view acknowledged SOS alerts" ON public.sos_alerts IS 'Allows helpers to view SOS alerts they have acknowledged';
COMMENT ON POLICY "Helpers can view active SOS alerts" ON public.sos_alerts IS 'Allows verified helpers to view active SOS alerts';
COMMENT ON POLICY "Helpers can update acknowledged SOS alerts" ON public.sos_alerts IS 'Allows helpers to update SOS alerts they have acknowledged (e.g., mark as resolved)';

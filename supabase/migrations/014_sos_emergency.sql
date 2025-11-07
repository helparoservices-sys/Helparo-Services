-- SOS Emergency System: Safety alerts with real-time notifications
-- Migration 014: Emergency assistance and safety features

-- ============================================================================
-- SOS ALERT STATUS ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE sos_status AS ENUM ('active', 'acknowledged', 'resolved', 'false_alarm', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- SOS ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  request_id UUID REFERENCES public.service_requests(id), -- Optional: related to a service
  alert_type TEXT NOT NULL CHECK (alert_type IN ('emergency', 'safety_concern', 'dispute', 'harassment', 'other')),
  status sos_status NOT NULL DEFAULT 'active',
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  address TEXT,
  description TEXT NOT NULL,
  contact_phone VARCHAR(20),
  acknowledged_by UUID REFERENCES public.profiles(id), -- Admin who acknowledged
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id), -- Admin who resolved
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_user 
  ON public.sos_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_request 
  ON public.sos_alerts(request_id);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_status 
  ON public.sos_alerts(status);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_created 
  ON public.sos_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_location 
  ON public.sos_alerts(latitude, longitude);

DROP TRIGGER IF EXISTS trg_update_sos_alerts ON public.sos_alerts;
CREATE TRIGGER trg_update_sos_alerts
  BEFORE UPDATE ON public.sos_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.sos_alerts IS 'Emergency safety alerts from users';
COMMENT ON COLUMN public.sos_alerts.alert_type IS 'Type of emergency or safety concern';
COMMENT ON COLUMN public.sos_alerts.status IS 'Current status of alert';

-- ============================================================================
-- SOS EVIDENCE TABLE (Photos/videos related to SOS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sos_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES public.sos_alerts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
  thumbnail_url TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sos_evidence_alert 
  ON public.sos_evidence(alert_id);

ALTER TABLE public.sos_evidence ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.sos_evidence IS 'Media evidence attached to SOS alerts';

-- ============================================================================
-- RLS POLICIES FOR SOS_ALERTS
-- ============================================================================

-- Users can create their own alerts
DROP POLICY IF EXISTS "Users create own sos alerts" ON public.sos_alerts;
CREATE POLICY "Users create own sos alerts"
  ON public.sos_alerts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can view their own alerts
DROP POLICY IF EXISTS "Users view own sos alerts" ON public.sos_alerts;
CREATE POLICY "Users view own sos alerts"
  ON public.sos_alerts FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own active alerts (e.g., cancel)
DROP POLICY IF EXISTS "Users update own active alerts" ON public.sos_alerts;
CREATE POLICY "Users update own active alerts"
  ON public.sos_alerts FOR UPDATE
  USING (user_id = auth.uid() AND status = 'active')
  WITH CHECK (user_id = auth.uid());

-- Admins can view all alerts
DROP POLICY IF EXISTS "Admins view all sos alerts" ON public.sos_alerts;
CREATE POLICY "Admins view all sos alerts"
  ON public.sos_alerts FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all alerts
DROP POLICY IF EXISTS "Admins update sos alerts" ON public.sos_alerts;
CREATE POLICY "Admins update sos alerts"
  ON public.sos_alerts FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- RLS POLICIES FOR SOS_EVIDENCE
-- ============================================================================

-- Users can upload evidence for their own alerts
DROP POLICY IF EXISTS "Users upload sos evidence" ON public.sos_evidence;
CREATE POLICY "Users upload sos evidence"
  ON public.sos_evidence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sos_alerts
      WHERE id = sos_evidence.alert_id
        AND user_id = auth.uid()
    )
  );

-- Users can view evidence for their alerts
DROP POLICY IF EXISTS "Users view own sos evidence" ON public.sos_evidence;
CREATE POLICY "Users view own sos evidence"
  ON public.sos_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sos_alerts
      WHERE id = sos_evidence.alert_id
        AND user_id = auth.uid()
    )
  );

-- Admins can view all evidence
DROP POLICY IF EXISTS "Admins view all sos evidence" ON public.sos_evidence;
CREATE POLICY "Admins view all sos evidence"
  ON public.sos_evidence FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- CREATE SOS ALERT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_sos_alert(
  p_alert_type TEXT,
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8),
  p_description TEXT,
  p_request_id UUID DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_contact_phone VARCHAR(20) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  -- Create alert
  INSERT INTO public.sos_alerts (
    user_id,
    request_id,
    alert_type,
    latitude,
    longitude,
    address,
    description,
    contact_phone
  )
  VALUES (
    auth.uid(),
    p_request_id,
    p_alert_type,
    p_latitude,
    p_longitude,
    p_address,
    p_description,
    p_contact_phone
  )
  RETURNING id INTO v_alert_id;

  -- TODO: Trigger real-time notification to admins
  -- This would be handled in your application layer with Supabase Realtime

  RETURN v_alert_id;
END;
$$;

COMMENT ON FUNCTION public.create_sos_alert IS 'User creates emergency SOS alert';

-- ============================================================================
-- ACKNOWLEDGE SOS ALERT FUNCTION (Admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.acknowledge_sos_alert(
  p_alert_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can acknowledge SOS alerts';
  END IF;

  -- Update alert
  UPDATE public.sos_alerts
  SET 
    status = 'acknowledged',
    acknowledged_by = auth.uid(),
    acknowledged_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_alert_id
    AND status = 'active';

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.acknowledge_sos_alert IS 'Admin acknowledges SOS alert';

-- ============================================================================
-- RESOLVE SOS ALERT FUNCTION (Admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.resolve_sos_alert(
  p_alert_id UUID,
  p_resolution_note TEXT DEFAULT NULL,
  p_is_false_alarm BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_status sos_status;
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can resolve SOS alerts';
  END IF;

  -- Determine new status
  v_new_status := CASE WHEN p_is_false_alarm THEN 'false_alarm'::sos_status ELSE 'resolved'::sos_status END;

  -- Update alert
  UPDATE public.sos_alerts
  SET 
    status = v_new_status,
    resolved_by = auth.uid(),
    resolved_at = timezone('utc'::text, now()),
    resolution_note = p_resolution_note,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_alert_id
    AND status IN ('active', 'acknowledged');

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.resolve_sos_alert IS 'Admin resolves SOS alert';

-- ============================================================================
-- CANCEL SOS ALERT FUNCTION (User)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_sos_alert(
  p_alert_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get alert owner
  SELECT user_id INTO v_user_id
  FROM public.sos_alerts
  WHERE id = p_alert_id;

  -- Verify caller is owner
  IF auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Only alert creator can cancel their own alert';
  END IF;

  -- Update alert
  UPDATE public.sos_alerts
  SET 
    status = 'cancelled',
    resolution_note = p_reason,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_alert_id
    AND status = 'active';

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.cancel_sos_alert IS 'User cancels their own active SOS alert';

-- ============================================================================
-- GET ACTIVE SOS ALERTS (Admin Dashboard)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_active_sos_alerts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_phone VARCHAR(20),
  alert_type TEXT,
  description TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address TEXT,
  contact_phone VARCHAR(20),
  request_id UUID,
  status sos_status,
  created_at TIMESTAMPTZ,
  time_elapsed_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can view active SOS alerts';
  END IF;

  RETURN QUERY
  SELECT 
    sa.id,
    sa.user_id,
    p.full_name AS user_name,
    p.phone_number AS user_phone,
    sa.alert_type,
    sa.description,
    sa.latitude,
    sa.longitude,
    sa.address,
    sa.contact_phone,
    sa.request_id,
    sa.status,
    sa.created_at,
    EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - sa.created_at))::INTEGER / 60 AS time_elapsed_minutes
  FROM public.sos_alerts sa
  INNER JOIN public.profiles p ON p.id = sa.user_id
  WHERE sa.status IN ('active', 'acknowledged')
  ORDER BY sa.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_active_sos_alerts IS 'Get all active SOS alerts for admin dashboard';

-- ============================================================================
-- GET NEARBY HELPERS FOR EMERGENCY (For admin to contact)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_nearby_helpers_for_emergency(
  p_alert_id UUID,
  p_max_distance_km INTEGER DEFAULT 10,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  helper_id UUID,
  helper_name TEXT,
  helper_phone VARCHAR(20),
  distance_km DECIMAL(10,2),
  emergency_availability BOOLEAN,
  is_available_now BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_latitude DECIMAL(10,8);
  v_longitude DECIMAL(11,8);
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  -- Get alert location
  SELECT latitude, longitude
  INTO v_latitude, v_longitude
  FROM public.sos_alerts
  WHERE id = p_alert_id;

  -- Find nearby helpers
  RETURN QUERY
  SELECT 
    hp.id,
    p.full_name,
    p.phone_number,
    ROUND(
      (6371 * acos(
        cos(radians(v_latitude)) * 
        cos(radians(hp.latitude)) * 
        cos(radians(hp.longitude) - radians(v_longitude)) + 
        sin(radians(v_latitude)) * 
        sin(radians(hp.latitude))
      ))::numeric, 2
    ) AS distance_km,
    hp.emergency_availability,
    hp.is_available_now
  FROM public.helper_profiles hp
  INNER JOIN public.profiles p ON p.id = hp.id
  WHERE hp.verification_status = 'approved'
    AND hp.latitude IS NOT NULL
    AND hp.longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(v_latitude)) * 
        cos(radians(hp.latitude)) * 
        cos(radians(hp.longitude) - radians(v_longitude)) + 
        sin(radians(v_latitude)) * 
        sin(radians(hp.latitude))
      )
    ) <= p_max_distance_km
  ORDER BY 
    hp.emergency_availability DESC,
    hp.is_available_now DESC,
    distance_km ASC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_nearby_helpers_for_emergency IS 'Find nearby helpers for emergency assistance';

-- ============================================================================
-- GEOFENCE VALIDATION (Check if location matches expected location)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_job_location(
  p_request_id UUID,
  p_current_lat DECIMAL(10,8),
  p_current_lng DECIMAL(11,8),
  p_max_distance_meters INTEGER DEFAULT 500
)
RETURNS TABLE (
  is_valid BOOLEAN,
  distance_meters INTEGER,
  expected_lat DECIMAL(10,8),
  expected_lng DECIMAL(11,8)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expected_lat DECIMAL(10,8);
  v_expected_lng DECIMAL(11,8);
  v_distance_meters INTEGER;
  v_is_valid BOOLEAN;
BEGIN
  -- Get expected location from request
  SELECT latitude, longitude
  INTO v_expected_lat, v_expected_lng
  FROM public.service_requests
  WHERE id = p_request_id;

  -- Calculate distance in meters
  v_distance_meters := (
    6371000 * acos(
      cos(radians(p_current_lat)) * 
      cos(radians(v_expected_lat)) * 
      cos(radians(v_expected_lng) - radians(p_current_lng)) + 
      sin(radians(p_current_lat)) * 
      sin(radians(v_expected_lat))
    )
  )::INTEGER;

  -- Check if within allowed distance
  v_is_valid := v_distance_meters <= p_max_distance_meters;

  RETURN QUERY
  SELECT v_is_valid, v_distance_meters, v_expected_lat, v_expected_lng;
END;
$$;

COMMENT ON FUNCTION public.validate_job_location IS 'Validate helper is at job location (geofencing)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.create_sos_alert TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_sos_alert TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_sos_alert TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_sos_alert TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_sos_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_helpers_for_emergency TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_job_location TO authenticated;

COMMENT ON MIGRATION IS 'SOS emergency system with real-time alerts, geofencing, and admin response';

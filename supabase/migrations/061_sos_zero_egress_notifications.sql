-- SOS Zero Egress Notifications
-- This function notifies nearby helpers (within 5km) entirely in the database
-- Zero client-side egress - all filtering and notification creation happens in PostgreSQL

-- ============================================================================
-- HELPER FUNCTION: Calculate distance using Haversine formula in SQL
-- ============================================================================

-- Drop existing function if exists (to allow parameter name changes)
DROP FUNCTION IF EXISTS public.calculate_distance_km(DECIMAL, DECIMAL, DECIMAL, DECIMAL);

CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R CONSTANT DECIMAL := 6371; -- Earth's radius in km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Handle null coordinates
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- ============================================================================
-- MAIN FUNCTION: Notify helpers within 5km radius - ZERO EGRESS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_nearby_helpers_sos(
  p_alert_id UUID,
  p_customer_id UUID,
  p_customer_lat DECIMAL,
  p_customer_lng DECIMAL,
  p_sos_type TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_radius_km DECIMAL DEFAULT 5.0  -- Default 5km radius
)
RETURNS INTEGER  -- Returns count of helpers notified
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notified_count INTEGER := 0;
BEGIN
  -- Insert notifications for all verified helpers within radius
  -- Everything happens in the database - ZERO client egress
  INSERT INTO public.notifications (
    user_id,
    channel,
    title,
    body,
    data,
    status,
    created_at
  )
  SELECT 
    hp.user_id,
    'push'::TEXT,
    '🚨 EMERGENCY SOS - Someone Needs Help!',
    p_customer_name || ' needs ' || p_sos_type || ' help nearby! 🙏',
    jsonb_build_object(
      'alert_id', p_alert_id::TEXT,
      'type', 'sos_alert',
      'link', '/helper/sos/' || p_alert_id::TEXT,
      'is_sos', true,
      'sos_type', p_sos_type,
      'customer_id', p_customer_id::TEXT,
      'customer_name', p_customer_name,
      'customer_phone', p_customer_phone,
      'customer_lat', p_customer_lat,
      'customer_lng', p_customer_lng,
      'distance_km', ROUND(public.calculate_distance_km(
        p_customer_lat, p_customer_lng,
        hp.latitude, hp.longitude
      )::NUMERIC, 2),
      'requires_action', true
    ),
    'sent',
    NOW()
  FROM public.helper_profiles hp
  WHERE hp.verification_status = 'approved'
    AND hp.latitude IS NOT NULL
    AND hp.longitude IS NOT NULL
    AND public.calculate_distance_km(
      p_customer_lat, p_customer_lng,
      hp.latitude, hp.longitude
    ) <= p_radius_km;
  
  GET DIAGNOSTICS v_notified_count = ROW_COUNT;
  
  -- Also notify admins
  INSERT INTO public.notifications (
    user_id,
    channel,
    title,
    body,
    data,
    status,
    created_at
  )
  SELECT 
    p.id,
    'push'::TEXT,
    '🚨 SOS ALERT: Customer Emergency',
    'A customer has triggered a ' || p_sos_type || ' emergency alert.',
    jsonb_build_object(
      'alert_id', p_alert_id::TEXT,
      'type', 'sos_alert',
      'link', '/admin/sos'
    ),
    'sent',
    NOW()
  FROM public.profiles p
  WHERE p.role = 'admin';
  
  RETURN v_notified_count;
END;
$$;

COMMENT ON FUNCTION public.notify_nearby_helpers_sos IS 'Notifies helpers within specified radius of SOS alert - zero client egress';

-- ============================================================================
-- UPDATE create_sos_alert TO AUTO-NOTIFY (Optional - can be called separately)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_sos_alert_with_notifications(
  p_alert_type TEXT,
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8),
  p_description TEXT,
  p_customer_name TEXT DEFAULT 'A customer',
  p_customer_phone TEXT DEFAULT '',
  p_request_id UUID DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_contact_phone VARCHAR(20) DEFAULT NULL,
  p_radius_km DECIMAL DEFAULT 5.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
  v_notified_count INTEGER;
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
    COALESCE(p_contact_phone, p_customer_phone)
  )
  RETURNING id INTO v_alert_id;

  -- Notify nearby helpers (5km default) - ALL IN DATABASE, ZERO EGRESS
  v_notified_count := public.notify_nearby_helpers_sos(
    v_alert_id,
    auth.uid(),
    p_latitude,
    p_longitude,
    p_alert_type,
    p_customer_name,
    p_customer_phone,
    p_radius_km
  );

  RETURN jsonb_build_object(
    'alert_id', v_alert_id,
    'helpers_notified', v_notified_count
  );
END;
$$;

COMMENT ON FUNCTION public.create_sos_alert_with_notifications IS 'Creates SOS alert and notifies nearby helpers - zero egress';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_distance_km TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_nearby_helpers_sos TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sos_alert_with_notifications TO authenticated;

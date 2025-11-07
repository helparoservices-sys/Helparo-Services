-- Video Call Integration
-- Migration 026: Video consultation system with Agora/Twilio integration

-- ============================================================================
-- VIDEO CALL SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.video_call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES public.service_requests(id),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  helper_id UUID NOT NULL REFERENCES public.profiles(id),
  call_type TEXT NOT NULL CHECK (call_type IN ('consultation', 'pre_booking', 'support', 'training')),
  provider TEXT NOT NULL CHECK (provider IN ('agora', 'twilio', 'jitsi')),
  channel_name TEXT NOT NULL,
  channel_token TEXT,
  app_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'failed')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  recording_url TEXT,
  is_recorded BOOLEAN DEFAULT FALSE,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  connection_issues JSONB, -- logs of connection problems
  participants_count INTEGER DEFAULT 2,
  metadata JSONB, -- custom data like service details
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_video_calls_request ON public.video_call_sessions(request_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_customer ON public.video_call_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_helper ON public.video_call_sessions(helper_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON public.video_call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_scheduled ON public.video_call_sessions(scheduled_at);

DROP TRIGGER IF EXISTS trg_update_video_calls ON public.video_call_sessions;
CREATE TRIGGER trg_update_video_calls
  BEFORE UPDATE ON public.video_call_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view sessions" ON public.video_call_sessions;
CREATE POLICY "Participants view sessions" ON public.video_call_sessions
  FOR SELECT USING (customer_id = auth.uid() OR helper_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Participants update sessions" ON public.video_call_sessions;
CREATE POLICY "Participants update sessions" ON public.video_call_sessions
  FOR UPDATE USING (customer_id = auth.uid() OR helper_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (customer_id = auth.uid() OR helper_id = auth.uid() OR public.is_admin(auth.uid()));

COMMENT ON TABLE public.video_call_sessions IS 'Video consultation sessions with recording and quality tracking';

-- ============================================================================
-- CALL PARTICIPANTS (for group calls)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.call_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL CHECK (role IN ('host', 'participant', 'observer')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  connection_quality TEXT CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_participants_session ON public.call_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.call_participants(user_id);

ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view participants" ON public.call_participants;
CREATE POLICY "Users view participants" ON public.call_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.video_call_sessions
      WHERE id = call_participants.session_id
        AND (customer_id = auth.uid() OR helper_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- ============================================================================
-- CALL RECORDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.call_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
  recording_type TEXT NOT NULL CHECK (recording_type IN ('video', 'audio', 'screen_share')),
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  format TEXT, -- mp4, webm, etc.
  storage_provider TEXT CHECK (storage_provider IN ('supabase', 's3', 'azure', 'gcs')),
  is_available BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_recordings_session ON public.call_recordings(session_id);

ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view recordings" ON public.call_recordings;
CREATE POLICY "Participants view recordings" ON public.call_recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.video_call_sessions
      WHERE id = call_recordings.session_id
        AND (customer_id = auth.uid() OR helper_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- ============================================================================
-- CALL ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.call_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.call_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON public.call_analytics(timestamp);

ALTER TABLE public.call_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view analytics" ON public.call_analytics;
CREATE POLICY "Admins view analytics" ON public.call_analytics
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Create video call session
CREATE OR REPLACE FUNCTION public.create_video_call(
  p_customer_id UUID,
  p_helper_id UUID,
  p_call_type TEXT,
  p_request_id UUID DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  session_id UUID,
  channel_name TEXT,
  channel_token TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id UUID;
  v_channel_name TEXT;
  v_token TEXT;
BEGIN
  IF auth.uid() != p_customer_id AND auth.uid() != p_helper_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Generate unique channel name
  v_channel_name := 'helparo_' || gen_random_uuid()::TEXT;
  
  -- TODO: In production, generate actual Agora/Twilio token via API
  -- For now, using placeholder
  v_token := 'placeholder_token_' || gen_random_uuid()::TEXT;

  INSERT INTO public.video_call_sessions (
    customer_id, helper_id, call_type, request_id,
    provider, channel_name, channel_token, scheduled_at
  ) VALUES (
    p_customer_id, p_helper_id, p_call_type, p_request_id,
    'agora', v_channel_name, v_token, p_scheduled_at
  ) RETURNING id INTO v_session_id;

  -- Add participants
  INSERT INTO public.call_participants (session_id, user_id, role) VALUES
    (v_session_id, p_customer_id, 'host'),
    (v_session_id, p_helper_id, 'participant');

  RETURN QUERY
  SELECT v_session_id, v_channel_name, v_token;
END;$$;

-- Start video call
CREATE OR REPLACE FUNCTION public.start_video_call(
  p_session_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.video_call_sessions
  SET status = 'ongoing',
      started_at = timezone('utc'::text, now())
  WHERE id = p_session_id
    AND (customer_id = p_user_id OR helper_id = p_user_id)
    AND status = 'scheduled';

  UPDATE public.call_participants
  SET joined_at = timezone('utc'::text, now())
  WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND joined_at IS NULL;

  RETURN TRUE;
END;$$;

-- End video call
CREATE OR REPLACE FUNCTION public.end_video_call(
  p_session_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_duration INTEGER;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT started_at INTO v_started_at
  FROM public.video_call_sessions
  WHERE id = p_session_id;

  IF v_started_at IS NOT NULL THEN
    v_duration := EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - v_started_at))::INTEGER;
  END IF;

  UPDATE public.video_call_sessions
  SET status = 'completed',
      ended_at = timezone('utc'::text, now()),
      duration_seconds = v_duration
  WHERE id = p_session_id
    AND (customer_id = p_user_id OR helper_id = p_user_id)
    AND status = 'ongoing';

  -- Update participant duration
  UPDATE public.call_participants
  SET left_at = timezone('utc'::text, now()),
      duration_seconds = EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - joined_at))::INTEGER
  WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND left_at IS NULL;

  RETURN TRUE;
END;$$;

-- Get call history
CREATE OR REPLACE FUNCTION public.get_call_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  session_id UUID,
  call_type TEXT,
  other_user_name TEXT,
  other_user_avatar TEXT,
  status TEXT,
  duration_seconds INTEGER,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    vcs.id,
    vcs.call_type,
    CASE 
      WHEN vcs.customer_id = p_user_id THEN hp.full_name
      ELSE cp.full_name
    END,
    CASE 
      WHEN vcs.customer_id = p_user_id THEN hp.avatar_url
      ELSE cp.avatar_url
    END,
    vcs.status,
    vcs.duration_seconds,
    vcs.scheduled_at,
    vcs.created_at
  FROM public.video_call_sessions vcs
  LEFT JOIN public.profiles cp ON cp.id = vcs.customer_id
  LEFT JOIN public.profiles hp ON hp.id = vcs.helper_id
  WHERE vcs.customer_id = p_user_id OR vcs.helper_id = p_user_id
  ORDER BY vcs.created_at DESC
  LIMIT p_limit;
END;$$;

-- Get active call sessions count
CREATE OR REPLACE FUNCTION public.get_active_calls_count()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.video_call_sessions
    WHERE status = 'ongoing'
  );
END;$$;

-- Get call statistics
CREATE OR REPLACE FUNCTION public.get_call_statistics(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_calls INTEGER,
  completed_calls INTEGER,
  total_duration_minutes INTEGER,
  avg_call_duration_minutes INTEGER,
  avg_quality_rating DECIMAL
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_start := COALESCE(p_start_date, timezone('utc'::text, now()) - INTERVAL '30 days');
  v_end := COALESCE(p_end_date, timezone('utc'::text, now()));

  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER,
    SUM(duration_seconds)::INTEGER / 60,
    AVG(duration_seconds)::INTEGER / 60,
    AVG(quality_rating)::DECIMAL(3,2)
  FROM public.video_call_sessions
  WHERE created_at BETWEEN v_start AND v_end;
END;$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.create_video_call TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_video_call TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_video_call TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_call_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_calls_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_call_statistics TO authenticated;

COMMENT ON MIGRATION IS 'Video consultation system with Agora/Twilio integration and recording support';

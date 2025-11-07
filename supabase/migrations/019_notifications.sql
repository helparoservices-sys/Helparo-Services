-- Push Notifications Infrastructure
-- Migration 019: Notification preferences, templates, tokens, delivery logs

-- ============================================================================
-- ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('push','in_app','email','sms');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('queued','sent','failed','read');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- DEVICE TOKENS (FCM/APNs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  provider TEXT DEFAULT 'fcm', -- 'fcm' or 'apns'
  device_type TEXT,            -- 'ios' | 'android' | 'web'
  is_active BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_device_tokens_token ON public.device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens(user_id);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER NOTIFICATION PREFERENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours JSONB,  -- {"start":"22:00","end":"07:00","timezone":"Asia/Kolkata"}
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_update_user_notification_prefs ON public.user_notification_prefs;
CREATE TRIGGER trg_update_user_notification_prefs
  BEFORE UPDATE ON public.user_notification_prefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTIFICATION TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT UNIQUE NOT NULL,          -- e.g. 'bid_received', 'job_started'
  channel notification_channel NOT NULL,
  title TEXT,
  body TEXT NOT NULL,                         -- may include placeholders like {{request_title}}
  data_schema JSONB,                          -- documentation of expected data
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_update_notification_templates ON public.notification_templates;
CREATE TRIGGER trg_update_notification_templates
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTIFICATION LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  channel notification_channel NOT NULL DEFAULT 'push',
  title TEXT,
  body TEXT NOT NULL,
  data JSONB,
  status notification_status NOT NULL DEFAULT 'queued',
  error TEXT,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Device tokens
DROP POLICY IF EXISTS "Users manage own tokens" ON public.device_tokens;
CREATE POLICY "Users manage own tokens" ON public.device_tokens
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notification prefs
DROP POLICY IF EXISTS "Users manage own prefs" ON public.user_notification_prefs;
CREATE POLICY "Users manage own prefs" ON public.user_notification_prefs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Templates
DROP POLICY IF EXISTS "Public read active templates" ON public.notification_templates;
CREATE POLICY "Public read active templates" ON public.notification_templates
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage templates" ON public.notification_templates;
CREATE POLICY "Admins manage templates" ON public.notification_templates
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Notifications
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
CREATE POLICY "System insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Register device token
CREATE OR REPLACE FUNCTION public.register_device_token(
  p_token TEXT,
  p_device_type TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT 'fcm'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.device_tokens(user_id, token, provider, device_type, last_seen_at)
  VALUES (auth.uid(), p_token, p_provider, p_device_type, timezone('utc'::text, now()))
  ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, is_active = TRUE, last_seen_at = EXCLUDED.last_seen_at
  RETURNING id INTO v_id;
  RETURN v_id;
END;$$;

COMMENT ON FUNCTION public.register_device_token IS 'Registers or updates a device token for push notifications.';

-- Upsert user prefs
CREATE OR REPLACE FUNCTION public.set_notification_pref(
  p_channel notification_channel,
  p_enabled BOOLEAN
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row user_notification_prefs%ROWTYPE;
BEGIN
  INSERT INTO public.user_notification_prefs(user_id)
  VALUES(auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  IF p_channel = 'push' THEN
    UPDATE public.user_notification_prefs SET push_enabled = p_enabled WHERE user_id = auth.uid();
  ELSIF p_channel = 'in_app' THEN
    UPDATE public.user_notification_prefs SET in_app_enabled = p_enabled WHERE user_id = auth.uid();
  ELSIF p_channel = 'email' THEN
    UPDATE public.user_notification_prefs SET email_enabled = p_enabled WHERE user_id = auth.uid();
  ELSIF p_channel = 'sms' THEN
    UPDATE public.user_notification_prefs SET sms_enabled = p_enabled WHERE user_id = auth.uid();
  END IF;

  RETURN TRUE;
END;$$;

COMMENT ON FUNCTION public.set_notification_pref IS 'Enables/disables a channel for the current user.';

-- Enqueue notification (sending is done in app server/edge function)
CREATE OR REPLACE FUNCTION public.enqueue_notification(
  p_user_id UUID,
  p_channel notification_channel,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT NULL,
  p_request_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications(user_id, request_id, channel, title, body, data)
  VALUES(p_user_id, p_request_id, p_channel, p_title, p_body, p_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;$$;

COMMENT ON FUNCTION public.enqueue_notification IS 'Queues a notification record to be delivered by application worker.';

-- Mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.notifications
  SET status = 'read', read_at = timezone('utc'::text, now())
  WHERE id = p_notification_id AND user_id = auth.uid();
  RETURN FOUND;
END;$$;

COMMENT ON FUNCTION public.mark_notification_read IS 'Marks a notification as read by the owner.';

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.register_device_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_notification_pref TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read TO authenticated;

COMMENT ON MIGRATION IS 'Notifications infrastructure: tokens, preferences, templates, and logs with enqueue functions.';

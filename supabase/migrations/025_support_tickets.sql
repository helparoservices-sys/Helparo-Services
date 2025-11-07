-- Support Ticket System
-- Migration 025: Complete customer support with tickets, chat, and SLA tracking

-- ============================================================================
-- SUPPORT TICKETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id),
  category TEXT NOT NULL CHECK (category IN ('booking_issue', 'payment_issue', 'helper_complaint', 'technical_issue', 'account_issue', 'refund_request', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachments JSONB, -- array of file URLs
  assigned_to UUID REFERENCES public.profiles(id), -- admin/support agent
  assigned_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Generate ticket number automatically
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_date TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_date := TO_CHAR(timezone('utc'::text, now()), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.support_tickets
  WHERE ticket_number LIKE 'TKT-' || v_date || '-%';
  
  v_number := 'TKT-' || v_date || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;$$;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_set_ticket_number ON public.support_tickets;
CREATE TRIGGER trg_set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON public.support_tickets(created_at DESC);

DROP TRIGGER IF EXISTS trg_update_tickets ON public.support_tickets;
CREATE TRIGGER trg_update_tickets
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own tickets" ON public.support_tickets;
CREATE POLICY "Users view own tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users create tickets" ON public.support_tickets;
CREATE POLICY "Users create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage tickets" ON public.support_tickets;
CREATE POLICY "Admins manage tickets" ON public.support_tickets
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMENT ON TABLE public.support_tickets IS 'Customer support tickets with SLA tracking';

-- ============================================================================
-- TICKET MESSAGES (chat/conversation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  attachments JSONB,
  is_internal BOOLEAN DEFAULT FALSE, -- internal notes visible only to admins
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ticket_msgs_ticket ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_msgs_created ON public.ticket_messages(created_at DESC);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view ticket messages" ON public.ticket_messages;
CREATE POLICY "Users view ticket messages" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_messages.ticket_id
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_admin(auth.uid()))
    )
    AND (is_internal = FALSE OR public.is_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Users send messages" ON public.ticket_messages;
CREATE POLICY "Users send messages" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_id
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- ============================================================================
-- SLA CONFIGURATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sla_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  priority TEXT NOT NULL UNIQUE CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  first_response_minutes INTEGER NOT NULL,
  resolution_minutes INTEGER NOT NULL,
  escalation_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.sla_configurations (priority, first_response_minutes, resolution_minutes, escalation_minutes) VALUES
  ('low', 1440, 10080, 720),      -- 24h response, 7 days resolution, 12h escalation
  ('medium', 480, 2880, 360),     -- 8h response, 2 days resolution, 6h escalation
  ('high', 120, 1440, 60),        -- 2h response, 24h resolution, 1h escalation
  ('urgent', 30, 480, 15)         -- 30min response, 8h resolution, 15min escalation
ON CONFLICT (priority) DO NOTHING;

DROP TRIGGER IF EXISTS trg_update_sla ON public.sla_configurations;
CREATE TRIGGER trg_update_sla
  BEFORE UPDATE ON public.sla_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.sla_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view SLA" ON public.sla_configurations;
CREATE POLICY "Anyone view SLA" ON public.sla_configurations
  FOR SELECT USING (true);

-- ============================================================================
-- TICKET ACTIVITY LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ticket_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'assigned', 'status_changed', 'priority_changed', 'message_sent', 'resolved', 'closed', 'reopened')),
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_activity_ticket ON public.ticket_activity_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.ticket_activity_log(created_at DESC);

ALTER TABLE public.ticket_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view ticket activity" ON public.ticket_activity_log;
CREATE POLICY "Users view ticket activity" ON public.ticket_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_activity_log.ticket_id
        AND (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Create support ticket
CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_user_id UUID,
  p_category TEXT,
  p_priority TEXT,
  p_subject TEXT,
  p_description TEXT,
  p_request_id UUID DEFAULT NULL,
  p_attachments JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ticket_id UUID;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.support_tickets (
    user_id, category, priority, subject, description, request_id, attachments
  ) VALUES (
    p_user_id, p_category, p_priority, p_subject, p_description, p_request_id, p_attachments
  ) RETURNING id INTO v_ticket_id;

  -- Log activity
  INSERT INTO public.ticket_activity_log (ticket_id, actor_id, action, new_value)
  VALUES (v_ticket_id, p_user_id, 'created', p_priority);

  RETURN v_ticket_id;
END;$$;

-- Assign ticket to agent
CREATE OR REPLACE FUNCTION public.assign_ticket(
  p_ticket_id UUID,
  p_agent_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_agent UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT assigned_to INTO v_old_agent FROM public.support_tickets WHERE id = p_ticket_id;

  UPDATE public.support_tickets
  SET assigned_to = p_agent_id,
      assigned_at = timezone('utc'::text, now()),
      status = CASE WHEN status = 'open' THEN 'assigned' ELSE status END
  WHERE id = p_ticket_id;

  -- Log activity
  INSERT INTO public.ticket_activity_log (ticket_id, actor_id, action, old_value, new_value)
  VALUES (p_ticket_id, auth.uid(), 'assigned', v_old_agent::TEXT, p_agent_id::TEXT);

  RETURN TRUE;
END;$$;

-- Update ticket status
CREATE OR REPLACE FUNCTION public.update_ticket_status(
  p_ticket_id UUID,
  p_status TEXT,
  p_resolution_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old_status TEXT;
  v_ticket RECORD;
BEGIN
  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id;

  IF NOT public.is_admin(auth.uid()) AND v_ticket.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_old_status := v_ticket.status;

  UPDATE public.support_tickets
  SET status = p_status,
      resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
      first_response_at = CASE 
        WHEN first_response_at IS NULL AND p_status != 'open' 
        THEN timezone('utc'::text, now()) 
        ELSE first_response_at 
      END,
      resolved_at = CASE 
        WHEN p_status = 'resolved' THEN timezone('utc'::text, now()) 
        ELSE resolved_at 
      END,
      closed_at = CASE 
        WHEN p_status = 'closed' THEN timezone('utc'::text, now()) 
        ELSE closed_at 
      END
  WHERE id = p_ticket_id;

  -- Log activity
  INSERT INTO public.ticket_activity_log (ticket_id, actor_id, action, old_value, new_value, notes)
  VALUES (p_ticket_id, auth.uid(), 'status_changed', v_old_status, p_status, p_resolution_notes);

  RETURN TRUE;
END;$$;

-- Get ticket SLA status
CREATE OR REPLACE FUNCTION public.get_ticket_sla_status(p_ticket_id UUID)
RETURNS TABLE (
  is_first_response_breached BOOLEAN,
  is_resolution_breached BOOLEAN,
  first_response_due_at TIMESTAMPTZ,
  resolution_due_at TIMESTAMPTZ,
  minutes_to_first_response INTEGER,
  minutes_to_resolution INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ticket RECORD;
  v_sla RECORD;
BEGIN
  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id;
  
  SELECT * INTO v_sla FROM public.sla_configurations 
  WHERE priority = v_ticket.priority AND is_active = TRUE;

  RETURN QUERY
  SELECT 
    (v_ticket.first_response_at IS NULL AND 
     timezone('utc'::text, now()) > v_ticket.created_at + (v_sla.first_response_minutes || ' minutes')::INTERVAL)::BOOLEAN,
    (v_ticket.resolved_at IS NULL AND 
     timezone('utc'::text, now()) > v_ticket.created_at + (v_sla.resolution_minutes || ' minutes')::INTERVAL)::BOOLEAN,
    v_ticket.created_at + (v_sla.first_response_minutes || ' minutes')::INTERVAL,
    v_ticket.created_at + (v_sla.resolution_minutes || ' minutes')::INTERVAL,
    EXTRACT(EPOCH FROM (
      (v_ticket.created_at + (v_sla.first_response_minutes || ' minutes')::INTERVAL) - timezone('utc'::text, now())
    ))::INTEGER / 60,
    EXTRACT(EPOCH FROM (
      (v_ticket.created_at + (v_sla.resolution_minutes || ' minutes')::INTERVAL) - timezone('utc'::text, now())
    ))::INTEGER / 60;
END;$$;

-- Get support statistics
CREATE OR REPLACE FUNCTION public.get_support_statistics(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_tickets INTEGER,
  open_tickets INTEGER,
  resolved_tickets INTEGER,
  avg_first_response_minutes INTEGER,
  avg_resolution_minutes INTEGER,
  sla_compliance_pct DECIMAL
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
BEGIN
  v_start := COALESCE(p_start_date, timezone('utc'::text, now()) - INTERVAL '30 days');
  v_end := COALESCE(p_end_date, timezone('utc'::text, now()));

  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE status IN ('open', 'assigned', 'in_progress'))::INTEGER AS open_count,
    COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::INTEGER AS resolved_count,
    AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60)::INTEGER AS avg_first_resp,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)::INTEGER AS avg_resolution,
    (COUNT(*) FILTER (
      WHERE resolved_at IS NOT NULL 
        AND resolved_at <= created_at + (
          SELECT resolution_minutes FROM public.sla_configurations 
          WHERE priority = support_tickets.priority
        ) * INTERVAL '1 minute'
    )::DECIMAL / NULLIF(COUNT(*) FILTER (WHERE resolved_at IS NOT NULL), 0) * 100)::DECIMAL(5,2)
  FROM public.support_tickets
  WHERE created_at BETWEEN v_start AND v_end;
END;$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.create_support_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ticket_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ticket_sla_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_support_statistics TO authenticated;

COMMENT ON MIGRATION IS 'Complete support ticket system with SLA tracking, chat, and activity logs';

-- Enhanced messages with read receipts, typing, file uploads
-- Extension to 008_messages.sql

-- Add read receipts
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'document', 'audio', 'video')),
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Typing indicators table (ephemeral data, auto-expire)
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (request_id, user_id)
);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants see typing" ON public.typing_indicators;
CREATE POLICY "Participants see typing" ON public.typing_indicators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = request_id
        AND (r.customer_id = auth.uid() OR r.assigned_helper_id = auth.uid())
    )
  );

-- Mark message as read
CREATE OR REPLACE FUNCTION mark_message_read(p_message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = timezone('utc'::text, now())
  WHERE id = p_message_id
    AND read_at IS NULL
    AND sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = messages.request_id
        AND (r.customer_id = auth.uid() OR r.assigned_helper_id = auth.uid())
    );
END;
$$;

-- Mark all messages in request as read
CREATE OR REPLACE FUNCTION mark_all_messages_read(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = timezone('utc'::text, now())
  WHERE request_id = p_request_id
    AND read_at IS NULL
    AND sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = p_request_id
        AND (r.customer_id = auth.uid() OR r.assigned_helper_id = auth.uid())
    );
END;
$$;

-- Get unread count per request
CREATE OR REPLACE FUNCTION get_unread_message_count(p_request_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.messages
  WHERE request_id = p_request_id
    AND sender_id != auth.uid()
    AND read_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = p_request_id
        AND (r.customer_id = auth.uid() OR r.assigned_helper_id = auth.uid())
    );
    
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Set typing indicator (auto-expires after 5 seconds)
CREATE OR REPLACE FUNCTION set_typing_indicator(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.typing_indicators (request_id, user_id)
  VALUES (p_request_id, auth.uid())
  ON CONFLICT (request_id, user_id) 
  DO UPDATE SET started_at = timezone('utc'::text, now());
  
  -- Clean up old indicators (>10 seconds)
  DELETE FROM public.typing_indicators
  WHERE started_at < (timezone('utc'::text, now()) - INTERVAL '10 seconds');
END;
$$;

-- Clear typing indicator
CREATE OR REPLACE FUNCTION clear_typing_indicator(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE request_id = p_request_id
    AND user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION mark_message_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_messages_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;
GRANT EXECUTE ON FUNCTION set_typing_indicator TO authenticated;
GRANT EXECUTE ON FUNCTION clear_typing_indicator TO authenticated;

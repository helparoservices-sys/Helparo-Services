-- Enable Realtime for broadcast_notifications table
-- This is required for helpers to receive real-time job alerts

-- Enable replica identity for realtime to work with filters
ALTER TABLE broadcast_notifications REPLICA IDENTITY FULL;

-- Add table to realtime publication
DO $$
BEGIN
  -- Check if publication exists
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add table to existing publication
    ALTER PUBLICATION supabase_realtime ADD TABLE broadcast_notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already in publication, ignore
    NULL;
END
$$;

-- Also enable realtime for service_requests for cancellation updates
ALTER TABLE service_requests REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$$;

-- Grant necessary permissions
GRANT SELECT ON broadcast_notifications TO authenticated;
GRANT SELECT ON service_requests TO authenticated;

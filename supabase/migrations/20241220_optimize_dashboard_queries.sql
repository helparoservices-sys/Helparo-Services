-- PRODUCTION OPTIMIZATION: Combined Dashboard Query
-- This reduces 3 separate queries into 1 RPC call
-- Estimated reduction: 20-25% of dashboard queries

CREATE OR REPLACE FUNCTION get_customer_requests_summary(customer_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  active_cnt INTEGER;
  completed_cnt INTEGER;
  recent_requests JSON;
BEGIN
  -- Get active count
  SELECT COUNT(*)::INTEGER INTO active_cnt
  FROM service_requests
  WHERE customer_id = customer_uuid
    AND broadcast_status IN ('broadcasting', 'accepted', 'on_way', 'arrived', 'in_progress');
  
  -- Get completed count
  SELECT COUNT(*)::INTEGER INTO completed_cnt
  FROM service_requests
  WHERE customer_id = customer_uuid
    AND broadcast_status = 'completed';
  
  -- Get recent requests
  SELECT json_agg(t) INTO recent_requests
  FROM (
    SELECT id, title, status, broadcast_status, created_at, city
    FROM service_requests
    WHERE customer_id = customer_uuid
    ORDER BY created_at DESC
    LIMIT 5
  ) t;
  
  -- Combine into single JSON response
  result := json_build_object(
    'requests', COALESCE(recent_requests, '[]'::json),
    'active_count', COALESCE(active_cnt, 0),
    'completed_count', COALESCE(completed_cnt, 0)
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_customer_requests_summary(UUID) TO authenticated;

COMMENT ON FUNCTION get_customer_requests_summary IS 'OPTIMIZATION: Combines 3 dashboard queries into 1 RPC call - reduces requests by 66%';

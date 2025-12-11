-- =============================================
-- CRITICAL FIX: RLS Policies for Broadcast Flow
-- Run this in Supabase SQL Editor NOW
-- =============================================

-- Step 1: Check if customer can see their requests
-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'service_requests';

-- Step 2: Drop ALL existing service_requests policies and recreate clean ones
DROP POLICY IF EXISTS "Customers manage own requests" ON service_requests;
DROP POLICY IF EXISTS "Customers can view their requests" ON service_requests;
DROP POLICY IF EXISTS "Helpers can view open requests" ON service_requests;
DROP POLICY IF EXISTS "Helpers can view assigned requests" ON service_requests;
DROP POLICY IF EXISTS "Helpers can update assigned requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON service_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON service_requests;
DROP POLICY IF EXISTS "service_requests_select_policy" ON service_requests;
DROP POLICY IF EXISTS "service_requests_insert_policy" ON service_requests;
DROP POLICY IF EXISTS "service_requests_update_policy" ON service_requests;

-- Step 3: Create simple, working policies

-- Customers can do everything with their own requests
CREATE POLICY "Customers full access to own requests"
  ON service_requests FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Helpers can view requests assigned to them
CREATE POLICY "Helpers view assigned requests"
  ON service_requests FOR SELECT
  USING (
    assigned_helper_id IN (
      SELECT id FROM helper_profiles WHERE user_id = auth.uid()
    )
  );

-- Helpers can view open/broadcasting requests (to see available jobs)
CREATE POLICY "Helpers view broadcasting requests"
  ON service_requests FOR SELECT
  USING (
    broadcast_status = 'broadcasting'
    AND EXISTS (SELECT 1 FROM helper_profiles WHERE user_id = auth.uid() AND is_approved = true)
  );

-- Helpers can update requests assigned to them
CREATE POLICY "Helpers update assigned requests"
  ON service_requests FOR UPDATE
  USING (
    assigned_helper_id IN (
      SELECT id FROM helper_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    assigned_helper_id IN (
      SELECT id FROM helper_profiles WHERE user_id = auth.uid()
    )
  );

-- Service role (for API calls) can do everything
-- This is handled by default with service_role key

-- Step 4: Verify RLS is enabled
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Step 5: Also fix broadcast_notifications to allow service inserts
DROP POLICY IF EXISTS "System can insert broadcast notifications" ON broadcast_notifications;
CREATE POLICY "Allow all inserts to broadcast_notifications"
  ON broadcast_notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access" ON broadcast_notifications;
CREATE POLICY "Service role full access"
  ON broadcast_notifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 6: Test query - this should return your request
-- Replace the UUID with an actual request ID to test
-- SELECT * FROM service_requests WHERE customer_id = auth.uid() LIMIT 5;

SELECT 'RLS Policies Fixed!' as status;

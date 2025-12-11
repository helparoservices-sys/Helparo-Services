-- Fix RLS Policy so customers can see their own service requests
-- Run this in Supabase SQL Editor

-- First, check existing policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'service_requests';

-- Drop and recreate customer policy to ensure it works
DROP POLICY IF EXISTS "Customers manage own requests" ON service_requests;
CREATE POLICY "Customers manage own requests"
  ON service_requests FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Also allow customers to SELECT their requests even if status changes
DROP POLICY IF EXISTS "Customers can view their requests" ON service_requests;
CREATE POLICY "Customers can view their requests"
  ON service_requests FOR SELECT
  USING (customer_id = auth.uid());

-- Allow helpers to view requests they're assigned to
DROP POLICY IF EXISTS "Helpers can view assigned requests" ON service_requests;
CREATE POLICY "Helpers can view assigned requests"
  ON service_requests FOR SELECT
  USING (
    assigned_helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid())
  );

-- Allow helpers to update requests they're assigned to
DROP POLICY IF EXISTS "Helpers can update assigned requests" ON service_requests;
CREATE POLICY "Helpers can update assigned requests"
  ON service_requests FOR UPDATE
  USING (
    assigned_helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid())
  );

-- Verify the policies were created
SELECT 'Policies updated!' as status;

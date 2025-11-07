-- =====================================================
-- Test Data Seed Script
-- Run this AFTER all migrations (001-010) are applied
-- Creates sample users, services, and requests for testing
-- =====================================================

-- NOTE: You'll need to create actual auth users in Supabase Auth UI first,
-- then update the UUIDs below with real user IDs

-- =====================================================
-- 1. CREATE TEST USERS (Manual Step)
-- =====================================================
-- Go to Supabase Dashboard → Authentication → Users
-- Create these users manually:
-- 
-- 1. test.customer@helparo.com (password: Test@123456)
-- 2. test.helper@helparo.com (password: Test@123456)
-- 3. test.admin@helparo.com (password: Test@123456)
--
-- Then copy their user IDs and replace in the script below

-- =====================================================
-- 2. SAMPLE VARIABLE SETUP
-- =====================================================
-- Replace these with actual user IDs from Supabase Auth
DO $$
DECLARE
  v_customer_id UUID := 'REPLACE_WITH_CUSTOMER_USER_ID'; -- From Supabase Auth
  v_helper_id UUID := 'REPLACE_WITH_HELPER_USER_ID';     -- From Supabase Auth
  v_admin_id UUID := 'REPLACE_WITH_ADMIN_USER_ID';       -- From Supabase Auth
  v_category_cleaning UUID;
  v_category_plumbing UUID;
  v_request_id UUID;
BEGIN
  -- =====================================================
  -- 3. UPDATE PROFILES
  -- =====================================================
  -- Update customer profile
  UPDATE profiles 
  SET 
    role = 'customer',
    full_name = 'Test Customer',
    country_code = '+91'
  WHERE id = v_customer_id;
  
  -- Update helper profile
  UPDATE profiles 
  SET 
    role = 'helper',
    full_name = 'Test Helper',
    country_code = '+91'
  WHERE id = v_helper_id;
  
  -- Update admin profile
  UPDATE profiles 
  SET 
    role = 'admin',
    full_name = 'Admin User',
    country_code = '+91'
  WHERE id = v_admin_id;
  
  RAISE NOTICE 'Profiles updated';

  -- =====================================================
  -- 4. CREATE HELPER PROFILE
  -- =====================================================
  INSERT INTO helper_profiles (
    user_id,
    service_categories,
    skills,
    experience_years,
    hourly_rate,
    is_approved,
    verification_status
  )
  VALUES (
    v_helper_id,
    ARRAY['cleaning', 'plumbing'],
    ARRAY['home-cleaning', 'pipe-repair', 'fixture-installation'],
    3,
    500,
    true,  -- Auto-approve for testing
    'approved'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    is_approved = true,
    verification_status = 'approved';
  
  RAISE NOTICE 'Helper profile created';

  -- =====================================================
  -- 5. GET CATEGORY IDs
  -- =====================================================
  SELECT id INTO v_category_cleaning 
  FROM service_categories 
  WHERE slug = 'home-cleaning' 
  LIMIT 1;
  
  SELECT id INTO v_category_plumbing 
  FROM service_categories 
  WHERE slug = 'plumbing' 
  LIMIT 1;
  
  -- =====================================================
  -- 6. CREATE HELPER SERVICES
  -- =====================================================
  INSERT INTO helper_services (helper_id, category_id, hourly_rate, experience_years)
  VALUES 
    (v_helper_id, v_category_cleaning, 400, 3),
    (v_helper_id, v_category_plumbing, 600, 3)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Helper services added';

  -- =====================================================
  -- 7. CREATE SAMPLE SERVICE REQUEST
  -- =====================================================
  INSERT INTO service_requests (
    customer_id,
    category_id,
    title,
    description,
    city,
    country,
    budget_min,
    budget_max,
    status
  )
  VALUES (
    v_customer_id,
    v_category_cleaning,
    'Need deep cleaning for 2BHK apartment',
    'Looking for professional cleaning service for a 2BHK apartment in Mumbai. Need deep cleaning including kitchen, bathrooms, and all rooms.',
    'Mumbai',
    'India',
    2000,
    3000,
    'open'
  )
  RETURNING id INTO v_request_id;
  
  RAISE NOTICE 'Sample service request created: %', v_request_id;

  -- =====================================================
  -- 8. ACCEPT LEGAL TERMS FOR ALL USERS
  -- =====================================================
  -- Get latest versions
  INSERT INTO legal_acceptances (user_id, document_type, document_version)
  SELECT v_customer_id, 'terms', version FROM legal_documents WHERE type = 'terms' AND is_active = true
  UNION ALL
  SELECT v_customer_id, 'privacy', version FROM legal_documents WHERE type = 'privacy' AND is_active = true
  UNION ALL
  SELECT v_helper_id, 'terms', version FROM legal_documents WHERE type = 'terms' AND is_active = true
  UNION ALL
  SELECT v_helper_id, 'privacy', version FROM legal_documents WHERE type = 'privacy' AND is_active = true
  UNION ALL
  SELECT v_admin_id, 'terms', version FROM legal_documents WHERE type = 'terms' AND is_active = true
  UNION ALL
  SELECT v_admin_id, 'privacy', version FROM legal_documents WHERE type = 'privacy' AND is_active = true
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Legal acceptances created';

END $$;

-- =====================================================
-- 9. VERIFICATION (Optional - Skip for Testing)
-- =====================================================
-- Helper is already marked as approved above
-- In production, helper would upload documents first

-- =====================================================
-- 10. VERIFY TEST DATA
-- =====================================================
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Helper Profiles', COUNT(*) FROM helper_profiles
UNION ALL
SELECT 'Service Categories', COUNT(*) FROM service_categories
UNION ALL
SELECT 'Helper Services', COUNT(*) FROM helper_services
UNION ALL
SELECT 'Service Requests', COUNT(*) FROM service_requests
UNION ALL
SELECT 'Legal Acceptances', COUNT(*) FROM legal_acceptances
UNION ALL
SELECT 'Wallet Accounts', COUNT(*) FROM wallet_accounts;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================
-- 1. Create 3 users in Supabase Auth UI
-- 2. Copy their user IDs
-- 3. Replace the UUIDs at the top of this script
-- 4. Run this script in SQL Editor
-- 5. Test the flow:
--    - Login as customer
--    - Go to /customer/wallet
--    - Fund the created request
--    - Login as helper
--    - Apply to the request
--    - Login as customer again
--    - Assign the helper
--    - Mark complete
--    - Verify payment released

-- Test credentials:
-- Customer: test.customer@helparo.com / Test@123456
-- Helper: test.helper@helparo.com / Test@123456
-- Admin: test.admin@helparo.com / Test@123456

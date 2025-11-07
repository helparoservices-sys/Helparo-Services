-- Comprehensive admin user debug and fix script
-- Run each section separately in Supabase SQL Editor

-- ========================================
-- SECTION 1: Check all authentication users
-- ========================================
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at as user_created,
  pr.role,
  pr.full_name,
  pr.phone_number,
  pr.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles pr ON pr.id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

-- ========================================
-- SECTION 2: Find test.admin@helparo.com specifically
-- ========================================
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  u.confirmed_at,
  pr.id as profile_id,
  pr.role,
  pr.full_name,
  pr.email as profile_email
FROM auth.users u
LEFT JOIN public.profiles pr ON pr.id = u.id
WHERE u.email = 'test.admin@helparo.com';

-- ========================================
-- SECTION 3: If user exists but no profile, get the user ID
-- Copy the user ID from above and use in next section
-- ========================================

-- ========================================
-- SECTION 4: CREATE/FIX ADMIN PROFILE
-- Replace YOUR_ADMIN_USER_ID with actual ID from Section 2
-- ========================================

-- First, let's see if we can insert directly
DO $$
DECLARE
  v_admin_user_id UUID;
BEGIN
  -- Get the admin user ID
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = 'test.admin@helparo.com';
  
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User test.admin@helparo.com not found in auth.users. Please create user first in Supabase Auth Dashboard.';
  END IF;
  
  RAISE NOTICE 'Found admin user ID: %', v_admin_user_id;
  
  -- Insert or update profile
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    full_name, 
    country_code,
    phone_number
  )
  VALUES (
    v_admin_user_id,
    'test.admin@helparo.com',
    'admin',
    'Admin User',
    '+91',
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Admin User',
    email = 'test.admin@helparo.com',
    updated_at = NOW();
  
  RAISE NOTICE 'Admin profile created/updated successfully';
END $$;

-- ========================================
-- SECTION 5: VERIFY THE FIX
-- ========================================
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  pr.role,
  pr.full_name,
  pr.country_code,
  CASE 
    WHEN pr.role = 'admin' THEN '✅ CORRECT'
    WHEN pr.role IS NULL THEN '❌ NO PROFILE'
    ELSE '⚠️ WRONG ROLE: ' || pr.role
  END as status
FROM auth.users u
LEFT JOIN public.profiles pr ON pr.id = u.id
WHERE u.email = 'test.admin@helparo.com';

-- ========================================
-- SECTION 6: Test is_admin function
-- ========================================
SELECT 
  u.id,
  u.email,
  pr.role,
  public.is_admin(u.id) as is_admin_result
FROM auth.users u
LEFT JOIN public.profiles pr ON pr.id = u.id
WHERE u.email = 'test.admin@helparo.com';

-- Expected: is_admin_result should be TRUE

-- ========================================
-- SECTION 7: If still not working, check the is_admin function
-- ========================================
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'is_admin';

-- ========================================
-- SECTION 8: Create helper and customer test users too
-- ========================================
DO $$
DECLARE
  v_customer_id UUID;
  v_helper_id UUID;
BEGIN
  -- Customer
  SELECT id INTO v_customer_id FROM auth.users WHERE email = 'test.customer@helparo.com';
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role, full_name, country_code)
    VALUES (v_customer_id, 'test.customer@helparo.com', 'customer', 'Test Customer', '+91')
    ON CONFLICT (id) DO UPDATE SET role = 'customer', full_name = 'Test Customer';
    RAISE NOTICE 'Customer profile created/updated';
  END IF;
  
  -- Helper
  SELECT id INTO v_helper_id FROM auth.users WHERE email = 'test.helper@helparo.com';
  IF v_helper_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role, full_name, country_code)
    VALUES (v_helper_id, 'test.helper@helparo.com', 'helper', 'Test Helper', '+91')
    ON CONFLICT (id) DO UPDATE SET role = 'helper', full_name = 'Test Helper';
    
    -- Also create helper_profile
    INSERT INTO public.helper_profiles (user_id, is_approved, verification_status)
    VALUES (v_helper_id, true, 'approved')
    ON CONFLICT (user_id) DO UPDATE SET is_approved = true, verification_status = 'approved';
    
    RAISE NOTICE 'Helper profile created/updated';
  END IF;
END $$;

-- ========================================
-- FINAL VERIFICATION
-- ========================================
SELECT 
  'All Test Users Status' as info,
  u.email,
  pr.role,
  CASE 
    WHEN pr.role IS NOT NULL THEN '✅ OK'
    ELSE '❌ NO PROFILE'
  END as status
FROM auth.users u
LEFT JOIN public.profiles pr ON pr.id = u.id
WHERE u.email IN ('test.admin@helparo.com', 'test.customer@helparo.com', 'test.helper@helparo.com')
ORDER BY u.email;

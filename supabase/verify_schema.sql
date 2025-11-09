-- =====================================================
-- SCHEMA VERIFICATION SCRIPT
-- Run this to verify all columns exist in your tables
-- =====================================================

-- Check profiles table columns
SELECT 
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'id', 'email', 'full_name', 'phone', 'role', 
    'status', 'is_banned', 'ban_reason', 'created_at'
  )
ORDER BY column_name;

-- Check helper_profiles table columns
SELECT 
  'helper_profiles' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'helper_profiles'
  AND column_name IN ('is_approved', 'service_categories')
ORDER BY column_name;

-- Check if status enum exists
SELECT 
  'user_status enum' as check_name,
  enumlabel as value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_status'
ORDER BY e.enumsortorder;

-- Test query (same as in the app)
SELECT 
  id, 
  full_name, 
  email, 
  phone,
  role,
  status,
  is_banned,
  ban_reason,
  created_at
FROM profiles
LIMIT 1;

-- Test helper profiles join
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  hp.is_approved,
  hp.service_categories
FROM profiles p
LEFT JOIN helper_profiles hp ON hp.user_id = p.id
WHERE p.role = 'helper'
LIMIT 1;

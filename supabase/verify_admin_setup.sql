-- Verification Script for Admin User Management
-- Run this in Supabase SQL Editor to verify your setup

-- 1. Check if user_status enum has all required values
SELECT 
  enumlabel as status_value
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_status')
ORDER BY enumsortorder;

-- Expected output: active, inactive, suspended, banned

-- 2. Check current profiles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('status', 'is_banned', 'ban_reason', 'banned_at', 'banned_by', 'ban_expires_at')
ORDER BY ordinal_position;

-- 3. Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Test if current user is admin
SELECT 
  id,
  email,
  role,
  status
FROM profiles
WHERE id = auth.uid();

-- 5. Count users by status
SELECT 
  status,
  COUNT(*) as count
FROM profiles
GROUP BY status
ORDER BY status;

-- 6. Show banned users
SELECT 
  id,
  full_name,
  email,
  status,
  is_banned,
  ban_reason,
  banned_at
FROM profiles
WHERE is_banned = true;

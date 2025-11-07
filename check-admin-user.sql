-- Check if admin user exists and has correct role
-- Run this in Supabase SQL Editor

-- 1. List all users with their profiles
SELECT 
  p.id,
  p.email,
  pr.role,
  pr.full_name,
  pr.created_at
FROM auth.users p
LEFT JOIN public.profiles pr ON pr.id = p.id
ORDER BY p.created_at DESC;

-- 2. Check specific admin user
SELECT 
  p.id,
  p.email,
  p.email_confirmed_at,
  pr.role,
  pr.full_name
FROM auth.users p
LEFT JOIN public.profiles pr ON pr.id = p.id
WHERE p.email = 'test.admin@helparo.com';

-- 3. If profile doesn't exist or role is wrong, fix it
-- First, get the user ID from above query, then run:
-- UPDATE public.profiles 
-- SET role = 'admin', full_name = 'Admin User'
-- WHERE id = 'YOUR_USER_ID_HERE';

-- 4. Verify RLS policies aren't blocking
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

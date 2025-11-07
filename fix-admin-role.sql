-- Fix admin user role
-- Run this AFTER creating the user in Supabase Auth UI

-- Step 1: Find your user ID
-- Go to Supabase Dashboard → Authentication → Users
-- Copy the UUID of test.admin@helparo.com

-- Step 2: Replace YOUR_USER_ID_HERE with the actual UUID and run:

-- Update or insert the profile with admin role
INSERT INTO public.profiles (id, email, role, full_name, country_code)
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with actual user ID from auth.users
  'test.admin@helparo.com',
  'admin',
  'Admin User',
  '+91'
)
ON CONFLICT (id) 
DO UPDATE SET
  role = 'admin',
  full_name = 'Admin User',
  email = 'test.admin@helparo.com';

-- Verify it worked
SELECT id, email, role, full_name, created_at
FROM public.profiles
WHERE email = 'test.admin@helparo.com';

-- Expected output: You should see role = 'admin'

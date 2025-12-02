-- ============================================
-- FIX SIGNUP ERROR - user_role enum issue
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Step 1: Check if user_role enum exists (should return 3 rows)
SELECT 
  n.nspname AS schema,
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- Step 2: Drop existing function and trigger
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Ensure the enum type exists in public schema
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('customer', 'helper', 'admin');
  END IF;
END $$;

-- Step 4: Recreate the handle_new_user function with explicit schema references
-- Users can register from anywhere - no address required at signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    full_name, 
    phone, 
    country_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'country_code', '+91')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, pg_temp;

-- Step 5: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated, anon;

-- Step 7: Verify function was created
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 8: Verify trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 9: Test the function manually (optional - comment out if not needed)
-- This simulates what happens during signup
/*
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Simulate a signup with role metadata
  RAISE NOTICE 'Testing user creation with customer role...';
  
  -- This would normally be done by auth.users insert
  -- We're just testing the type casting works
  PERFORM COALESCE('customer'::text, 'customer')::public.user_role;
  
  RAISE NOTICE 'user_role enum type cast successful!';
END $$;
*/

-- ============================================
-- If you see results from Steps 7 & 8, you're good!
-- Now try signing up again - it should work!
-- ============================================

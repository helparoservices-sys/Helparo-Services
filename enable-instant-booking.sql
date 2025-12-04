-- Step 1: Find existing helper user IDs
-- Run this first to see available helpers:
SELECT 
  hp.id as helper_profile_id,
  hp.user_id,
  p.full_name,
  p.email,
  hp.is_approved,
  hp.verification_status
FROM helper_profiles hp
JOIN profiles p ON p.id = hp.user_id
LIMIT 10;

-- Step 2: Enable instant booking for a specific helper
-- ⚠️ IMPORTANT: Replace the UUID below with actual user_id from Step 1 results
-- Example: WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- UPDATE helper_profiles
-- SET 
--   instant_booking_enabled = true,
--   instant_booking_price = 500,
--   instant_booking_duration_minutes = 60,
--   auto_accept_enabled = true,
--   response_time_minutes = 15,
--   max_concurrent_bookings = 3
-- WHERE user_id = 'PASTE-REAL-UUID-HERE';

-- Step 3: Verify the update worked
SELECT 
  user_id,
  instant_booking_enabled,
  instant_booking_price,
  instant_booking_duration_minutes,
  auto_accept_enabled
FROM helper_profiles
WHERE instant_booking_enabled = true;

-- Alternative: Enable for ALL approved helpers (EASIEST - RECOMMENDED FOR TESTING!)
-- This will enable instant booking for all approved helpers at once
-- Uncomment the lines below and run:

UPDATE helper_profiles
SET 
  instant_booking_enabled = true,
  instant_booking_price = 500,
  instant_booking_duration_minutes = 60,
  auto_accept_enabled = true,
  response_time_minutes = 15,
  max_concurrent_bookings = 3
WHERE is_approved = true AND verification_status = 'approved';

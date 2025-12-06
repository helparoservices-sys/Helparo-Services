-- Enable instant booking for the helper account
-- Run this in Supabase SQL Editor

-- First, let's see what helpers we have
SELECT 
  p.email,
  p.full_name,
  hp.id as helper_profile_id,
  hp.instant_booking_enabled,
  hp.is_approved,
  hp.verification_status,
  hp.service_categories
FROM helper_profiles hp
JOIN profiles p ON p.id = hp.user_id
ORDER BY hp.created_at DESC
LIMIT 10;

-- Enable instant booking for ALL approved helpers (for testing)
UPDATE helper_profiles 
SET 
  instant_booking_enabled = true,
  instant_booking_price = 500.00,
  instant_booking_duration_minutes = 60,
  auto_accept_enabled = true,
  response_time_minutes = 5
WHERE 
  is_approved = true 
  AND verification_status = 'approved';

-- Verify the update
SELECT 
  p.email,
  p.full_name,
  hp.instant_booking_enabled,
  hp.instant_booking_price,
  hp.instant_booking_duration_minutes,
  hp.auto_accept_enabled,
  hp.is_approved,
  hp.verification_status,
  array_length(hp.service_categories, 1) as category_count
FROM helper_profiles hp
JOIN profiles p ON p.id = hp.user_id
WHERE hp.instant_booking_enabled = true;


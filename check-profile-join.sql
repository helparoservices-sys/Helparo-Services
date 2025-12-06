-- Check if helper has linked profile

-- 1. Get helper_profile with user_id
SELECT 
  hp.id as helper_profile_id,
  hp.user_id,
  hp.is_approved,
  hp.is_available_now,
  hp.service_categories,
  p.id as profile_id,
  p.full_name,
  p.email,
  p.role
FROM helper_profiles hp
LEFT JOIN profiles p ON p.id = hp.user_id
WHERE hp.id = '5138e75b-3701-46e2-8738-178746a4109a';

-- Test the EXACT query the Instant Booking API uses
SELECT 
  hp.id,
  hp.user_id,
  hp.hourly_rate,
  hp.service_radius,
  hp.instant_booking_enabled,
  hp.instant_booking_price,
  hp.instant_booking_duration_minutes,
  hp.available_time_slots,
  hp.auto_accept_enabled,
  hp.response_time_minutes,
  hp.service_categories,
  hp.skills_specialization as skills,
  hp.experience_years,
  p.id as profile_id,
  p.full_name,
  p.avatar_url,
  p.phone
FROM helper_profiles hp
LEFT JOIN profiles p ON p.id = hp.user_id
WHERE hp.instant_booking_enabled = true
  AND hp.is_approved = true
  AND hp.verification_status = 'approved'
  AND hp.service_categories @> ARRAY['10000000-0000-0000-0000-000000000015']::text[]
ORDER BY hp.auto_accept_enabled DESC, 
         COALESCE(hp.response_time_minutes, 999) ASC,
         COALESCE(hp.instant_booking_price, 0) ASC;

-- Check if the JOIN is returning profiles correctly
SELECT 
  hp.id,
  hp.user_id,
  p.id as profile_id,
  p.full_name,
  p.email,
  p.avatar_url,
  p.phone,
  hp.instant_booking_enabled,
  hp.is_approved,
  hp.verification_status
FROM helper_profiles hp
LEFT JOIN profiles p ON p.id = hp.user_id
WHERE hp.instant_booking_enabled = true;

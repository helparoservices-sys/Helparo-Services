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

-- 2. Test the EXACT query that Find Helper uses
SELECT 
  hp.id,
  hp.user_id,
  hp.service_categories,
  p.id as profile_id,
  p.full_name,
  p.email
FROM helper_profiles hp
INNER JOIN profiles p ON p.id = hp.user_id
WHERE hp.is_approved = true
  AND hp.is_available_now = true
  AND hp.service_categories @> ARRAY['plumbing']::text[];

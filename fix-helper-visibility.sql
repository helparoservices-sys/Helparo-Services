-- Fix helper profile to make it searchable

-- 1. Approve helper
UPDATE helper_profiles
SET is_approved = true,
    is_available_now = true,
    updated_at = NOW()
WHERE id = 'dd66e790-86ae-4ef4-8be6-e6abda09c671';

-- 2. Verify the fix
SELECT 
  id,
  is_approved,
  is_available_now,
  service_categories,
  latitude,
  longitude
FROM helper_profiles
WHERE id = 'dd66e790-86ae-4ef4-8be6-e6abda09c671';

-- 3. Test search query (same as Find Helper uses)
SELECT COUNT(*)
FROM helper_profiles
WHERE is_approved = true
  AND is_available_now = true
  AND service_categories @> ARRAY['plumbing']::text[];

-- If count = 0, check service_categories
SELECT id, service_categories
FROM helper_profiles  
WHERE id = 'dd66e790-86ae-4ef4-8be6-e6abda09c671';

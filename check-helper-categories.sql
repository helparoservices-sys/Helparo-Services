-- Check what categories the helper currently has
SELECT 
  p.email,
  p.full_name,
  hp.instant_booking_enabled,
  hp.instant_booking_price,
  hp.is_approved,
  hp.verification_status,
  hp.service_categories,
  array_length(hp.service_categories, 1) as total_categories
FROM helper_profiles hp
JOIN profiles p ON p.id = hp.user_id
WHERE hp.instant_booking_enabled = true
ORDER BY p.email;

-- Check what the category ID '10000000-0000-0000-0000-000000000015' is
SELECT id, name, slug, parent_id
FROM service_categories
WHERE id = '10000000-0000-0000-0000-000000000015';

-- Check all available categories
SELECT id, name, slug, parent_id
FROM service_categories
WHERE is_active = true
ORDER BY display_order
LIMIT 20;

-- Fix: Add the selected category to helper's service_categories
-- Replace '10000000-0000-0000-0000-000000000015' with the category ID customer selected
UPDATE helper_profiles
SET service_categories = array_append(
  COALESCE(service_categories, ARRAY[]::text[]),
  '10000000-0000-0000-0000-000000000015'
)
WHERE instant_booking_enabled = true
  AND NOT (service_categories @> ARRAY['10000000-0000-0000-0000-000000000015']::text[]);

-- OR: Set ALL categories for testing (this adds all active categories)
UPDATE helper_profiles
SET service_categories = (
  SELECT array_agg(id::text)
  FROM service_categories
  WHERE is_active = true
)
WHERE instant_booking_enabled = true;

-- Verify the update
SELECT 
  p.email,
  p.full_name,
  hp.service_categories,
  array_length(hp.service_categories, 1) as total_categories,
  -- Check if specific category exists
  (hp.service_categories @> ARRAY['10000000-0000-0000-0000-000000000015']::text[]) as has_selected_category
FROM helper_profiles hp
JOIN profiles p ON p.id = hp.user_id
WHERE hp.instant_booking_enabled = true;

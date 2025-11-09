-- Seed data for a helper with PENDING verification status
-- This helper can be used to test the verification queue

-- Step 1: First, you need to create an auth user in Supabase Dashboard
-- Go to Authentication > Users > Add User
-- Email: pending.helper@helparo.com
-- Password: Test@123456
-- After creating, note down the UUID generated for this user

-- Step 2: Replace 'YOUR_AUTH_USER_ID_HERE' with the actual UUID from Step 1
-- Then run the following SQL:

-- Insert into profiles table
INSERT INTO public.profiles (
  id,
  email,
  role,
  full_name,
  phone,
  country_code,
  phone_number,
  is_verified,
  phone_verified,
  status,
  is_banned,
  created_at,
  updated_at
) VALUES (
  'YOUR_AUTH_USER_ID_HERE', -- Replace with actual auth user UUID
  'pending.helper@helparo.com',
  'helper',
  'Pending Helper Test',
  '9876543210',
  '+91',
  '9876543210',
  false,
  true,
  'active',
  false,
  NOW(),
  NOW()
);

-- Insert into helper_profiles table with PENDING verification
INSERT INTO public.helper_profiles (
  user_id,
  service_categories,
  skills,
  experience_years,
  hourly_rate,
  service_radius,
  is_approved,
  verification_status,
  latitude,
  longitude,
  address,
  pincode,
  service_areas,
  emergency_availability,
  is_available_now,
  skills_specialization,
  years_of_experience,
  total_jobs_completed,
  response_rate_percent,
  completion_rate_percent,
  created_at,
  updated_at
) VALUES (
  'YOUR_AUTH_USER_ID_HERE', -- Same UUID as above
  ARRAY['cleaning', 'gardening'], -- Service categories
  ARRAY['Deep Cleaning', 'Lawn Care', 'Plant Maintenance'], -- Skills
  2, -- Experience years
  300, -- Hourly rate in rupees
  15, -- Service radius in km
  false, -- NOT approved yet
  'pending', -- PENDING verification status
  28.6139, -- Latitude (Delhi example)
  77.2090, -- Longitude (Delhi example)
  '123 Test Street, Connaught Place',
  '110001',
  ARRAY['Connaught Place', 'Rajiv Chowk', 'Central Delhi'], -- Service areas
  true, -- Available for emergencies
  true, -- Currently available
  ARRAY['Eco-friendly cleaning', 'Organic gardening'], -- Specializations
  2,
  0, -- No jobs completed yet
  100.0,
  100.0,
  NOW(),
  NOW()
);

-- Insert verification documents (sample documents)
INSERT INTO public.verification_documents (
  helper_id,
  document_type,
  document_number,
  document_url,
  back_side_url,
  selfie_url,
  status,
  created_at,
  updated_at
) VALUES
-- Aadhar Card
(
  'YOUR_AUTH_USER_ID_HERE',
  'aadhar',
  '1234-5678-9012',
  'kyc/YOUR_AUTH_USER_ID_HERE/aadhar_front.jpg', -- Placeholder path
  'kyc/YOUR_AUTH_USER_ID_HERE/aadhar_back.jpg',
  'kyc/YOUR_AUTH_USER_ID_HERE/selfie_with_aadhar.jpg',
  'pending',
  NOW(),
  NOW()
),
-- PAN Card
(
  'YOUR_AUTH_USER_ID_HERE',
  'pan',
  'ABCDE1234F',
  'kyc/YOUR_AUTH_USER_ID_HERE/pan_front.jpg',
  NULL,
  NULL,
  'pending',
  NOW(),
  NOW()
),
-- Police Verification
(
  'YOUR_AUTH_USER_ID_HERE',
  'police_verification',
  'PV-2024-12345',
  'kyc/YOUR_AUTH_USER_ID_HERE/police_verification.pdf',
  NULL,
  NULL,
  'pending',
  NOW(),
  NOW()
);

-- Note: The document URLs are placeholders. In a real scenario, you would:
-- 1. Upload actual documents to Supabase Storage in the 'kyc' bucket
-- 2. Use the real storage paths here

-- Verification: Check if data was inserted correctly
-- SELECT 
--   p.id,
--   p.full_name,
--   p.email,
--   p.role,
--   hp.verification_status,
--   hp.is_approved,
--   hp.service_categories,
--   COUNT(vd.id) as document_count
-- FROM profiles p
-- JOIN helper_profiles hp ON hp.user_id = p.id
-- LEFT JOIN verification_documents vd ON vd.helper_id = p.id
-- WHERE p.email = 'pending.helper@helparo.com'
-- GROUP BY p.id, p.full_name, p.email, p.role, hp.verification_status, hp.is_approved, hp.service_categories;

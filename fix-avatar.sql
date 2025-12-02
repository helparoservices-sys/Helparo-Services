-- Manual fix: Update avatar_url for existing helper
-- The selfie was uploaded to storage but avatar_url was never set in profiles table

-- STEP 1: Make kyc bucket public (required for images to load)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'kyc';

-- STEP 2: Update avatar_url for existing helper
UPDATE profiles 
SET avatar_url = 'https://opnjibjsddwyojrerbll.supabase.co/storage/v1/object/public/kyc/dd66e790-86ae-4ef4-8be6-e6abda09c671/selfie_1764691228446-jhctdedo3do.jpg'
WHERE id = 'dd66e790-86ae-4ef4-8be6-e6abda09c671';

-- STEP 3: Verify the update
SELECT id, full_name, avatar_url FROM profiles WHERE id = 'dd66e790-86ae-4ef4-8be6-e6abda09c671';

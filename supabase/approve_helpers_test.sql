-- =====================================================
-- Quick Helper Approval Script
-- Use this to approve helpers for testing without KYC
-- =====================================================

-- Approve ALL pending helpers (FOR TESTING ONLY)
UPDATE helper_profiles
SET 
  verification_status = 'approved',
  is_approved = true,
  updated_at = now()
WHERE verification_status = 'pending';

-- Check results
SELECT 
  p.email,
  p.full_name,
  hp.verification_status,
  hp.is_approved,
  hp.hourly_rate
FROM helper_profiles hp
JOIN profiles p ON p.id = hp.user_id
ORDER BY hp.created_at DESC;

-- =====================================================
-- To approve a specific helper by email:
-- =====================================================
-- UPDATE helper_profiles
-- SET 
--   verification_status = 'approved',
--   is_approved = true
-- WHERE user_id = (SELECT id FROM profiles WHERE email = 'helper@example.com');

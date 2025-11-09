-- =====================================================
-- TABLE NAME CORRECTIONS - CRITICAL FIXES
-- =====================================================

-- ISSUE SUMMARY:
-- Many admin pages are querying wrong table names
-- This causes "table does not exist" errors

-- =====================================================
-- CORRECT TABLE NAMES IN YOUR DATABASE:
-- =====================================================

-- ✅ CORRECT: service_requests (NOT bookings)
-- ✅ CORRECT: profiles 
-- ✅ CORRECT: helper_profiles
-- ✅ CORRECT: service_categories
-- ✅ CORRECT: promo_codes
-- ✅ CORRECT: referrals
-- ✅ CORRECT: reviews
-- ✅ CORRECT: support_tickets
-- ✅ CORRECT: notifications
-- ✅ CORRECT: legal_documents
-- ✅ CORRECT: notification_templates
-- ✅ CORRECT: subscription_plans
-- ✅ CORRECT: background_check_results (NOT background_checks)
-- ✅ CORRECT: helper_trust_scores (NOT trust_scores)
-- ✅ CORRECT: verification_documents
-- ✅ CORRECT: badge_definitions (NOT badges)
-- ✅ CORRECT: achievements

-- =====================================================
-- FILES THAT NEED FIXING:
-- =====================================================

-- 1. src/app/admin/bookings/[id]/page.tsx
--    WRONG: .from('bookings')
--    FIX:   .from('service_requests')

-- 2. src/app/admin/bookings/page.tsx  
--    WRONG: .from('bookings')
--    FIX:   .from('service_requests')

-- 3. src/app/admin/users/[id]/page.tsx
--    WRONG: .from('bookings')
--    FIX:   .from('service_requests')

-- 4. src/app/admin/services/[id]/page.tsx
--    WRONG: .from('services')
--    FIX:   .from('service_categories')
--    WRONG: .from('bookings')
--    FIX:   .from('service_requests')

-- 5. src/app/admin/providers/[id]/page.tsx
--    WRONG: .from('bookings')
--    FIX:   .from('service_requests')

-- 6. src/app/admin/trust-safety/page.tsx
--    WRONG: .from('background_checks')
--    FIX:   .from('background_check_results')
--    WRONG: .from('trust_scores')
--    FIX:   .from('helper_trust_scores')

-- 7. src/app/admin/gamification/page.tsx
--    WRONG: .from('badges')
--    FIX:   .from('badge_definitions')

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to see all your tables:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- Database Health Check
-- Run this to verify everything is working correctly
-- =====================================================

-- 1. Check all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check RLS enabled on all tables
SELECT 
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Check all functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. Check platform wallet
SELECT 
  'Platform Wallet' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM wallet_accounts 
      WHERE user_id = '00000000-0000-0000-0000-000000000000'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 5. Check commission settings
SELECT 
  percent as commission_percent,
  effective_from,
  CASE WHEN percent = 12.00 THEN '✅ Correct' ELSE '⚠️ Modified' END as status
FROM commission_settings
ORDER BY effective_from DESC
LIMIT 1;

-- 6. Check service categories seeded
SELECT 
  COUNT(*) as category_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Seeded' ELSE '❌ EMPTY' END as status
FROM service_categories;

-- 7. Check legal documents seeded
SELECT 
  type,
  version,
  is_active,
  title
FROM legal_documents
ORDER BY type, version;

-- 8. Count users by role
SELECT 
  role,
  COUNT(*) as user_count
FROM profiles
GROUP BY role
ORDER BY role;

-- 9. Count helpers by verification status
SELECT 
  verification_status,
  COUNT(*) as count
FROM helper_profiles
GROUP BY verification_status;

-- 10. Check ledger consistency (should return 0 rows)
SELECT 
  transaction_id,
  SUM(delta) as total,
  CASE 
    WHEN SUM(delta) = 0 THEN '✅ Balanced'
    ELSE '❌ UNBALANCED'
  END as status
FROM ledger_entries
GROUP BY transaction_id
HAVING SUM(delta) != 0;

-- 11. Check escrow status distribution
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM escrows
GROUP BY status
ORDER BY status;

-- 12. Platform statistics
SELECT 
  'Total Users' as metric,
  COUNT(*)::text as value
FROM profiles
UNION ALL
SELECT 
  'Active Helpers',
  COUNT(*)::text
FROM helper_profiles
WHERE is_approved = true AND verification_status = 'approved'
UNION ALL
SELECT 
  'Service Requests',
  COUNT(*)::text
FROM service_requests
UNION ALL
SELECT 
  'Total Escrows Funded',
  COUNT(*)::text
FROM escrows
WHERE status = 'funded'
UNION ALL
SELECT 
  'Total Escrows Released',
  COUNT(*)::text
FROM escrows
WHERE status = 'released'
UNION ALL
SELECT 
  'Platform Revenue (INR)',
  COALESCE(available_balance::text, '0')
FROM wallet_accounts
WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 
  'Total Messages',
  COUNT(*)::text
FROM messages
UNION ALL
SELECT 
  'Total Reviews',
  COUNT(*)::text
FROM reviews;

-- =====================================================
-- Summary
-- =====================================================
SELECT 
  '✅ Database Health Check Complete' as status,
  now() as checked_at;

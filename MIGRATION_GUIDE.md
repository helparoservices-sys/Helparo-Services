# 🚀 Supabase Migration Guide - Apply Migrations 001-010

## Step 1: Access Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your Helparo project
3. Navigate to **SQL Editor** (left sidebar)

---

## Step 2: Apply Migrations in Order

### Migration 001: Initial Schema ✅ (Already Applied)
This creates profiles, helper_profiles, and basic auth setup.

**Status**: Should already be in your database from initial setup.

---

### Migration 002: Legal Documents

**File**: `supabase/migrations/002_legal_docs.sql`

**What it does**:
- Creates `legal_documents` table (Terms & Privacy)
- Creates `legal_acceptances` table (tracking user consent)
- Seeds initial Terms v1 and Privacy v1
- Adds RLS policies

**To Apply**:
1. Click **"+ New Query"** in SQL Editor
2. Copy entire contents of `002_legal_docs.sql`
3. Paste into SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Verify success ✅

---

### Migration 003: Fix Admin RLS Recursion

**File**: `supabase/migrations/003_fix_admin_rls_recursion.sql`

**What it does**:
- Creates `is_admin(uid)` SECURITY DEFINER function
- Updates admin policies to prevent infinite recursion
- Fixes profiles, helper_profiles, legal tables

**To Apply**:
1. New query in SQL Editor
2. Copy contents of `003_fix_admin_rls_recursion.sql`
3. Paste and Run
4. Verify success ✅

---

### Migration 004: Services Module

**File**: `supabase/migrations/004_services.sql`

**What it does**:
- Creates `service_categories` (tree structure)
- Creates `helper_services` (rates)
- Creates `service_requests` (customer requests)
- Seeds initial categories (Home, Tech, Business, etc.)
- Adds RLS policies

**To Apply**:
1. New query in SQL Editor
2. Copy contents of `004_services.sql`
3. Paste and Run
4. Verify success ✅

---

### Migration 005: Verification System

**File**: `supabase/migrations/005_verification.sql`

**What it does**:
- Creates `verification_documents` (KYC uploads)
- Creates `verification_reviews` (admin review)
- Creates storage bucket `kyc_documents` with RLS
- Restricts helper access to verified/approved only

**To Apply**:
1. New query in SQL Editor
2. Copy contents of `005_verification.sql`
3. Paste and Run
4. Verify success ✅

---

### Migration 006: Applications Module

**File**: `supabase/migrations/006_applications.sql`

**What it does**:
- Creates `request_applications` table
- Adds `application_count` to service_requests
- Adds `assigned_helper_id` and `assigned_at` fields
- Trigger to update application counts
- RLS policies

**To Apply**:
1. New query in SQL Editor
2. Copy contents of `006_applications.sql`
3. Paste and Run
4. Verify success ✅

---

### Migration 007: Assignment Functions

**File**: `supabase/migrations/007_assignment_functions.sql`

**What it does**:
- Creates RPC `accept_application(p_request_id, p_application_id)`
- Atomic assignment logic
- Updates request status to 'assigned'
- Rejects other applications
- Ownership validation

**To Apply**:
1. New query in SQL Editor
2. Copy contents of `007_assignment_functions.sql`
3. Paste and Run
4. Verify success ✅

---

### Migration 008: Messaging System

**File**: `supabase/migrations/008_messages.sql`

**What it does**:
- Creates `messages` table
- RLS for customer and assigned helper only
- Enables Realtime for chat

**To Apply**:
1. New query in SQL Editor
2. Copy contents of `008_messages.sql`
3. Paste and Run
4. Verify success ✅

---

### Migration 009: Reviews System

**File**: `supabase/migrations/009_reviews.sql`

**What it does**:
- Creates `reviews` table
- Adds `rating_sum` and `rating_count` to helper_profiles
- Trigger to update helper ratings on review insert
- RLS policies

**To Apply**:
1. New query in SQL Editor
2. Copy contents of `009_reviews.sql`
3. Paste and Run
4. Verify success ✅

---

### Migration 010: Payment System 💰

**File**: `supabase/migrations/010_payments.sql`

**What it does**:
- Creates `wallet_accounts` (available + escrow balances)
- Creates `escrows` table (Cashfree integration)
- Creates `payment_transactions` (audit log)
- Creates `ledger_entries` (double-entry bookkeeping)
- Creates `commission_settings` (12% default)
- Seeds platform wallet
- RPC functions: `fund_escrow`, `release_escrow`, `refund_escrow`
- Triggers for balance updates
- RLS policies

**To Apply**:
1. New query in SQL Editor
2. Copy contents of `010_payments.sql`
3. Paste and Run
4. Verify success ✅

---

## Step 3: Verify Migration Success

After applying all migrations, run this verification query:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected tables**:
- commission_settings
- escrows
- helper_profiles
- helper_services
- ledger_entries
- legal_acceptances
- legal_documents
- messages
- payment_transactions
- profiles
- request_applications
- reviews
- service_categories
- service_requests
- verification_documents
- verification_reviews
- wallet_accounts

---

## Step 4: Check RLS Policies

```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;
```

All tables should show `rowsecurity = true`.

---

## Step 5: Test Platform Wallet

```sql
-- Verify platform wallet exists
SELECT * FROM wallet_accounts 
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

Should return one row with INR currency and 0 balances.

---

## Step 6: Check Functions

```sql
-- List all custom functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected functions**:
- accept_application
- fund_escrow
- get_commission_percent
- handle_new_user
- is_admin
- refund_escrow
- release_escrow
- update_helper_rating
- update_wallet_balance

---

## Troubleshooting

### Error: "relation already exists"
- Migration was partially applied
- Check which tables exist: `\dt` in psql or SQL Editor
- Skip the duplicate parts or drop and reapply

### Error: "function already exists"
- Use `CREATE OR REPLACE FUNCTION` instead
- Or drop existing: `DROP FUNCTION function_name CASCADE;`

### Error: "permission denied"
- Ensure you're running as postgres/service_role
- Check your connection in Supabase dashboard

### Error: "infinite recursion detected"
- Migration 003 should fix this
- Ensure `is_admin()` function exists before RLS policies

---

## Next Steps After Migration

1. ✅ **Test Authentication**
   - Sign up new user
   - Verify email
   - Login

2. ✅ **Test Legal Flow**
   - Login → should redirect to /legal/consent
   - Accept terms → redirected to dashboard

3. ✅ **Test Services**
   - Browse /services
   - Helper: add service rates
   - Customer: create request

4. ✅ **Test Payment Flow**
   - Customer: fund escrow at /customer/wallet
   - Complete request
   - Verify helper balance increased
   - Check /admin/payments for commission

---

## Migration Status Tracker

Copy this checklist:

```
[ ] 001_initial_schema.sql - Already applied ✅
[ ] 002_legal_docs.sql
[ ] 003_fix_admin_rls_recursion.sql
[ ] 004_services.sql
[ ] 005_verification.sql
[ ] 006_applications.sql
[ ] 007_assignment_functions.sql
[ ] 008_messages.sql
[ ] 009_reviews.sql
[ ] 010_payments.sql
```

---

**Total Time**: ~10-15 minutes for all migrations  
**Order**: Must be applied in sequence (001 → 010)  
**Rollback**: Can drop tables/functions if needed

Good luck! 🚀

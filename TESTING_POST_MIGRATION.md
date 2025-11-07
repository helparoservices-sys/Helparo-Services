# 🧪 Helparo Testing Guide - Post Migration

After applying migrations 001-010, follow this testing sequence to verify everything works.

---

## ✅ Phase 1: Database Verification (SQL)

Run these queries in Supabase SQL Editor:

### 1.1 Check All Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected**: 17 tables including wallet_accounts, escrows, payment_transactions, ledger_entries

---

### 1.2 Verify RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected**: All tables show `rowsecurity = true`

---

### 1.3 Check Platform Wallet
```sql
SELECT * FROM wallet_accounts 
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

**Expected**: 1 row with currency='INR', available_balance=0, escrow_balance=0

---

### 1.4 Check Commission Settings
```sql
SELECT * FROM commission_settings ORDER BY effective_from DESC LIMIT 1;
```

**Expected**: percent = 12.00

---

### 1.5 Verify Functions Exist
```sql
SELECT routine_name 
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected functions**:
- accept_application
- fund_escrow
- get_commission_percent
- is_admin
- refund_escrow
- release_escrow

---

## ✅ Phase 2: Authentication Testing

### 2.1 Sign Up (Customer)
1. Go to http://localhost:3000
2. Click "Get Started" → "Sign Up"
3. Fill form:
   - Email: `test.customer@example.com`
   - Password: `Test@123456`
   - Role: Customer
   - Full name: Test Customer
4. Submit
5. Check email for verification link
6. Click verification link

**Expected**: Redirected to login

---

### 2.2 Login & Legal Consent
1. Login with test.customer@example.com
2. Should redirect to `/legal/consent`
3. Click "I Accept" for both Terms and Privacy
4. Should redirect to `/customer/dashboard`

**Expected**: Dashboard loads without errors

---

### 2.3 Sign Up (Helper)
1. Logout
2. Sign up new account:
   - Email: `test.helper@example.com`
   - Password: `Test@123456`
   - Role: Helper
   - Full name: Test Helper
3. Verify email
4. Login
5. Accept legal terms

**Expected**: Redirected to `/helper/dashboard`

---

### 2.4 Create Admin User (SQL)
```sql
-- Update existing user to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL@example.com';
```

Then login and verify access to `/admin/payments`

---

## ✅ Phase 3: Services Flow

### 3.1 Browse Services
1. Login as customer
2. Go to `/services`
3. Should see categories: Home Services, Tech Support, Business, etc.

**Expected**: Categories render without errors

---

### 3.2 Helper: Add Service Rates
1. Login as helper
2. Go to `/helper/services`
3. Select a category (e.g., "Home Cleaning")
4. Enter hourly rate: 500
5. Enter experience: 2 years
6. Click "Add Service"

**Expected**: Service added, shows in list

---

### 3.3 Customer: Create Request
1. Login as customer
2. Go to `/customer/requests/new`
3. Fill form:
   - Title: "Need home cleaning"
   - Description: "2BHK apartment"
   - Category: Home Services → Home Cleaning
   - Budget: 2000-3000
   - City: Mumbai
4. Submit

**Expected**: Request created, redirected to requests list

---

## ✅ Phase 4: Payment System Testing 💰

### 4.1 Customer: Fund Escrow

1. Login as customer
2. Go to `/customer/wallet`
3. Find your request in "Fund Your Requests" section
4. Click "Fund Escrow"
5. Enter amount: 2500
6. Click "Confirm"

**Expected**: 
- Success message
- Escrow balance shows ₹2,500
- Request shows "✓ Funded"

---

### 4.2 Verify Escrow in Database
```sql
SELECT * FROM escrows ORDER BY created_at DESC LIMIT 1;
```

**Expected**: 
- status = 'funded'
- amount = 2500
- cashfree_order_id present

---

### 4.3 Verify Ledger Entry
```sql
SELECT 
  le.*,
  pt.type as transaction_type
FROM ledger_entries le
JOIN payment_transactions pt ON pt.id = le.transaction_id
ORDER BY le.created_at DESC 
LIMIT 5;
```

**Expected**:
- One entry with balance_type='escrow', delta=2500
- Linked to transaction type='fund_escrow'

---

### 4.4 Helper: Apply to Request

1. Login as helper (must be verified - skip verification for testing)
2. Go to `/helper/requests`
3. Find the funded request
4. Click "Apply"
5. Optional: add cover note
6. Submit

**Expected**: Application submitted, status shows "Applied"

---

### 4.5 Customer: Assign Helper

1. Login as customer
2. Go to `/customer/requests`
3. Click your funded request
4. See applications list
5. Click "Assign" on helper's application

**Expected**:
- Request status changes to "assigned"
- Helper assigned

---

### 4.6 Complete Request & Release Payment

1. Still logged in as customer
2. On request detail page, click "Mark Completed"

**Expected**:
- Request status → "completed"
- **Auto-release triggered**
- Success message (or error if release failed)

---

### 4.7 Verify Payment Release
```sql
-- Check escrow status
SELECT * FROM escrows WHERE status = 'released' ORDER BY released_at DESC LIMIT 1;

-- Check ledger entries for release
SELECT 
  le.account_user_id,
  le.balance_type,
  le.delta,
  le.balance_after,
  p.email
FROM ledger_entries le
JOIN profiles p ON p.id = le.account_user_id
WHERE le.transaction_id = (
  SELECT id FROM payment_transactions 
  WHERE type = 'release_helper' 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

**Expected**:
- Escrow status = 'released'
- 3 ledger entries:
  1. Customer escrow: delta = -2500
  2. Helper available: delta = +2200 (88%)
  3. Platform available: delta = +300 (12%)

---

### 4.8 Helper: Check Wallet Balance

1. Login as helper
2. Go to `/helper/wallet`

**Expected**:
- Available balance: ₹2,200
- Transaction history shows "Payment Received"

---

### 4.9 Admin: Check Platform Revenue

1. Login as admin
2. Go to `/admin/payments`

**Expected**:
- Platform Earnings: ₹300
- Completed Jobs: 1
- Commission Rate: 12%

---

## ✅ Phase 5: Review System

### 5.1 Customer Reviews Helper

1. Login as customer
2. Go to request detail page
3. Click "Leave a Review"
4. Rate: 5 stars
5. Comment: "Excellent work!"
6. Submit

**Expected**: Review submitted

---

### 5.2 Helper Reviews Customer

1. Login as helper
2. Go to `/helper/requests/[id]/review`
3. Rate: 5 stars
4. Comment: "Great customer!"
5. Submit

**Expected**: Review submitted

---

### 5.3 Verify Helper Rating Updated
```sql
SELECT 
  p.email,
  hp.rating_sum,
  hp.rating_count,
  ROUND(hp.rating_sum::numeric / NULLIF(hp.rating_count, 0), 2) as avg_rating
FROM helper_profiles hp
JOIN profiles p ON p.id = hp.user_id
WHERE rating_count > 0;
```

**Expected**: Helper shows rating_count=1, rating_sum=5, avg=5.00

---

## ✅ Phase 6: Messaging System

### 6.1 Send Messages

1. Login as customer
2. Go to request detail → "Chat"
3. Send message: "Hello, when can you start?"
4. Login as helper (different browser/incognito)
5. Go to assigned job → "Chat"
6. See customer's message
7. Reply: "I can start tomorrow!"

**Expected**: Real-time message exchange works

---

## ✅ Phase 7: Security Testing (RLS)

### 7.1 Test Wallet Privacy
```sql
-- Try to see other user's wallet (should return nothing if not admin)
SET request.jwt.claim.sub = 'CUSTOMER_USER_ID';
SELECT * FROM wallet_accounts WHERE user_id = 'HELPER_USER_ID';
```

**Expected**: No rows returned (RLS blocks access)

---

### 7.2 Test Transaction Privacy
```sql
-- Try to see platform wallet (should fail unless admin)
SET request.jwt.claim.sub = 'CUSTOMER_USER_ID';
SELECT * FROM wallet_accounts WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

**Expected**: No rows returned

---

### 7.3 Test Escrow Manipulation
```sql
-- Try direct insert (should fail)
INSERT INTO escrows (request_id, customer_id, amount, currency, status)
VALUES ('some-uuid', 'some-uuid', 1000, 'INR', 'funded');
```

**Expected**: Permission denied (must use fund_escrow function)

---

## ✅ Phase 8: Edge Cases

### 8.1 Double Fund Prevention
1. Try to fund the same request twice

**Expected**: Error "Escrow already exists for this request"

---

### 8.2 Release Before Completion
```sql
SELECT release_escrow('REQUEST_ID_THAT_IS_NOT_COMPLETED');
```

**Expected**: Error "Request must be completed before releasing escrow"

---

### 8.3 Refund Escrow
```sql
-- Cancel a funded request
UPDATE service_requests SET status = 'cancelled' WHERE id = 'FUNDED_REQUEST_ID';

-- Refund it
SELECT refund_escrow('FUNDED_REQUEST_ID');
```

**Expected**: Escrow refunded, customer's available balance increased

---

## 📊 Success Criteria

✅ All migrations applied without errors  
✅ All tables created with RLS enabled  
✅ Platform wallet seeded  
✅ Auth flow works (signup → verify → login → legal consent)  
✅ Services module functional  
✅ Customer can fund escrow  
✅ Ledger entries created correctly  
✅ Helper can apply to requests  
✅ Customer can assign helper  
✅ Request completion triggers auto-release  
✅ Commission calculated correctly (12%)  
✅ Helper receives payout (88%)  
✅ Platform wallet updated  
✅ Reviews work and update aggregates  
✅ Real-time messaging works  
✅ RLS prevents unauthorized access  
✅ Double-entry ledger balances to zero  

---

## 🐛 Common Issues

### Issue: "relation does not exist"
**Fix**: Apply migrations in correct order (001 → 010)

### Issue: "infinite recursion detected"
**Fix**: Ensure migration 003 is applied (creates is_admin function)

### Issue: "permission denied for table wallet_accounts"
**Fix**: Check RLS policies, ensure user authenticated

### Issue: Escrow not releasing
**Fix**: 
1. Check request status is 'completed'
2. Verify helper assigned
3. Check escrow status is 'funded'
4. Look at server logs for error details

### Issue: Balance mismatch
**Fix**: Run ledger consistency check:
```sql
SELECT transaction_id, SUM(delta) as total
FROM ledger_entries
GROUP BY transaction_id
HAVING SUM(delta) != 0;
```
Should return 0 rows (all transactions balance).

---

**Testing Time**: ~30-45 minutes for complete flow  
**Tools Needed**: Supabase dashboard, browser, two test accounts  

Good luck testing! 🚀

# 🚀 Quick Setup & Testing Guide

## ✅ Step 1: Migrations Applied ✓

Great! All migrations (001-010) are now applied in Supabase.

---

## 🧪 Step 2: Create Test Users

### Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select your Helparo project
3. Go to **Authentication** → **Users**
4. Click **"Add user"** → **"Create new user"**

### Create These 3 Users:

**User 1: Customer**
- Email: `test.customer@helparo.com`
- Password: `Test@123456`
- Auto Confirm Email: ✅ (check this box)

**User 2: Helper**
- Email: `test.helper@helparo.com`
- Password: `Test@123456`
- Auto Confirm Email: ✅

**User 3: Admin**
- Email: `test.admin@helparo.com`
- Password: `Test@123456`
- Auto Confirm Email: ✅

---

## 🔧 Step 3: Setup Test Data

### 3.1 Update User Roles (SQL)

Go to Supabase **SQL Editor** and run:

```sql
-- Update customer role
UPDATE profiles 
SET role = 'customer', full_name = 'Test Customer'
WHERE email = 'test.customer@helparo.com';

-- Update helper role  
UPDATE profiles 
SET role = 'helper', full_name = 'Test Helper'
WHERE email = 'test.helper@helparo.com';

-- Update admin role
UPDATE profiles 
SET role = 'admin', full_name = 'Admin User'
WHERE email = 'test.admin@helparo.com';

-- Create helper profile (approved for testing)
INSERT INTO helper_profiles (user_id, is_approved, verification_status, hourly_rate)
SELECT id, true, 'approved', 500
FROM profiles 
WHERE email = 'test.helper@helparo.com'
ON CONFLICT (user_id) DO UPDATE
SET is_approved = true, verification_status = 'approved';

-- Accept legal terms for all test users
INSERT INTO legal_acceptances (user_id, document_type, document_version)
SELECT p.id, 'terms', 1
FROM profiles p
WHERE p.email LIKE '%@helparo.com'
UNION ALL
SELECT p.id, 'privacy', 1
FROM profiles p
WHERE p.email LIKE '%@helparo.com'
ON CONFLICT DO NOTHING;
```

---

## 🎯 Step 4: Test Payment Flow (15 minutes)

### 4.1 Login as Customer

1. Open http://localhost:3000
2. Click "Login"
3. Email: `test.customer@helparo.com`
4. Password: `Test@123456`
5. Should redirect to `/customer/dashboard`

### 4.2 Create Service Request

1. From dashboard, click "Create Request"
2. Fill form:
   - Title: "Need home cleaning"
   - Description: "2BHK apartment deep cleaning"
   - Category: Home Services → Home Cleaning
   - Budget: ₹2000 - ₹3000
   - City: Mumbai
3. Click "Create Request"

### 4.3 Fund Escrow

1. Go to "My Wallet" from dashboard
2. Find your request in "Fund Your Requests"
3. Click "Fund Escrow"
4. Enter amount: **2500**
5. Click "Confirm"
6. ✅ Should see success message
7. ✅ Escrow balance should show ₹2,500

### 4.4 Login as Helper

1. Logout (top right)
2. Login with:
   - Email: `test.helper@helparo.com`
   - Password: `Test@123456`
3. Should redirect to `/helper/dashboard`

### 4.5 Helper: Add Service Rate

1. Click "My Services"
2. Select category: Home Cleaning
3. Enter hourly rate: **400**
4. Enter experience: **2** years
5. Click "Add Service"

### 4.6 Helper: Apply to Request

1. Click "Open Requests" from dashboard
2. Should see the funded request
3. Click "Apply"
4. (Optional) Add cover note
5. Click "Submit Application"

### 4.7 Login as Customer (Assign Helper)

1. Logout
2. Login as customer again
3. Go to "My Requests"
4. Click your request
5. See helper's application
6. Click "Assign" button
7. ✅ Request status → "assigned"

### 4.8 Complete Request (Auto-Release Payment)

1. Still on request detail page
2. Click "Mark Completed" button
3. ✅ Should see success message
4. ✅ Request status → "completed"

### 4.9 Verify Helper Got Paid

1. Logout
2. Login as helper
3. Go to "My Wallet"
4. ✅ Available balance: **₹2,200** (88% of ₹2,500)
5. ✅ Transaction history shows "Payment Received"

### 4.10 Verify Platform Commission

1. Logout
2. Login as admin (`test.admin@helparo.com`)
3. Go to dashboard → "Payments"
4. ✅ Platform Earnings: **₹300** (12% of ₹2,500)
5. ✅ Completed Jobs: **1**

---

## ✅ Success Criteria

If you see these, everything works:

- ✅ Customer can fund escrow
- ✅ Escrow shows ₹2,500 in customer wallet
- ✅ Helper can apply to funded requests
- ✅ Customer can assign helper
- ✅ Completion triggers auto-release
- ✅ Helper receives ₹2,200 (88%)
- ✅ Platform earns ₹300 (12%)
- ✅ Admin dashboard shows revenue

---

## 🔍 Verify in Database (Optional)

Run in Supabase SQL Editor:

```sql
-- Check escrow was released
SELECT * FROM escrows 
WHERE status = 'released' 
ORDER BY released_at DESC 
LIMIT 1;

-- Check ledger entries (should show 3 entries)
SELECT 
  le.balance_type,
  le.delta,
  p.email,
  p.role
FROM ledger_entries le
JOIN payment_transactions pt ON pt.id = le.transaction_id
JOIN profiles p ON p.id = le.account_user_id
WHERE pt.type = 'release_helper'
ORDER BY le.created_at DESC
LIMIT 3;

-- Check platform wallet
SELECT * FROM wallet_accounts 
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

---

## 🎨 Test Other Features

### Reviews
1. Customer: Go to completed request → "Leave a Review"
2. Rate 5 stars, add comment
3. Helper: Go to assigned job → Review
4. Both can review each other

### Messaging
1. Customer: Go to request → "Chat"
2. Send message
3. Helper: Go to assigned job → "Chat"
4. Real-time chat should work

---

## 🐛 Troubleshooting

### Error: "Escrow already exists"
- Each request can only be funded once
- Create a new request to test again

### Error: "Helper not verified"
- Run the approval script: `supabase/approve_helpers_test.sql`
- Or manually update in profiles table

### Balance not updating
- Check browser console for errors
- Refresh the page
- Verify migration 010 was applied

### Can't see open requests as helper
- Ensure helper is approved
- Check verification status in helper_profiles table

---

## 📊 Health Check

Run this to verify everything is healthy:

```sql
-- In Supabase SQL Editor
\i supabase/health_check.sql
```

Or copy/paste contents of `health_check.sql`

---

## 🎯 Next Steps After Testing

1. ✅ Test Reviews system
2. ✅ Test Messaging (real-time chat)
3. ✅ Try refunding an escrow (cancel request before completion)
4. ✅ Test with multiple requests
5. ✅ Verify RLS security (try accessing other user's wallet)

Then move to production features:
- Cashfree SDK integration
- Withdrawal system
- Mobile app

---

## 💡 Tips

- **Quick Approval**: Use `supabase/approve_helpers_test.sql` to approve all helpers
- **Reset Test**: Delete test data and recreate users if needed
- **Check Logs**: Use browser DevTools console for errors
- **Database Queries**: Use `health_check.sql` for diagnostics

---

**Total Testing Time**: ~15-20 minutes  
**Status**: Ready to test! 🚀  
**Currency**: INR (₹)  
**Commission**: 12%

---

Enjoy testing your marketplace! 🎉

# 📚 Complete Booking Flow Documentation

## 🎯 Overview
Your Helparo Services platform supports **TWO different ways** customers can get help:
1. **Direct Booking** (Find Helper → Book Immediately)
2. **Post & Bid** (Create Request → Helpers Bid → Accept Best Bid)

---

## 🔄 WORKFLOW 1: Direct Booking (Instant Assignment)

### Customer Journey:
```
1. Go to "Find Helpers" page (/customer/find-helpers)
2. Search by service category + location
3. Browse helper profiles with match scores
4. Click "Book Now" on chosen helper
   ↓
5. System creates service_request
6. System immediately assigns: assigned_helper_id = chosen_helper
7. Status: draft → assigned (skips 'open' entirely)
   ↓
8. Request appears in "My Requests" with status 'assigned'
9. Helper sees it in "My Jobs" immediately
```

### When to Use:
- Customer knows exactly what they want
- Customer sees a highly-rated helper they trust
- Urgent service needed (no time to wait for bids)

---

## 🔄 WORKFLOW 2: Post & Bid (Marketplace Bidding)

### Customer Journey:
```
1. Go to "My Requests" → Click "New Request"
2. Fill form: title, description, category, budget range
3. Submit → Status: draft
4. Publish → Status: open
   ↓
5. Request appears in helpers' "Browse Requests" page
6. Multiple helpers submit bids with pricing
7. Customer views all bids in /customer/requests/[id]
   ↓
8. Customer clicks "Accept" on best bid
9. System calls accept_application(requestId, applicationId)
10. Status: open → assigned
11. Chosen helper assigned, others rejected
    ↓
12. Helper sees job in "My Jobs"
13. Customer tracks in "My Requests" (filtered by status)
```

### When to Use:
- Customer wants competitive pricing
- Complex job requiring proposals
- Customer wants to compare multiple helpers
- Budget-conscious customers

---

## 📊 Database Schema

### service_requests (Central Table)
```sql
id                    UUID PRIMARY KEY
customer_id           UUID (who needs the service)
assigned_helper_id    UUID (NULL until helper assigned)
category_id           UUID (plumbing, electrical, etc.)
title                 TEXT
description           TEXT
status                ENUM(draft, open, assigned, in_progress, completed, cancelled)
budget_min            DECIMAL
budget_max            DECIMAL
assigned_at           TIMESTAMPTZ (when helper was assigned)
job_completed_at      TIMESTAMPTZ (when work finished)
created_at            TIMESTAMPTZ
```

**Status Flow:**
- `draft` → Request created but not published
- `open` → Published, visible to helpers, accepting bids
- `assigned` → Helper assigned (either directly or via accepted bid)
- `in_progress` → Work has started
- `completed` → Work finished, payment released
- `cancelled` → Request cancelled by customer/admin

### request_applications (Bids/Applications)
```sql
id                        UUID PRIMARY KEY
request_id                UUID (which request)
helper_id                 UUID (which helper applied)
status                    ENUM(applied, accepted, rejected, withdrawn)
bid_amount                DECIMAL (helper's proposed price)
bid_breakdown             JSONB (labor, materials, travel costs)
estimated_duration_hours  INTEGER
availability_note         TEXT
cover_note                TEXT (helper's pitch)
created_at                TIMESTAMPTZ
```

**Application Status:**
- `applied` → Helper submitted bid, waiting
- `accepted` → Customer chose this bid (only ONE per request)
- `rejected` → Customer chose different bid
- `withdrawn` → Helper withdrew their bid

---

## 🗂️ Page Structure & Purpose

### 👤 Customer Pages

#### 1. Find Helpers (`/customer/find-helpers`)
**Purpose:** Browse helper marketplace and book instantly

**Features:**
- Search by service category
- Filter by location distance, rating
- Smart matching algorithm (distance, experience, availability)
- Click "Book Now" → Direct assignment (no bidding)

**Data Source:** `helper_profiles` table

---

#### 2. My Requests (`/customer/requests`)
**Purpose:** ALL-IN-ONE request management hub

**Shows:**
- ALL service requests (draft, open, assigned, in_progress, completed, cancelled)
- Filter by status tabs
- Search functionality

**Features:**
- Create new requests
- View incoming bids
- Accept/reject bids
- Track active jobs
- Mark jobs complete
- Rate helpers
- View chat with helper

**Data Source:** `service_requests WHERE customer_id = current_user`

**Status Breakdown:**
- **Draft** (🔘): Not yet published
- **Open** (🔵): Accepting bids from helpers
- **Assigned** (🟡): Helper assigned, work not started
- **In Progress** (🟣): Helper actively working
- **Completed** (🟢): Job finished
- **Cancelled** (🔴): Cancelled

---

#### 3. ~~My Bookings~~ (REMOVED - Redundant!)
**Why Removed:** 
- Showed exact same data as "My Requests" with status filter
- Caused confusion about difference
- "My Requests" with status tabs does everything

---

### 🔧 Helper Pages

#### 1. Browse Requests (`/helper/requests`)
**Purpose:** Find new job opportunities (bidding workflow)

**Shows:**
- Only requests with status = `open`
- NOT assigned yet
- Accepting bids

**Features:**
- Search/filter by service category
- See customer location, budget range
- Submit bids with custom pricing
- Withdraw bids

**Data Source:** 
```sql
service_requests 
WHERE status = 'open' 
AND category_id IN (helper's service_categories)
AND distance < 50km (calculated)
```

---

#### 2. My Jobs (`/helper/bookings`)
**Purpose:** Manage assigned work

**Shows:**
- Requests where `assigned_helper_id = current_helper`
- All statuses: assigned, in_progress, completed

**Features:**
- View customer details
- Start/stop time tracking
- Update job status
- Chat with customer
- Mark job complete
- View payment details

**Data Source:**
```sql
service_requests 
WHERE assigned_helper_id = current_helper_id
```

**Important:** Renamed from "My Bookings" to "My Jobs" for clarity

---

#### 3. ~~My Jobs (at /helper/assigned)~~ (REMOVED - Duplicate!)
**Why Removed:**
- Exact duplicate of "My Bookings" page
- Both queried `assigned_helper_id = current_user`
- Caused confusion
- Consolidated into single "My Jobs" page at `/helper/bookings`

---

## ⚙️ Assignment Logic

### Method 1: Direct Assignment (Find Helper flow)
```typescript
// From "Find Helper" → "Book Now" button
async function bookHelper(helperId: string, serviceCategory: string) {
  // 1. Create service request
  const { data: request } = await supabase
    .from('service_requests')
    .insert({
      customer_id: currentUser.id,
      category_id: serviceCategory,
      title: '...',
      description: '...',
      status: 'draft'
    })
    .select()
    .single()

  // 2. Immediately assign helper
  await supabase
    .from('service_requests')
    .update({
      assigned_helper_id: helperId,
      assigned_at: new Date(),
      status: 'assigned' // Skip 'open' status
    })
    .eq('id', request.id)
}
```

**Result:** Request goes straight from `draft` → `assigned`, skipping bidding entirely

---

### Method 2: Accept Bid (Bidding flow)
```typescript
// From "My Requests" → View Request → Accept Bid
async function acceptBid(requestId: string, applicationId: string) {
  // Calls database function
  await supabase.rpc('accept_application', {
    p_request_id: requestId,
    p_application_id: applicationId
  })
}
```

**Database Function** (`accept_application`):
```sql
-- 1. Get helper from application
SELECT helper_id INTO v_helper_id 
FROM request_applications 
WHERE id = p_application_id;

-- 2. Assign helper to request
UPDATE service_requests
SET assigned_helper_id = v_helper_id,
    assigned_at = NOW(),
    status = 'assigned'
WHERE id = p_request_id;

-- 3. Mark this application as accepted
UPDATE request_applications
SET status = 'accepted'
WHERE id = p_application_id;

-- 4. Reject all other applications
UPDATE request_applications
SET status = 'rejected'
WHERE request_id = p_request_id 
AND id != p_application_id 
AND status = 'applied';
```

**Result:** 
- Request: `open` → `assigned`
- Chosen application: `applied` → `accepted`
- Other applications: `applied` → `rejected`

---

### Method 3: Admin Assignment (Optional - Future Feature)
```typescript
// Admin manually assigns any helper to any request
async function adminAssignHelper(requestId: string, helperId: string) {
  await supabase
    .from('service_requests')
    .update({
      assigned_helper_id: helperId,
      assigned_at: new Date(),
      status: 'assigned'
    })
    .eq('id', requestId)
}
```

**When Used:**
- Admin resolves disputes
- Emergency override
- Helper reassignment if first helper cancels

---

## 🔍 Key Differences: Find Helper vs My Requests

| Feature | Find Helper | My Requests |
|---------|-------------|-------------|
| **Purpose** | Browse & book helpers instantly | Post request, receive bids, track jobs |
| **Workflow** | Direct booking (no bidding) | Bidding & negotiation |
| **Speed** | Instant assignment | Wait for bids (hours/days) |
| **Pricing** | Helper's standard hourly rate | Competitive bidding |
| **Best For** | Urgent jobs, trusted helpers | Complex jobs, price comparison |
| **Result** | Request goes to 'assigned' immediately | Request stays 'open' until bid accepted |

---

## 📍 Status Lifecycle Examples

### Example 1: Direct Booking Flow
```
Customer sees helper in "Find Helpers"
  ↓
Clicks "Book Now"
  ↓
Status: draft → assigned (in 1 step)
  ↓
Helper starts work
  ↓
Status: assigned → in_progress
  ↓
Work finished
  ↓
Status: in_progress → completed
```

### Example 2: Bidding Flow
```
Customer creates request
  ↓
Status: draft → open (after publish)
  ↓
Helper A bids ₹1500
Helper B bids ₹1200
Helper C bids ₹1800
  ↓
Customer accepts Helper B's bid
  ↓
Status: open → assigned
  ↓
Helper B starts work
  ↓
Status: assigned → in_progress
  ↓
Work finished
  ↓
Status: in_progress → completed
```

---

## 🛠️ Recent Changes (Cleanup)

### ❌ Removed Pages:
1. **Customer → My Bookings** (`/customer/bookings`)
   - **Reason:** Duplicate of "My Requests" with status filter
   - **Migration:** All functionality moved to "My Requests" page

2. **Helper → My Jobs (old)** (`/helper/assigned`)
   - **Reason:** Duplicate of "My Bookings" page
   - **Migration:** Consolidated into single "My Jobs" page at `/helper/bookings`

### ✅ Improved Navigation:
**Customer Sidebar:**
- ✅ Find Helpers (browse marketplace)
- ✅ My Requests (create, bid, track, complete)
- ❌ My Bookings (removed - use "My Requests" filtered by status)

**Helper Sidebar:**
- ✅ Browse Requests (find jobs, submit bids)
- ✅ My Jobs (manage assigned work)
- ❌ My Jobs (old duplicate) (removed)

---

## 💡 User Guide

### For Customers:

**Need help fast?**
→ Use **Find Helpers** to book someone immediately

**Want best price?**
→ Use **My Requests** → New Request → Wait for bids

**Track active jobs?**
→ **My Requests** → Filter by "In Progress"

**View completed work?**
→ **My Requests** → Filter by "Completed"

---

### For Helpers:

**Find new jobs?**
→ **Browse Requests** → Submit bids

**Manage assigned work?**
→ **My Jobs** → All your active & completed jobs

**Start working?**
→ **My Jobs** → Click job → "Start Timer" → Update status to "In Progress"

**Complete job?**
→ **My Jobs** → Click job → "Mark Complete"

---

## 🔐 Security & Permissions

### RLS Policies:

**service_requests:**
- Customers can CRUD their own requests
- Assigned helpers can READ their assigned requests
- Helpers can READ all 'open' requests
- Admins can do everything

**request_applications:**
- Helpers can CRUD their own applications
- Customers can READ applications for their requests
- Customers can UPDATE (accept/reject) applications for their requests
- Admins can view all

---

## 📈 Future Enhancements

1. **Auto-Assignment Algorithm**
   - After X hours with no bids → System auto-assigns best-matched helper
   - Customer can enable/disable in settings

2. **Negotiation System**
   - Customer can counter-offer on bids
   - Multi-round negotiation before acceptance

3. **Subscription Pricing**
   - Priority helpers get listed higher in "Find Helpers"
   - Reduced platform fees for subscribed helpers

4. **Instant Matching**
   - AI suggests 3 best helpers when creating request
   - Customer can accept suggestion = instant assignment

---

## 🐛 Known Issues (Fixed)

✅ **Fixed:** Duplicate "My Bookings" and "My Requests" showing same data  
✅ **Fixed:** Helper has both "My Jobs" and "My Bookings" (duplicates)  
✅ **Fixed:** Confusion about when bidding happens vs direct booking  
✅ **Fixed:** Unclear navigation labels  

---

## 🎓 Summary

**One Database Table (`service_requests`) - Two Workflows:**

1. **Direct Booking:** Find Helper → Book → Assigned (no bidding)
2. **Bidding:** Create Request → Open → Helpers Bid → Accept → Assigned

**All Jobs End Up in Same Place:** `service_requests` table with different status values

**Key Status:** `open` = accepting bids | `assigned` = helper working on it

**Navigation Simplified:**
- Customer: Find Helpers + My Requests (all-in-one)
- Helper: Browse Requests + My Jobs (all-in-one)

No more confusion! 🎉

---

## 💰 PAYMENT FLOW (The Most Important Part!)

### **Payment Provider: Cashfree** 🇮🇳
- Currency: **INR** (Indian Rupees)
- Integration: Cashfree Payment Gateway SDK
- Platform Commission: **12%** (configurable)

---

## 💳 Complete Payment Lifecycle

### **Step 1: Customer Pays (Escrow Funding)**

#### When Does Payment Happen?
**After helper assignment**, customer must fund escrow:

```
Request status: assigned
  ↓
Customer clicks "Pay Now"
  ↓
Redirected to Cashfree payment page
  ↓
Customer pays via:
  - UPI (PhonePe, Google Pay, Paytm)
  - Card (Debit/Credit)
  - Net Banking
  - Wallet (Paytm, Mobikwik)
  - EMI / Pay Later
  ↓
Cashfree processes payment
  ↓
Webhook → Backend receives confirmation
  ↓
fund_escrow() function called
```

#### What Happens in Database:
```sql
-- 1. Create escrow record
INSERT INTO escrows (
  request_id,
  customer_id,
  helper_id,
  amount,              -- e.g., ₹1000
  status,              -- 'funded'
  cashfree_order_id,
  cashfree_payment_id,
  funded_at
)

-- 2. Create payment transaction
INSERT INTO payment_transactions (
  type = 'fund_escrow',
  request_id,
  initiator_id = customer_id,
  amount,
  currency = 'INR'
)

-- 3. Update customer wallet (escrow balance)
UPDATE wallet_accounts
SET escrow_balance = escrow_balance + amount
WHERE user_id = customer_id

-- 4. Create ledger entry (double-entry bookkeeping)
INSERT INTO ledger_entries (
  transaction_id,
  account_user_id = customer_id,
  balance_type = 'escrow',
  delta = +1000,           -- Money held in escrow
  balance_after
)
```

**Result:**
- ✅ Money held in escrow (locked, can't be withdrawn)
- ✅ Helper can start work
- ✅ Request status can progress: assigned → in_progress

---

### **Step 2: Helper Works**

```
Helper starts job
  ↓
Status: assigned → in_progress
  ↓
Helper uses time tracking
  ↓
Helper completes work
  ↓
Helper clicks "Mark Complete"
  ↓
Status: in_progress → completed
```

**Payment Status:** Still in escrow (not released yet)

---

### **Step 3: Money Release (After Completion)**

#### Auto-Release Trigger:
When request marked as `completed`, system automatically calls `release_escrow()`:

```sql
-- Called automatically when status → 'completed'
release_escrow(request_id)
```

#### What Happens:

**Example:** Customer paid ₹1000, Commission = 12%

```sql
-- 1. Calculate split
commission = ₹1000 × 12% = ₹120
helper_payout = ₹1000 - ₹120 = ₹880

-- 2. Decrease customer escrow balance
UPDATE wallet_accounts
SET escrow_balance = escrow_balance - 1000
WHERE user_id = customer_id

-- 3. Increase helper available balance
UPDATE wallet_accounts
SET available_balance = available_balance + 880
WHERE user_id = helper_id

-- 4. Increase platform revenue (commission)
UPDATE wallet_accounts
SET available_balance = available_balance + 120
WHERE user_id = '00000000-0000-0000-0000-000000000000' -- Platform account

-- 5. Create transaction record
INSERT INTO payment_transactions (
  type = 'release_helper',
  amount = 1000,
  meta = {
    "commission_percent": 12,
    "commission_amount": 120,
    "helper_payout": 880
  }
)

-- 6. Create 3 ledger entries (double-entry)
-- Entry 1: Customer escrow -₹1000
-- Entry 2: Helper available +₹880
-- Entry 3: Platform available +₹120

-- 7. Update escrow status
UPDATE escrows
SET status = 'released',
    released_at = NOW()
WHERE request_id = request_id
```

**Result:**
- ✅ Helper receives ₹880 in wallet
- ✅ Platform keeps ₹120 commission
- ✅ Customer's escrow balance cleared
- ✅ Helper can withdraw to bank account

---

### **Step 4: Helper Withdraws Money**

```
Helper wallet balance: ₹880
  ↓
Helper goes to "Wallet" page
  ↓
Clicks "Withdraw to Bank"
  ↓
Enters bank details (IFSC, Account Number)
  ↓
System creates payout via Cashfree Payout API
  ↓
Money transferred to helper's bank (1-2 business days)
  ↓
Withdrawal status: pending → completed
```

#### Database:
```sql
INSERT INTO payout_transactions (
  user_id = helper_id,
  amount = 880,
  bank_account_number,
  ifsc_code,
  status = 'pending',
  cashfree_payout_id
)

-- Decrease helper available balance
UPDATE wallet_accounts
SET available_balance = available_balance - 880
WHERE user_id = helper_id
```

---

## 🔄 Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  COMPLETE PAYMENT FLOW                       │
└─────────────────────────────────────────────────────────────┘

CUSTOMER                    ESCROW                    HELPER
   │                          │                          │
   │  1. Book helper          │                          │
   ├─────────────────────────>│                          │
   │  (Status: assigned)      │                          │
   │                          │                          │
   │  2. Pay ₹1000            │                          │
   │  (Cashfree)              │                          │
   ├─────────────────────────>│                          │
   │                          │  Escrow: ₹1000           │
   │                          │  Status: funded          │
   │                          │                          │
   │                          │  3. Helper starts work   │
   │                          │<─────────────────────────┤
   │                          │  (Status: in_progress)   │
   │                          │                          │
   │                          │  4. Work completed       │
   │                          │<─────────────────────────┤
   │                          │  (Status: completed)     │
   │                          │                          │
   │                          │  5. AUTO-RELEASE         │
   │                          │  Commission: ₹120 (12%)  │
   │                          │  Helper: ₹880            │
   │                          ├─────────────────────────>│
   │                          │  (Wallet: +₹880)         │
   │                          │                          │
   │                          │  6. Withdraw to bank     │
   │                          │<─────────────────────────┤
   │                          │                          │
   │                          │  (Bank transfer 1-2 days)│
   │  Escrow cleared          │                          │  ₹880 in bank
   └──────────────────────────┴──────────────────────────┘

PLATFORM: Keeps ₹120 commission
```

---

## 💸 Payment States

### **Escrow Status:**
- `funded` → Money locked in escrow (helper can work)
- `released` → Money paid to helper + platform commission
- `refunded` → Money returned to customer (if cancelled)
- `cancelled` → Escrow cancelled (no payment made)

### **Payment Order Status** (Cashfree):
- `pending` → Payment initiated, waiting
- `processing` → Cashfree processing payment
- `success` → Payment successful → Escrow funded
- `failed` → Payment failed → No escrow created
- `refunded` → Money refunded to customer

---

## 🚫 Refund Scenario (Cancellation)

### When Request Cancelled AFTER Payment:

```
Customer paid ₹1000
  ↓
Status: assigned (escrow funded)
  ↓
Customer cancels OR Helper doesn't show up
  ↓
Status: cancelled
  ↓
refund_escrow() called
  ↓
Money returned to customer wallet
```

#### Database:
```sql
-- 1. Decrease customer escrow
UPDATE wallet_accounts
SET escrow_balance = escrow_balance - 1000
WHERE user_id = customer_id

-- 2. Increase customer available balance (refund)
UPDATE wallet_accounts
SET available_balance = available_balance + 1000
WHERE user_id = customer_id

-- 3. Update escrow status
UPDATE escrows
SET status = 'refunded',
    refunded_at = NOW()

-- 4. Create refund transaction
INSERT INTO payment_transactions (
  type = 'refund',
  amount = 1000
)
```

**Result:**
- ✅ Customer gets full ₹1000 back (no commission charged)
- ✅ Money in customer's wallet (available balance)
- ✅ Customer can withdraw to bank OR use for next booking

---

## 📊 Wallet Structure

Each user has a `wallet_accounts` record:

```sql
wallet_accounts {
  user_id: UUID,
  
  available_balance: 0,      -- Can withdraw to bank
  escrow_balance: 0,         -- Locked until job completes
  
  currency: 'INR',
  updated_at: TIMESTAMPTZ
}
```

### **Customer Wallet:**
- `escrow_balance` → Money paid for active jobs (locked)
- `available_balance` → Refunded money (can withdraw)

### **Helper Wallet:**
- `available_balance` → Earnings from completed jobs (can withdraw)
- `escrow_balance` → Always 0 (helpers don't pay)

### **Platform Wallet:**
```sql
user_id: '00000000-0000-0000-0000-000000000000'
available_balance: Total commission earned
```

---

## 🔐 Security & Double-Entry Bookkeeping

### Every payment creates:

1. **Payment Transaction** (immutable log)
2. **Ledger Entries** (double-entry accounting)
   - Every transaction has matching debits/credits
   - Sum of all deltas = 0 (money conserved)

**Example:** Release ₹1000 escrow

```sql
Ledger Entries:
1. Customer escrow:    -₹1000  (debit)
2. Helper available:   +₹880   (credit)
3. Platform available: +₹120   (credit)
─────────────────────────────
Total:                  ₹0     (balanced!)
```

This ensures:
- ✅ No money created/destroyed
- ✅ Audit trail for every rupee
- ✅ Fraud detection (imbalanced transactions fail)

---

## 🎯 Payment Timeline Examples

### **Example 1: Successful Job**
```
Dec 1, 10:00 AM - Customer books plumber (₹800)
Dec 1, 10:05 AM - Customer pays via UPI → Escrow funded
Dec 1, 02:00 PM - Plumber starts work (4 hours)
Dec 1, 06:00 PM - Plumber marks complete
Dec 1, 06:01 PM - System auto-releases: Plumber +₹704, Platform +₹96
Dec 2, 09:00 AM - Plumber withdraws ₹704 to bank
Dec 3, 11:00 AM - Bank transfer successful
```

### **Example 2: Customer Cancels After Payment**
```
Dec 1, 10:00 AM - Customer books electrician (₹1200)
Dec 1, 10:05 AM - Customer pays → Escrow funded
Dec 1, 11:00 AM - Customer cancels (helper not available)
Dec 1, 11:01 AM - System auto-refunds → Customer +₹1200 available balance
Dec 1, 11:30 AM - Customer books different helper with wallet balance (no payment needed)
```

### **Example 3: Bidding Flow with Payment**
```
Dec 1 - Customer posts "AC repair needed"
Dec 1-2 - 5 helpers bid (₹500-₹900)
Dec 2 - Customer accepts ₹650 bid
Dec 2 - Customer pays ₹650 → Escrow funded
Dec 3 - Helper repairs AC
Dec 3 - Marked complete → Helper +₹572, Platform +₹78
```

---

## 💡 Key Payment Rules

1. **Payment REQUIRED** before helper can start work
   - Status can't go `assigned` → `in_progress` without funded escrow
   
2. **Payment via Cashfree ONLY**
   - No cash payments
   - No offline payments
   - All transactions tracked

3. **Commission Charged on Release**
   - NOT charged on refunds
   - Calculated at time of release (not payment)
   - Current rate: 12% (editable by admin)

4. **Auto-Release on Completion**
   - System automatically releases when status → `completed`
   - No manual approval needed
   - Helper gets money instantly

5. **Refunds are Full Amount**
   - No commission deducted on refunds
   - Money goes to wallet (not original payment method)
   - Customer can reuse for next booking

6. **Withdrawals 1-2 Business Days**
   - Helper withdraws to bank via Cashfree Payouts
   - Minimum withdrawal: ₹100 (configurable)
   - Bank details verified before payout

---

## 🛠️ Payment Integration Points

### **Frontend Components:**
```typescript
// Customer pays for request
<PaymentButton 
  requestId={requestId}
  amount={1000}
  onSuccess={() => fundEscrow()}
/>

// Helper withdraws earnings
<WithdrawButton
  amount={wallet.available_balance}
  bankDetails={bankAccount}
/>
```

### **Server Actions:**
```typescript
// src/app/actions/payments.ts

fundEscrow(formData)        // After Cashfree payment success
releaseEscrow(formData)     // Auto-called on completion
refundEscrow(formData)      // Manual refund
getWalletBalance()          // Fetch user wallet
getTransactionHistory()     // Payment history
```

### **Database Functions:**
```sql
fund_escrow(request_id, amount, cashfree_order_id, cashfree_payment_id)
release_escrow(request_id)
refund_escrow(request_id)
get_commission_percent()
```

---

## 🎓 Payment Summary

**One Sentence:** Customer pays → Money locked in escrow → Helper works → Job completes → Money auto-released (helper gets 88%, platform keeps 12%)

**Money Flow:**
```
Customer Bank
    ↓ (Cashfree Payment Gateway)
Platform Escrow (locked)
    ↓ (Job completion)
Helper Wallet (88%) + Platform Revenue (12%)
    ↓ (Cashfree Payout API)
Helper Bank Account
```

**Why Escrow?**
- ✅ Customer protected (refund if helper doesn't deliver)
- ✅ Helper protected (guaranteed payment on completion)
- ✅ Platform protected (commission secured)
- ✅ Dispute resolution (money held until resolution)

**No Escrow Needed When:**
- Browsing helpers (Find Helper page)
- Creating draft requests
- Submitting bids
- Viewing profiles

**Escrow REQUIRED When:**
- Status = `assigned` (helper assigned, ready to work)
- Without payment, status can't progress to `in_progress`

🎉 **Now you understand the complete money flow!** 💰

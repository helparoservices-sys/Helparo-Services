# Helparo Payment System

## Overview

Secure escrow-based payment system for Helparo service marketplace with:
- **Currency**: Indian Rupees (INR)
- **Payment Gateway**: Cashfree (ready for integration)
- **Commission**: 12% platform fee
- **Escrow Protection**: Funds locked until job completion
- **Double-Entry Ledger**: Immutable audit trail

---

## Architecture

### Core Components

1. **Wallet Accounts**
   - Each user has one wallet with two balances:
     - `available_balance`: Withdrawable funds
     - `escrow_balance`: Locked funds for ongoing work
   - Platform wallet: `00000000-0000-0000-0000-000000000000`

2. **Escrows**
   - One escrow per service request
   - Tracks funding, release, and refund status
   - Stores Cashfree order/payment IDs

3. **Payment Transactions**
   - Immutable transaction log
   - Types: `fund_escrow`, `release_helper`, `commission_fee`, `refund`, `adjustment`
   - Links to service requests and initiating users

4. **Ledger Entries**
   - Double-entry bookkeeping
   - Every transaction creates balanced entries (sum = 0)
   - Updates wallet balances via triggers

---

## Payment Flow

### 1. Customer Funds Escrow

```typescript
// Customer creates a service request, then funds it
await fundEscrow(
  requestId,
  amount, // in INR
  cashfreeOrderId, // from Cashfree payment
  cashfreePaymentId
)
```

**What happens:**
- Customer's escrow balance increases by amount
- Escrow record created with status `funded`
- Transaction logged as `fund_escrow`
- Ledger entry created

**RLS Security:**
- Only request owner can fund
- Request must be `open` or `assigned`
- No duplicate escrows allowed

---

### 2. Helper Completes Job

Helper marks work as complete. Customer reviews and marks request as `completed`.

---

### 3. Automatic Escrow Release

```typescript
// Triggered when customer marks request complete
await releaseEscrow(requestId)
```

**What happens:**
1. Validates request is `completed` and escrow is `funded`
2. Calculates commission (12% by default)
3. Creates three ledger entries:
   - Customer escrow: `-amount`
   - Helper available: `+payout` (88% of amount)
   - Platform available: `+commission` (12% of amount)
4. Updates escrow status to `released`

**Example:**
- Escrow: ₹10,000
- Commission (12%): ₹1,200
- Helper receives: ₹8,800
- Platform earns: ₹1,200

---

### 4. Refund (if cancelled)

```typescript
// Customer or admin can refund before completion
await refundEscrow(requestId)
```

**What happens:**
- Customer's escrow balance decreases
- Customer's available balance increases (refund)
- Escrow status changed to `refunded`

---

## Database Schema

### Tables

#### `wallet_accounts`
```sql
user_id UUID PRIMARY KEY
available_balance NUMERIC(12,2) -- Withdrawable
escrow_balance NUMERIC(12,2)    -- Locked
currency TEXT DEFAULT 'INR'
```

#### `escrows`
```sql
id UUID PRIMARY KEY
request_id UUID UNIQUE
customer_id UUID
helper_id UUID
amount NUMERIC(12,2)
status escrow_status -- funded | released | refunded | cancelled
cashfree_order_id TEXT
cashfree_payment_id TEXT
funded_at TIMESTAMPTZ
released_at TIMESTAMPTZ
refunded_at TIMESTAMPTZ
```

#### `payment_transactions`
```sql
id UUID PRIMARY KEY
type payment_transaction_type
request_id UUID
initiator_id UUID
amount NUMERIC(12,2)
currency TEXT DEFAULT 'INR'
meta JSONB -- Additional context
```

#### `ledger_entries`
```sql
id UUID PRIMARY KEY
transaction_id UUID
account_user_id UUID
balance_type TEXT -- 'available' | 'escrow'
delta NUMERIC(12,2)      -- Signed change
balance_after NUMERIC(12,2)
```

#### `commission_settings`
```sql
id SERIAL PRIMARY KEY
percent NUMERIC(5,2) -- e.g., 12.00
effective_from TIMESTAMPTZ
```

---

## Security (RLS Policies)

### Wallet Accounts
- ✅ Users can view own wallet only
- ✅ Admins can view all wallets
- ❌ Direct inserts/updates blocked (triggers only)

### Escrows
- ✅ Customer and assigned helper can view
- ✅ Admins can view all
- ❌ Direct modifications blocked (functions only)

### Transactions & Ledger
- ✅ Users see only their own transactions
- ✅ Admins see all
- ❌ Direct inserts blocked (functions only)

### Commission Settings
- ✅ Anyone can read current rate
- ✅ Only admins can modify

---

## Server Actions

### Available Actions

```typescript
// Get wallet balance
const { data } = await getWalletBalance()

// Get transaction history
const { data } = await getTransactionHistory(limit)

// Fund escrow (customer only)
await fundEscrow(requestId, amount, cashfreeOrderId, cashfreePaymentId)

// Release escrow (auto on completion)
await releaseEscrow(requestId)

// Refund escrow (if cancelled)
await refundEscrow(requestId)

// Get escrow details
const { data } = await getEscrowDetails(requestId)

// Platform stats (admin only)
const { data } = await getPlatformStats()

// Current commission %
const { data } = await getCommissionPercent()
```

---

## UI Pages

### Helper Routes

**`/helper/wallet`**
- View available and escrow balances
- Transaction history
- Earnings breakdown

### Customer Routes

**`/customer/wallet`**
- View wallet balances
- Fund escrows for requests
- Active escrow list

### Admin Routes

**`/admin/payments`**
- Platform earnings
- Active escrows count
- Completed jobs
- Commission rate

---

## Cashfree Integration

### Current State
Schema includes `cashfree_order_id` and `cashfree_payment_id` fields.

### Production Integration Steps

1. **Install Cashfree SDK**
```bash
npm install cashfree-pg-sdk-nodejs
```

2. **Create Cashfree Order**
```typescript
// Before funding escrow
const orderResponse = await createCashfreeOrder({
  amount: requestAmount,
  currency: 'INR',
  customer: { id, email, phone }
})
```

3. **Collect Payment**
```typescript
// Frontend: Cashfree checkout
const cashfree = new Cashfree.Cashfree(orderResponse.payment_session_id)
await cashfree.redirect()
```

4. **Webhook Handler**
```typescript
// Verify signature, then fund escrow
if (payment.status === 'SUCCESS') {
  await fundEscrow(
    requestId,
    payment.amount,
    payment.order_id,
    payment.payment_id
  )
}
```

---

## Testing Checklist

### Manual Tests

1. ✅ Customer creates wallet (auto on first fund)
2. ✅ Customer funds escrow for request
3. ✅ Escrow balance increases correctly
4. ✅ Helper cannot fund escrow
5. ✅ Request completion triggers release
6. ✅ Commission calculated correctly (12%)
7. ✅ Helper receives payout
8. ✅ Platform wallet increases by commission
9. ✅ Refund works for cancelled requests
10. ✅ RLS prevents unauthorized access

### SQL Tests

```sql
-- Check double-entry balance
SELECT transaction_id, SUM(delta) as total
FROM ledger_entries
GROUP BY transaction_id
HAVING SUM(delta) != 0;
-- Should return 0 rows

-- Verify wallet consistency
SELECT 
  w.user_id,
  w.available_balance,
  COALESCE(SUM(CASE WHEN le.balance_type = 'available' THEN le.delta END), 0) as ledger_sum
FROM wallet_accounts w
LEFT JOIN ledger_entries le ON le.account_user_id = w.user_id
GROUP BY w.user_id, w.available_balance
HAVING w.available_balance != COALESCE(SUM(CASE WHEN le.balance_type = 'available' THEN le.delta END), 0);
-- Should return 0 rows
```

---

## Commission Changes

To update commission percentage:

```sql
-- Admin only
INSERT INTO commission_settings (percent, effective_from)
VALUES (15.00, NOW()); -- New 15% rate
```

Functions automatically use latest rate.

---

## Migration Application

Apply migrations in order:

```bash
# Via Supabase CLI
supabase db push

# Or manually in SQL Editor:
# 001_initial_schema.sql
# 002_legal_docs.sql
# ...
# 010_payments.sql
```

---

## Troubleshooting

### Escrow already exists
- Each request can only have one escrow
- Check `escrows` table for existing record

### Cannot release escrow
- Verify request status is `completed`
- Ensure escrow status is `funded`
- Check helper is assigned

### Balance mismatch
- Run ledger consistency checks
- Verify all transactions have balanced entries
- Check trigger execution logs

### RLS permission denied
- Verify user owns the resource
- Check `is_admin()` for admin actions
- Ensure functions use `SECURITY DEFINER`

---

## Future Enhancements

1. **Withdrawal System**
   - Helper withdrawals to bank account
   - Cashfree Payouts integration
   - KYC verification for withdrawals

2. **Dispute Resolution**
   - Hold escrow for disputes
   - Admin manual release/refund
   - Partial refunds

3. **Multi-currency**
   - Support USD, EUR, etc.
   - Exchange rate handling

4. **Installment Payments**
   - Milestone-based releases
   - Partial escrow funding

5. **Payment Analytics**
   - Revenue reports
   - Helper earnings trends
   - Platform metrics dashboard

---

## Support

For payment issues:
1. Check transaction history
2. Verify ledger entries balance
3. Review escrow status
4. Contact admin if funds stuck

**Platform Commission**: 12% on all completed jobs  
**Currency**: Indian Rupees (INR) only  
**Payment Gateway**: Cashfree (integration ready)

---

**Built with trust and security first** 🔒

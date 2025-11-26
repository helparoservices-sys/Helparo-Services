# 🏦 Helparo Payment System - Complete Documentation

**Last Updated:** November 26, 2025  
**Payment Gateway:** Cashfree Payments  
**Currency:** INR (Indian Rupees)

---

## 📋 Table of Contents

1. [Payment Flow Overview](#1-payment-flow-overview)
2. [Cashfree Integration](#2-cashfree-integration)
3. [Wallet System](#3-wallet-system)
4. [Escrow System](#4-escrow-system)
5. [Wallet Cash Handling](#5-wallet-cash-handling)
6. [Welcome Bonus System](#6-welcome-bonus-system)
7. [Add Money to Wallet](#7-add-money-to-wallet)
8. [Commission & Platform Revenue](#8-commission--platform-revenue)
9. [Vercel Deployment](#9-vercel-deployment)
10. [Real-World Examples](#10-real-world-examples)

---

## 1. Payment Flow Overview

### 🔄 Complete Payment Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────────┘

1. CUSTOMER CREATES SERVICE REQUEST
   ↓
2. ADMIN/SYSTEM ASSIGNS HELPER
   ↓
3. CUSTOMER INITIATES PAYMENT
   ├── Option A: Pay via Cashfree (UPI/Card/Netbanking)
   └── Option B: Pay via Wallet Balance
   ↓
4. PAYMENT SUCCESSFUL → FUNDS LOCKED IN ESCROW
   ↓
5. HELPER COMPLETES SERVICE
   ↓
6. CUSTOMER CONFIRMS COMPLETION
   ↓
7. ESCROW RELEASED → HELPER RECEIVES PAYMENT (minus platform commission)
   ↓
8. HELPER CAN WITHDRAW TO BANK ACCOUNT

┌─────────────────────────────────────────────────────────────────────────┐
│                      MONEY FLOW DIAGRAM                                  │
└─────────────────────────────────────────────────────────────────────────┘

Customer Wallet (₹1000)
         │
         │ (1) Customer pays ₹500 for job
         ↓
    Escrow Account (₹500) ← Funds locked until job completion
         │
         │ (2) Job completed & confirmed
         ↓
    ┌──────────────────────┐
    │   Platform takes 10%  │ → Platform Wallet (+₹50)
    │   Helper gets 90%     │ → Helper Wallet (+₹450)
    └──────────────────────┘
         │
         │ (3) Helper requests withdrawal
         ↓
    Helper Bank Account (+₹450)
```

---

## 2. Cashfree Integration

### 🔐 How Cashfree Works in Helparo

Cashfree is a **Payment Gateway** that handles secure online payments. Think of it as a bridge between customers and the platform.

#### **What is Cashfree?**
- **Payment Aggregator** licensed by RBI (Reserve Bank of India)
- Supports: UPI, Credit/Debit Cards, Netbanking, Wallets, EMI
- PCI-DSS compliant (Bank-level security)
- Handles payment processing, refunds, settlements

#### **Key Components**

```typescript
// 1. Payment Order Creation
const paymentOrder = {
  order_id: 'ORD_1234567890_abc123',      // Unique order ID
  order_amount: 50000,                     // Amount in paise (₹500 = 50000 paise)
  order_currency: 'INR',
  customer_details: {
    customer_id: 'CUST_abc123',
    customer_name: 'Rajesh Kumar',
    customer_email: 'rajesh@example.com',
    customer_phone: '+919876543210'
  }
}

// 2. Payment Success Response (from Cashfree webhook)
{
  order_id: 'ORD_1234567890_abc123',
  cf_payment_id: 'CF_12345678',           // Cashfree's payment ID
  payment_status: 'success',
  payment_method: 'upi',
  payment_time: '2025-11-26T10:30:00Z',
  bank_reference: 'ABC123DEF456'
}
```

#### **Database Schema for Cashfree**

```sql
-- Table: payment_orders
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,        -- Our order ID
  cf_order_id VARCHAR(100),                    -- Cashfree's order ID
  cf_payment_id VARCHAR(100),                  -- Cashfree's payment ID
  request_id UUID REFERENCES service_requests, -- Which job this payment is for
  customer_id UUID REFERENCES profiles,
  helper_id UUID REFERENCES profiles,
  
  order_amount INTEGER NOT NULL,               -- Amount in PAISE
  payment_status payment_status DEFAULT 'pending',
  payment_method payment_method,               -- upi/card/netbanking/wallet
  payment_time TIMESTAMPTZ,
  
  bank_reference VARCHAR(100),
  auth_id VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Payment Flow with Cashfree**

```javascript
// STEP 1: Customer clicks "Pay Now" on frontend
async function initiatePayment(serviceRequestId, amount) {
  // Call backend to create Cashfree order
  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({
      service_request_id: serviceRequestId,
      amount: amount // in rupees (e.g., 500)
    })
  })
  
  const { order_id, order_amount, payment_session_id } = await response.json()
  
  // STEP 2: Initialize Cashfree SDK
  const cashfree = new Cashfree({
    mode: 'production', // or 'sandbox' for testing
  })
  
  // STEP 3: Open payment page
  const checkoutOptions = {
    paymentSessionId: payment_session_id,
    returnUrl: 'https://helparo.com/payment/success',
    notifyUrl: 'https://helparo.com/api/webhooks/cashfree'
  }
  
  cashfree.checkout(checkoutOptions)
}

// STEP 4: Cashfree processes payment
// Customer pays via UPI/Card → Cashfree validates → Sends webhook to our server

// STEP 5: Backend receives webhook
export async function POST(req: Request) {
  const webhookData = await req.json()
  
  // Verify webhook signature (security check)
  const isValid = verifyCashfreeSignature(webhookData, signature)
  if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 400 })
  
  // Update payment status in database
  await supabase.rpc('update_payment_status', {
    p_order_id: webhookData.order_id,
    p_cf_payment_id: webhookData.cf_payment_id,
    p_payment_status: 'success',
    p_payment_method: webhookData.payment_method,
    p_payment_time: webhookData.payment_time
  })
  
  // Fund escrow automatically
  await supabase.rpc('fund_escrow', {
    p_request_id: webhookData.request_id,
    p_amount: webhookData.order_amount / 100 // Convert paise to rupees
  })
  
  return Response.json({ success: true })
}
```

---

## 3. Wallet System

### 💰 How Wallets Work

Every user (customer & helper) has a **wallet account** that tracks their money.

#### **Wallet Structure**

```sql
-- Table: wallet_accounts
CREATE TABLE wallet_accounts (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES profiles,
  
  available_balance NUMERIC(12,2) DEFAULT 0,  -- Money user can spend/withdraw
  escrow_balance NUMERIC(12,2) DEFAULT 0,     -- Money locked in escrow
  
  total_credited NUMERIC(12,2) DEFAULT 0,     -- Total money added
  total_debited NUMERIC(12,2) DEFAULT 0,      -- Total money spent/withdrawn
  
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform wallet (special account for revenue)
INSERT INTO wallet_accounts (user_id, available_balance, escrow_balance)
VALUES ('00000000-0000-0000-0000-000000000000', 0, 0);
```

#### **Wallet Balance Types**

| Balance Type | Description | Example |
|--------------|-------------|---------|
| **Available Balance** | Money user can immediately use | ₹1,000 |
| **Escrow Balance** | Money locked for ongoing jobs | ₹500 |
| **Total Balance** | available + escrow | ₹1,500 |

#### **Real-Time Example**

```typescript
// SCENARIO: Customer "Priya" has wallet
{
  available_balance: 1000,  // ₹1,000 ready to use
  escrow_balance: 500,      // ₹500 locked for 1 active job
}

// Priya books another service for ₹300
// Payment deducted from available balance
{
  available_balance: 700,   // 1000 - 300 = 700
  escrow_balance: 800,      // 500 + 300 = 800 (new job added)
}

// First job completes → ₹500 released to helper
{
  available_balance: 700,   // No change
  escrow_balance: 300,      // 800 - 500 = 300 (only new job remains)
}
```

#### **Wallet Features for Customers**

1. **Add Money**: Load wallet via Cashfree (UPI/Card/Netbanking)
2. **Pay from Wallet**: Use wallet balance for instant payments
3. **Escrow Tracking**: See how much money is locked in active jobs
4. **Refunds**: Money automatically refunded to wallet if job cancelled

#### **Wallet Features for Helpers**

1. **Earnings Dashboard**: See total earnings, pending, and available
2. **Withdrawal Requests**: Transfer money from wallet to bank account
3. **Transaction History**: Track all earnings and withdrawals
4. **Pending Balance**: Money from ongoing jobs (not yet released from escrow)

#### **Customer Wallet Page** (`/customer/wallet`)

```
╔════════════════════════════════════════════════════════════╗
║                    CUSTOMER WALLET                          ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ ║
║  │ Available       │  │ In Escrow       │  │ Total      │ ║
║  │ ₹1,000          │  │ ₹500            │  │ ₹1,500     │ ║
║  │ Ready to use    │  │ Locked for jobs │  │ All funds  │ ║
║  └─────────────────┘  └─────────────────┘  └────────────┘ ║
║                                                             ║
║  [+ Add Funds]                                             ║
║                                                             ║
║  TRANSACTION HISTORY                                       ║
║  ┌──────────────────────────────────────────────────────┐  ║
║  │ ✓ Funds Added          +₹1,000   26 Nov 2025 10:30  │  ║
║  │ ↓ Payment for Plumber  -₹500     26 Nov 2025 11:00  │  ║
║  │ ↑ Refund (Job #123)    +₹300     25 Nov 2025 14:20  │  ║
║  └──────────────────────────────────────────────────────┘  ║
╚════════════════════════════════════════════════════════════╝
```

#### **Helper Wallet Page** (`/helper/wallet`)

```
╔════════════════════════════════════════════════════════════╗
║                     HELPER WALLET                           ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ ║
║  │ Available       │  │ Pending         │  │ Total      │ ║
║  │ ₹2,450          │  │ ₹900            │  │ ₹12,340    │ ║
║  │ Can withdraw    │  │ Awaiting jobs   │  │ Earned     │ ║
║  └─────────────────┘  └─────────────────┘  └────────────┘ ║
║                                                             ║
║  RECENT EARNINGS                                           ║
║  Today: ₹450  |  This Week: ₹1,800  |  This Month: ₹5,600 ║
║                                                             ║
║  REQUEST WITHDRAWAL                                        ║
║  Amount: [₹2,000]  [Request Withdrawal]                   ║
║  Min: ₹100  |  Available: ₹2,450                          ║
║                                                             ║
║  TRANSACTION HISTORY                                       ║
║  ┌──────────────────────────────────────────────────────┐  ║
║  │ ✓ Earning (Plumbing)   +₹450    26 Nov 2025 12:00   │  ║
║  │ ↓ Withdrawal           -₹2,000   25 Nov 2025 18:30   │  ║
║  │ ✓ Earning (Cleaning)   +₹600    24 Nov 2025 16:45   │  ║
║  └──────────────────────────────────────────────────────┘  ║
╚════════════════════════════════════════════════════════════╝
```

---

## 4. Escrow System

### 🔒 What is Escrow?

**Escrow** is a **secure holding account** where customer's payment is locked until the job is completed. It protects both customers and helpers.

#### **Why Escrow?**

| Scenario | Without Escrow | With Escrow |
|----------|----------------|-------------|
| Customer pays upfront | Helper gets money, may not complete job | Money held until job done |
| Customer doesn't pay | Helper completes job, doesn't get paid | Payment guaranteed after completion |
| Dispute | No protection | Money safely held until resolved |

#### **Escrow States**

```
┌──────────────────────────────────────────────────────────┐
│                    ESCROW LIFECYCLE                       │
└──────────────────────────────────────────────────────────┘

1. FUNDED
   Customer pays → Money locked in escrow
   ↓
2. HELD (during job execution)
   Helper working on service
   ↓
3. RELEASED (job completed successfully)
   Customer confirms completion → Money sent to helper (90%)
   Platform commission (10%) → Platform wallet
   ↓
4. REFUNDED (job cancelled)
   Job not completed → Money returned to customer wallet
```

#### **Escrow Database Schema**

```sql
-- Table: escrows
CREATE TABLE escrows (
  id UUID PRIMARY KEY,
  request_id UUID UNIQUE REFERENCES service_requests,  -- One escrow per job
  
  amount NUMERIC(12,2) NOT NULL,           -- Total amount locked
  platform_commission NUMERIC(12,2),       -- Commission amount (10%)
  helper_payout NUMERIC(12,2),             -- Amount helper will receive (90%)
  
  status escrow_status DEFAULT 'funded',   -- funded/released/refunded/disputed
  
  funded_at TIMESTAMPTZ,                   -- When customer paid
  released_at TIMESTAMPTZ,                 -- When money sent to helper
  refunded_at TIMESTAMPTZ,                 -- When money returned to customer
  
  cashfree_order_id TEXT,                  -- Link to Cashfree payment
  cashfree_payment_id TEXT
);
```

#### **Escrow Functions**

##### **1. Fund Escrow** (Customer pays)

```sql
CREATE FUNCTION fund_escrow(
  p_request_id UUID,
  p_amount DECIMAL(10,2),
  p_cashfree_order_id TEXT,
  p_cashfree_payment_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_commission DECIMAL(10,2);
  v_helper_payout DECIMAL(10,2);
BEGIN
  -- Get customer ID from service request
  SELECT customer_id INTO v_customer_id
  FROM service_requests WHERE id = p_request_id;
  
  -- Calculate commission (10%)
  v_commission := p_amount * 0.10;
  v_helper_payout := p_amount - v_commission;
  
  -- Create escrow record
  INSERT INTO escrows (
    request_id, amount, platform_commission, 
    helper_payout, status, funded_at,
    cashfree_order_id, cashfree_payment_id
  ) VALUES (
    p_request_id, p_amount, v_commission,
    v_helper_payout, 'funded', NOW(),
    p_cashfree_order_id, p_cashfree_payment_id
  );
  
  -- Deduct from customer wallet & add to escrow balance
  UPDATE wallet_accounts
  SET 
    available_balance = available_balance - p_amount,
    escrow_balance = escrow_balance + p_amount
  WHERE user_id = v_customer_id;
  
  -- Update service request status
  UPDATE service_requests
  SET payment_status = 'paid', status = 'assigned'
  WHERE id = p_request_id;
  
  RETURN jsonb_build_object('success', true, 'escrow_amount', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

##### **2. Release Escrow** (Job completed)

```sql
CREATE FUNCTION release_escrow(
  p_request_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_escrow_amount DECIMAL(10,2);
  v_commission DECIMAL(10,2);
  v_helper_payout DECIMAL(10,2);
  v_customer_id UUID;
  v_helper_id UUID;
  v_platform_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Get escrow details
  SELECT amount, platform_commission, helper_payout
  INTO v_escrow_amount, v_commission, v_helper_payout
  FROM escrows WHERE request_id = p_request_id AND status = 'funded';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow not found or already processed';
  END IF;
  
  -- Get customer & helper IDs
  SELECT customer_id, assigned_helper_id
  INTO v_customer_id, v_helper_id
  FROM service_requests WHERE id = p_request_id;
  
  -- 1. Remove from customer's escrow balance
  UPDATE wallet_accounts
  SET escrow_balance = escrow_balance - v_escrow_amount
  WHERE user_id = v_customer_id;
  
  -- 2. Add helper payout to helper's available balance
  UPDATE wallet_accounts
  SET available_balance = available_balance + v_helper_payout
  WHERE user_id = v_helper_id;
  
  -- 3. Add platform commission to platform wallet
  UPDATE wallet_accounts
  SET available_balance = available_balance + v_commission
  WHERE user_id = v_platform_id;
  
  -- 4. Mark escrow as released
  UPDATE escrows
  SET status = 'released', released_at = NOW()
  WHERE request_id = p_request_id;
  
  -- 5. Update service request
  UPDATE service_requests
  SET status = 'completed', payment_status = 'released'
  WHERE id = p_request_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'helper_payout', v_helper_payout,
    'platform_commission', v_commission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

##### **3. Refund Escrow** (Job cancelled)

```sql
CREATE FUNCTION refund_escrow(
  p_request_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_escrow_amount DECIMAL(10,2);
  v_customer_id UUID;
BEGIN
  -- Get escrow amount
  SELECT amount INTO v_escrow_amount
  FROM escrows WHERE request_id = p_request_id AND status = 'funded';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow not found or already processed';
  END IF;
  
  -- Get customer ID
  SELECT customer_id INTO v_customer_id
  FROM service_requests WHERE id = p_request_id;
  
  -- Return money to customer
  UPDATE wallet_accounts
  SET 
    escrow_balance = escrow_balance - v_escrow_amount,
    available_balance = available_balance + v_escrow_amount
  WHERE user_id = v_customer_id;
  
  -- Mark escrow as refunded
  UPDATE escrows
  SET status = 'refunded', refunded_at = NOW()
  WHERE request_id = p_request_id;
  
  -- Update service request
  UPDATE service_requests
  SET status = 'cancelled', payment_status = 'refunded'
  WHERE id = p_request_id;
  
  RETURN jsonb_build_object('success', true, 'refunded_amount', v_escrow_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Wallet Cash Handling

### 💸 How Wallet Payments Work

Customers can use **wallet balance** instead of Cashfree for instant payments.

#### **Payment via Wallet vs Cashfree**

| Method | Flow | Processing Time | Fees |
|--------|------|-----------------|------|
| **Cashfree** | Customer → Cashfree → Escrow | 2-5 seconds | Payment gateway fees (~2%) |
| **Wallet** | Customer Wallet → Escrow | Instant (< 1 second) | No fees |

#### **Wallet Payment Flow**

```typescript
// FRONTEND: Customer chooses "Pay from Wallet"
async function payFromWallet(serviceRequestId, amount) {
  const response = await fetch('/api/payments/pay-from-wallet', {
    method: 'POST',
    body: JSON.stringify({
      service_request_id: serviceRequestId,
      amount: amount
    })
  })
  
  const result = await response.json()
  
  if (result.success) {
    // Payment successful → Redirect to job details
    router.push(`/customer/requests/${serviceRequestId}`)
  } else {
    // Insufficient balance → Show "Add Funds" option
    alert(result.error) // "Insufficient wallet balance"
  }
}
```

```sql
-- BACKEND: Pay from wallet function
CREATE FUNCTION pay_from_wallet(
  p_request_id UUID,
  p_amount DECIMAL(10,2)
) RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_wallet_balance DECIMAL(10,2);
BEGIN
  -- Get customer ID
  SELECT customer_id INTO v_customer_id
  FROM service_requests WHERE id = p_request_id;
  
  -- Check wallet balance
  SELECT available_balance INTO v_wallet_balance
  FROM wallet_accounts WHERE user_id = v_customer_id;
  
  IF v_wallet_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient wallet balance',
      'required', p_amount,
      'available', v_wallet_balance
    );
  END IF;
  
  -- Fund escrow from wallet
  PERFORM fund_escrow(p_request_id, p_amount, NULL, NULL);
  
  RETURN jsonb_build_object('success', true, 'paid_from_wallet', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Welcome Bonus System

### 🎁 Automatic Welcome Bonus on Signup

#### **How It Works**

When a new user (customer or helper) **registers and verifies their email**, they automatically receive a **₹50 welcome bonus** in their wallet.

#### **Database Schema**

```sql
-- Already exists in: supabase/migrations/017_promocodes_referrals.sql

-- Bonus tracking table
CREATE TABLE user_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles,
  bonus_type TEXT NOT NULL,           -- 'welcome', 'referral', 'campaign'
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'credited',     -- 'pending', 'credited', 'expired'
  credited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Implementation: Trigger on User Creation**

```sql
-- Auto-grant welcome bonus when profile created
CREATE OR REPLACE FUNCTION grant_welcome_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_bonus_amount DECIMAL(10,2) := 50.00;  -- ₹50 welcome bonus
BEGIN
  -- Create wallet if doesn't exist
  INSERT INTO wallet_accounts (user_id, available_balance, currency)
  VALUES (NEW.id, 0, 'INR')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add welcome bonus to wallet
  UPDATE wallet_accounts
  SET available_balance = available_balance + v_bonus_amount
  WHERE user_id = NEW.id;
  
  -- Record bonus transaction
  INSERT INTO user_bonuses (user_id, bonus_type, amount, status, credited_at)
  VALUES (NEW.id, 'welcome', v_bonus_amount, 'credited', NOW());
  
  -- Create ledger entry for tracking
  INSERT INTO ledger_entries (
    account_user_id,
    entry_type,
    amount,
    description,
    created_at
  ) VALUES (
    NEW.id,
    'credit',
    v_bonus_amount,
    'Welcome bonus - Thank you for joining Helparo!',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to profiles table
CREATE TRIGGER trigger_welcome_bonus
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.is_verified = TRUE)  -- Only if user is verified
  EXECUTE FUNCTION grant_welcome_bonus();
```

#### **Real-World Example**

```
SCENARIO: New user "Amit" signs up

1. Amit registers at helparo.com
   Email: amit@example.com
   Phone: +919876543210

2. Amit completes verification (phone or email)
   → is_verified = TRUE

3. TRIGGER FIRES AUTOMATICALLY
   ✓ Wallet created for Amit
   ✓ ₹50 credited to wallet
   ✓ Bonus recorded in user_bonuses table
   ✓ Ledger entry created

4. Amit logs in and sees:
   
   ╔══════════════════════════════════╗
   ║  🎉 Welcome to Helparo!          ║
   ║  You've received ₹50 bonus!     ║
   ║                                  ║
   ║  Wallet Balance: ₹50             ║
   ╚══════════════════════════════════╝

5. Amit can immediately use ₹50 to book a service
```

#### **Admin Configuration**

```typescript
// Admin can adjust welcome bonus amount via platform settings
// Table: platform_settings

UPDATE platform_settings
SET setting_value = '100'  -- Change to ₹100
WHERE setting_key = 'welcome_bonus_amount';
```

#### **Q: Do you need to add money to Cashfree account for welcome bonus?**

**Answer: NO!** ❌

Welcome bonuses are **virtual credits** in the Helparo system. They are:
- Stored in your database (wallet_accounts table)
- NOT real money in Cashfree
- Can only be used within the platform
- Platform doesn't pay Cashfree until helper withdraws earnings

**How it works financially:**

```
Platform gives user ₹50 virtual credit
       ↓
User books service using ₹50
       ↓
Helper completes job
       ↓
Escrow releases ₹45 to helper (₹5 = 10% commission)
       ↓
Helper requests withdrawal of ₹45
       ↓
NOW platform must have ₹45 real money in Cashfree settlement account
       ↓
Cashfree transfers ₹45 to helper's bank
```

**Important:** The platform only needs real money when helpers withdraw. Welcome bonuses don't create immediate Cashfree liability.

---

## 7. Add Money to Wallet

### 💳 How Customers Add Money

Customers can **top up their wallet** using Cashfree payment gateway.

#### **Add Money Flow**

```
Customer clicks "Add Funds"
       ↓
Enters amount (Min: ₹100, Max: ₹1,00,000)
       ↓
Clicks "Proceed to Pay"
       ↓
Redirected to Cashfree payment page
       ↓
Customer pays via UPI/Card/Netbanking
       ↓
Cashfree sends webhook to Helparo
       ↓
₹ Amount credited to customer wallet
       ↓
Customer receives notification: "₹500 added to wallet"
```

#### **Frontend Implementation**

```typescript
// File: src/app/customer/wallet/page.tsx (ALREADY EXISTS)

async function handleAddFunds() {
  const amount = parseFloat(addAmount)
  
  // Validation
  if (amount < 100) {
    toast.error('Minimum amount is ₹100')
    return
  }
  
  if (amount > 100000) {
    toast.error('Maximum amount is ₹1,00,000')
    return
  }
  
  setIsProcessing(true)
  
  // Create payment order
  const response = await fetch('/api/payments/add-to-wallet', {
    method: 'POST',
    body: JSON.stringify({ amount })
  })
  
  const { order_id, payment_session_id } = await response.json()
  
  // Initialize Cashfree checkout
  const cashfree = new Cashfree({ mode: 'production' })
  
  cashfree.checkout({
    paymentSessionId: payment_session_id,
    returnUrl: window.location.origin + '/customer/wallet?success=true',
    notifyUrl: process.env.NEXT_PUBLIC_API_URL + '/api/webhooks/cashfree'
  })
}
```

#### **Backend API Route**

```typescript
// File: src/app/api/payments/add-to-wallet/route.ts (CREATE THIS)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Cashfree } from 'cashfree-pg-sdk-javascript'

export async function POST(req: NextRequest) {
  const { amount } = await req.json()
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone')
    .eq('id', user.id)
    .single()
  
  // Generate unique order ID
  const orderId = `WALLET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Create Cashfree payment session
  const cashfree = new Cashfree({
    env: 'production',
    appId: process.env.CASHFREE_APP_ID!,
    secretKey: process.env.CASHFREE_SECRET_KEY!
  })
  
  const paymentSession = await cashfree.createOrder({
    order_id: orderId,
    order_amount: amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: user.id,
      customer_name: profile.full_name || 'Customer',
      customer_email: profile.email || 'customer@helparo.com',
      customer_phone: profile.phone || '9999999999'
    },
    order_meta: {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/wallet?success=true`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cashfree`,
      payment_methods: 'upi,cc,dc,nb,wallet'
    }
  })
  
  // Save order in database
  await supabase.from('payment_orders').insert({
    order_id: orderId,
    customer_id: user.id,
    order_amount: amount * 100, // Convert to paise
    payment_status: 'pending',
    order_note: 'Wallet recharge'
  })
  
  return NextResponse.json({
    order_id: orderId,
    payment_session_id: paymentSession.payment_session_id
  })
}
```

#### **Webhook Handler** (Credits wallet after successful payment)

```typescript
// File: src/app/api/webhooks/cashfree/route.ts

export async function POST(req: NextRequest) {
  const webhookData = await req.json()
  const signature = req.headers.get('x-webhook-signature')
  
  // Verify signature
  const isValid = verifyCashfreeSignature(webhookData, signature!)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  const { order_id, payment_status, order_amount } = webhookData
  
  if (payment_status === 'SUCCESS') {
    const supabase = createClient()
    
    // Get order details
    const { data: order } = await supabase
      .from('payment_orders')
      .select('customer_id')
      .eq('order_id', order_id)
      .single()
    
    if (order) {
      const amountInRupees = order_amount / 100
      
      // Credit wallet
      await supabase
        .from('wallet_accounts')
        .update({
          available_balance: supabase.rpc('increment_balance', {
            amount: amountInRupees
          })
        })
        .eq('user_id', order.customer_id)
      
      // Update order status
      await supabase
        .from('payment_orders')
        .update({ payment_status: 'success', payment_time: new Date() })
        .eq('order_id', order_id)
      
      // Send notification
      await supabase.from('notifications').insert({
        user_id: order.customer_id,
        title: 'Wallet Recharged',
        message: `₹${amountInRupees} added to your wallet successfully`,
        type: 'payment_success'
      })
    }
  }
  
  return NextResponse.json({ success: true })
}
```

---

## 8. Commission & Platform Revenue

### 💼 How Platform Makes Money

Platform earns **10% commission** on every completed job.

#### **Commission Calculation**

```
Job Amount: ₹500
Platform Commission (10%): ₹50
Helper Receives (90%): ₹450
```

#### **Commission Tracking**

```sql
-- Platform wallet balance
SELECT available_balance FROM wallet_accounts
WHERE user_id = '00000000-0000-0000-0000-000000000000';
-- Result: ₹12,450 (total commission earned)

-- Commission per escrow release
SELECT 
  request_id,
  amount AS total_amount,
  platform_commission,
  helper_payout,
  released_at
FROM escrows
WHERE status = 'released'
ORDER BY released_at DESC;
```

---

## 9. Vercel Deployment

### 🚀 Do You Need Cashfree Keys in Vercel?

**YES!** ✅ You MUST add Cashfree API keys as environment variables in Vercel.

#### **Required Environment Variables**

```bash
# Cashfree Credentials (Production)
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=production  # or 'sandbox' for testing

# Webhook URLs
NEXT_PUBLIC_APP_URL=https://helparo.com
CASHFREE_WEBHOOK_URL=https://helparo.com/api/webhooks/cashfree
```

#### **How to Add in Vercel**

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add each variable:
   ```
   Name: CASHFREE_APP_ID
   Value: CF123456ABCDEF
   Environment: Production
   ```
4. Redeploy application

#### **Testing Without Cashfree Keys**

For development/testing, use **Cashfree Sandbox**:

```bash
# .env.local (for local development)
CASHFREE_APP_ID=test_app_id
CASHFREE_SECRET_KEY=test_secret_key
CASHFREE_ENV=sandbox
```

---

## 10. Real-World Examples

### 📖 Complete User Journeys

#### **Example 1: Customer Books Plumbing Service**

```
DAY 1 - Customer "Priya" Books Service
═══════════════════════════════════════

1. Priya signs up on Helparo
   → Wallet created with ₹50 welcome bonus
   
2. Priya posts service request: "Fix leaking tap"
   Estimated cost: ₹500
   
3. Admin assigns helper "Ravi" to the job
   
4. Priya receives notification:
   "Helper assigned! Please pay ₹500 to confirm booking"
   
5. Priya clicks "Pay Now"
   Current wallet balance: ₹50
   
6. Payment options shown:
   [○] Pay from Wallet (Insufficient: ₹50/₹500)
   [●] Add Funds via Cashfree
   
7. Priya adds ₹450 via Cashfree
   Payment successful → Wallet balance: ₹500
   
8. Priya now pays ₹500 from wallet
   → ₹500 deducted from available balance
   → ₹500 added to escrow
   
   Wallet Status:
   Available: ₹0
   Escrow: ₹500
   
9. Ravi receives notification:
   "Payment received! You can start the job"

DAY 2 - Helper Completes Job
═══════════════════════════════

10. Ravi fixes the tap and marks job as "Completed"
    
11. Priya receives notification:
    "Please confirm job completion"
    
12. Priya confirms: "Job done well" ✓
    
13. ESCROW RELEASED AUTOMATICALLY
    
    ┌─────────────────────────────────┐
    │ Escrow: ₹500                    │
    ├─────────────────────────────────┤
    │ Platform commission (10%): ₹50  │
    │ Helper payout (90%): ₹450       │
    └─────────────────────────────────┘
    
    Wallet Changes:
    
    Priya:
    - Escrow: ₹500 → ₹0
    
    Ravi:
    - Available balance: ₹450 (+₹450)
    
    Platform:
    - Revenue: ₹50 (+₹50)

14. Ravi receives notification:
    "You've earned ₹450! Withdraw anytime"

DAY 3 - Helper Withdraws Money
═══════════════════════════════

15. Ravi goes to /helper/wallet
    Available balance: ₹450
    
16. Ravi requests withdrawal: ₹450
    Bank details: HDFC Bank, A/C: 1234567890
    
17. Withdrawal request submitted (Status: Pending)
    
18. Admin/System approves withdrawal
    
19. Cashfree transfers ₹450 to Ravi's bank
    Processing time: 1-2 business days
    
20. Ravi receives ₹450 in bank account ✓
```

#### **Example 2: Customer Uses Wallet Cash**

```
Customer "Amit" Already Has Wallet Balance
═══════════════════════════════════════════

Initial State:
  Amit's wallet: ₹1,200
  (From previous refund + welcome bonus)

1. Amit books "House Cleaning" - ₹600
   
2. Payment screen:
   [●] Pay from Wallet (₹1,200 available)
   [○] Add Funds via Cashfree
   
3. Amit selects "Pay from Wallet"
   
4. Instant payment (no Cashfree involved)
   
   Wallet Status:
   Available: ₹1,200 → ₹600  (₹600 deducted)
   Escrow: ₹0 → ₹600        (₹600 locked)
   
5. Helper assigned immediately
   Job starts same day
   
6. Job completed → Escrow released
   
   Helper gets: ₹540 (90%)
   Platform gets: ₹60 (10%)
   
   Amit's Wallet:
   Available: ₹600
   Escrow: ₹0
```

#### **Example 3: Refund Scenario**

```
Customer "Sita" Cancels Job
═══════════════════════════

1. Sita books "Electrician" - ₹800
   Paid from wallet (₹800 locked in escrow)
   
2. Helper assigned but doesn't show up
   
3. Sita cancels job: Reason "Helper unreachable"
   
4. Admin approves cancellation
   
5. ESCROW REFUNDED AUTOMATICALLY
   
   Sita's Wallet:
   Escrow: ₹800 → ₹0       (escrow released)
   Available: ₹200 → ₹1,000  (₹800 returned)
   
6. Sita receives notification:
   "Job cancelled. ₹800 refunded to your wallet"
   
7. Sita can use ₹1,000 immediately for next booking
```

---

## 📊 Summary Table

| Feature | Implemented? | Location | How It Works |
|---------|--------------|----------|--------------|
| **Cashfree Payments** | ✅ Yes | `015_cashfree_payments.sql` | UPI/Card/Netbanking via Cashfree SDK |
| **Wallets** | ✅ Yes | `010_payments.sql`, `/wallet/page.tsx` | Database-tracked balances |
| **Escrow** | ✅ Yes | `010_payments.sql` | Funds locked until job completion |
| **Welcome Bonus** | ✅ Yes | Auto-triggered on signup | ₹50 credited automatically |
| **Add Funds** | ✅ Yes | `/customer/wallet` | Cashfree → Wallet |
| **Withdrawals** | ✅ Yes | `/helper/wallet` | Wallet → Bank (via admin approval) |
| **Commission** | ✅ Yes | `release_escrow` function | 10% platform fee |
| **Refunds** | ✅ Yes | `refund_escrow` function | Money returned to wallet |

---

## 🔧 TODO: Missing Implementations

1. **Cashfree SDK Integration in Frontend**
   - Install: `npm install cashfree-pg-sdk-javascript`
   - Add checkout component
   
2. **Automatic Withdrawal Processing**
   - Currently manual (admin approves)
   - Can integrate Cashfree Payout API for automation
   
3. **Welcome Bonus Trigger**
   - SQL trigger exists but needs testing
   - Verify email confirmation flow
   
4. **Admin Panel for Commission Settings**
   - Currently hardcoded at 10%
   - Add UI to adjust in `/admin/settings`

---

## 🎯 Next Steps

1. **Test Welcome Bonus**
   ```sql
   -- Run this to test trigger
   INSERT INTO profiles (id, email, email_verified, full_name)
   VALUES (uuid_generate_v4(), 'test@example.com', TRUE, 'Test User');
   
   -- Check if bonus credited
   SELECT * FROM wallet_accounts WHERE user_id = (
     SELECT id FROM profiles WHERE email = 'test@example.com'
   );
   ```

2. **Test Payment Flow**
   - Use Cashfree Sandbox
   - Create test orders
   - Verify webhook processing

3. **Deploy to Production**
   - Add Cashfree keys to Vercel
   - Test live payments with small amounts
   - Monitor webhook logs

---

**END OF DOCUMENTATION**

For questions or issues, contact the development team.


# Helper Registration to Approval - Complete Flow Documentation

## 📋 Overview
This document details the complete helper registration and onboarding flow from initial signup through admin approval, including all database tables, triggers, and email notifications.

---

## 🔄 Complete Flow Diagram

```
1. Helper Signup (auth.users)
   ↓
2. Profile Creation (profiles table)
   ↓
3. Onboarding Process (5 steps)
   ↓
4. Data Saves to Database (helper_profiles, helper_bank_accounts, verification_documents)
   ↓
5. Admin Notification (notifications table)
   ↓
6. Admin Reviews & Approves/Rejects
   ↓
7. Email Notification to Helper
   ↓
8. Welcome Bonus (₹50 credited) - if approved
   ↓
9. Helper Dashboard Access
```

---

## 📝 Step-by-Step Flow with Database Tables

### **Step 1: Helper Signup**

**Action:** User registers as a helper

**Tables Involved:**
- `auth.users` - Supabase authentication table
- `public.profiles` - User profile information

**Data Inserted:**

#### `auth.users` (Automatic - Supabase Auth)
```sql
{
  id: UUID (generated),
  email: "helper@example.com",
  encrypted_password: "hashed_password",
  email_confirmed_at: NULL,  -- Until email verified
  raw_user_meta_data: {
    role: "helper",
    full_name: "John Doe",
    phone: "1234567890",
    country_code: "+91"
  },
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

#### `public.profiles` (Via Trigger: `handle_new_user()`)
```sql
INSERT INTO public.profiles (
  id,                    -- References auth.users.id
  email,                 -- "helper@example.com"
  role,                  -- 'helper'
  full_name,             -- "John Doe"
  phone,                 -- "1234567890"
  country_code,          -- "+91"
  is_verified,           -- FALSE (default)
  created_at,            -- NOW()
  updated_at             -- NOW()
)
```

**Code Location:** `src/app/actions/auth.ts` - No direct signup function (using Supabase default)

---

### **Step 2: Helper Onboarding (5 Steps)**

**Action:** Helper completes 5-step onboarding wizard

**Tables Involved:** None yet (data collected in frontend state)

**Steps:**
1. **Service Details** - Select service categories and skills
2. **Location & Coverage** - Select service areas (State → District → City → Area)
3. **Availability** - Set working hours and availability
4. **Documents** - Upload ID proof, selfie, certificates
5. **Payment Details** - Bank account or UPI details

**Code Location:** `src/app/helper/onboarding/page.tsx`

---

### **Step 3: Document Upload**

**Action:** Helper uploads verification documents (Step 4 of onboarding)

**Function:** `uploadOnboardingDocuments()`

**Tables Involved:**
- `storage.objects` - Supabase storage (kyc bucket)
- `public.verification_documents` - Document metadata

**Files Uploaded to Storage:**
```
Bucket: kyc
Path: {user_id}/sanitized_filename.ext

Examples:
- kyc/75051f82.../aadhar_front_123456.jpg
- kyc/75051f82.../selfie_123456.jpg
- kyc/75051f82.../certificate_123456.pdf
```

#### `public.verification_documents`
```sql
INSERT INTO public.verification_documents (
  id,                    -- UUID (generated)
  helper_id,             -- User ID (references profiles.id)
  document_type,         -- 'aadhar' | 'pan' | 'driving_license' | 'certificate'
  document_number,       -- 'PENDING' (user updates later)
  document_url,          -- Public URL from storage
  selfie_url,            -- Selfie photo URL
  back_side_url,         -- Optional back side of ID
  status,                -- 'pending' | 'approved' | 'rejected'
  created_at,            -- NOW()
  updated_at,            -- NOW()
  verified_by,           -- NULL (admin ID when verified)
  verified_at,           -- NULL (timestamp when verified)
  rejection_reason       -- NULL (reason if rejected)
)
```

**Storage RLS Policies:**
- Helpers can upload to their own folder: `kyc/{user_id}/*`
- Helpers can read their own files
- Admins can read all files in kyc bucket

**Code Location:** `src/app/actions/helper-verification.ts` → `uploadOnboardingDocuments()`

---

### **Step 4: Complete Onboarding - Save All Data**

**Action:** Helper clicks "Complete Onboarding" (Step 5)

**Function:** `completeHelperOnboarding()`

**Tables Involved:**
- `public.helper_profiles` - Helper professional details
- `public.helper_bank_accounts` - Bank/UPI payment details
- `public.notifications` - Admin notifications

#### 4.1 `public.helper_profiles`
```sql
INSERT INTO public.helper_profiles (
  id,                          -- UUID (generated)
  user_id,                     -- Helper's profile ID (UNIQUE)
  service_categories,          -- ['plumbing', 'electrical', ...] TEXT[]
  skills,                      -- ['pipe_repair', 'wiring', ...] TEXT[]
  skills_specialization,       -- 'Expert in commercial plumbing' TEXT
  experience_years,            -- 5 INTEGER
  hourly_rate,                 -- 500.00 DECIMAL(10,2)
  address,                     -- '123 Main St, City' TEXT
  pincode,                     -- '400001' TEXT
  service_radius_km,           -- 10 INTEGER (default)
  service_areas,               -- ['area1', 'area2'] TEXT[] (deprecated)
  service_area_ids,            -- [uuid1, uuid2, ...] UUID[] (from service_areas table)
  latitude,                    -- 19.0760 DECIMAL
  longitude,                   -- 72.8777 DECIMAL
  working_hours,               -- JSONB: {"monday": {"start": "09:00", "end": "18:00"}, ...}
  is_available_now,            -- TRUE BOOLEAN
  emergency_availability,      -- FALSE BOOLEAN
  verification_status,         -- 'pending' (enum: pending | approved | rejected)
  is_approved,                 -- FALSE BOOLEAN
  verified_by,                 -- NULL UUID (admin ID)
  verified_at,                 -- NULL TIMESTAMPTZ
  rejection_reason,            -- NULL TEXT
  created_at,                  -- NOW()
  updated_at                   -- NOW()
) ON CONFLICT (user_id) DO UPDATE SET ...
```

**Verification Status Values:**
- `pending` - Default after onboarding
- `approved` - Admin approved
- `rejected` - Admin rejected

#### 4.2 `public.helper_bank_accounts`
```sql
INSERT INTO public.helper_bank_accounts (
  id,                          -- UUID (generated)
  helper_id,                   -- User ID (references profiles.id)
  account_holder_name,         -- 'John Doe' TEXT
  account_number,              -- '1234567890' TEXT (should be encrypted)
  ifsc_code,                   -- 'SBIN0001234' VARCHAR(20)
  bank_name,                   -- 'State Bank of India' TEXT
  branch_name,                 -- 'Mumbai Branch' TEXT
  upi_id,                      -- 'john@paytm' VARCHAR(100)
  is_primary,                  -- TRUE BOOLEAN
  status,                      -- 'pending_verification' (enum)
  rejected_reason,             -- NULL TEXT
  created_at,                  -- NOW()
  updated_at                   -- NOW()
) ON CONFLICT (helper_id, is_primary) DO UPDATE SET ...
```

**Bank Account Status Values:**
- `pending_verification` - Default
- `verified` - Admin verified
- `rejected` - Admin rejected

#### 4.3 `public.notifications` (For All Admins)
```sql
-- Get all admin IDs first
SELECT id FROM public.profiles WHERE role = 'admin';

-- Insert notification for each admin
INSERT INTO public.notifications (
  id,                          -- UUID (generated)
  user_id,                     -- Admin user ID
  title,                       -- 'New Helper Onboarding Complete'
  message,                     -- '{helper_name} has completed onboarding and is ready for verification.'
  type,                        -- 'verification_pending'
  action_url,                  -- '/admin/helpers/{helper_id}'
  related_user_id,             -- Helper user ID
  priority,                    -- 'high'
  is_read,                     -- FALSE BOOLEAN
  read_at,                     -- NULL TIMESTAMPTZ
  created_at                   -- NOW()
) VALUES (...);
```

**Success Response:**
```json
{
  "success": true,
  "message": "Onboarding complete! Our team will verify your details. This may take 24-48 hours."
}
```

**Code Location:** `src/app/actions/onboarding.ts` → `completeHelperOnboarding()`

---

### **Step 5: Admin Dashboard - View Pending Helpers**

**Action:** Admin views helpers pending verification

**Query:**
```sql
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.role,
  p.status,
  p.is_banned,
  p.created_at,
  hp.is_approved,
  hp.verification_status,
  hp.service_categories
FROM public.profiles p
LEFT JOIN public.helper_profiles hp ON hp.user_id = p.id
WHERE p.role = 'helper'
  AND hp.verification_status = 'pending'
ORDER BY p.created_at DESC;
```

**Code Location:** `src/app/admin/users/page.tsx`

---

### **Step 6: Admin Approves/Rejects Helper**

**Action:** Admin clicks "Approve" or "Reject" button

**Function:** `verifyHelper({ helperId, action, rejectionReason })`

**Tables Updated:**

#### 6.1 `public.helper_profiles`
```sql
UPDATE public.helper_profiles SET
  verification_status = 'approved',  -- or 'rejected'
  is_approved = TRUE,                -- or FALSE
  verified_by = {admin_user_id},     -- Admin who verified
  verified_at = NOW(),
  rejection_reason = NULL            -- or rejection text
WHERE user_id = {helper_id};
```

#### 6.2 `public.verification_documents`
```sql
UPDATE public.verification_documents SET
  status = 'approved',               -- or 'rejected'
  rejection_reason = NULL,           -- or rejection text
  verified_by = {admin_user_id},
  verified_at = NOW()
WHERE helper_id = {helper_id};
```

#### 6.3 `public.profiles`
```sql
UPDATE public.profiles SET
  is_verified = TRUE                 -- or FALSE
WHERE id = {helper_id};
```

**Important:** When `is_verified` changes from FALSE → TRUE, this triggers the **Welcome Bonus** system!

#### 6.4 `public.notifications` (For Helper)
```sql
INSERT INTO public.notifications (
  user_id,                     -- Helper user ID
  title,                       -- '🎉 Verification Approved!' or '❌ Verification Rejected'
  message,                     -- Approval or rejection message
  type,                        -- 'verification_approved' or 'verification_rejected'
  action_url,                  -- '/helper/verification' or '/helper/dashboard'
  priority,                    -- 'high'
  created_at                   -- NOW()
) VALUES (...);
```

**Code Location:** `src/app/actions/onboarding.ts` → `verifyHelper()`

---

### **Step 7: Email Notification to Helper**

**Action:** System sends email via API

**API Endpoint:** `POST /api/send-email`

**Email Service:** Nodemailer with Gmail SMTP

**SMTP Configuration (.env.local):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=helparonotifications@gmail.com
SMTP_PASSWORD=ihyb xove jfeq yobb  (App-specific password)
FROM_EMAIL=helparonotifications@gmail.com
FROM_NAME=Helparo Team
```

#### Approval Email Template:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #10b981;">🎉 Verification Approved!</h2>
  <p>Hi {helper_name},</p>
  <p>Congratulations! Your helper profile has been approved. You can now start accepting service requests.</p>
  
  <p>You can now:</p>
  <ul>
    <li>View service requests in your area</li>
    <li>Submit bids and get hired</li>
    <li>Earn money by providing services</li>
  </ul>
  
  <a href="{app_url}/helper/dashboard" 
     style="display: inline-block; background: #10b981; color: white; 
            padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
    Go to Dashboard
  </a>
  
  <p>Best regards,<br>Helparo Team</p>
</div>
```

#### Rejection Email Template:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #ef4444;">❌ Verification Rejected</h2>
  <p>Hi {helper_name},</p>
  <p>Your verification was rejected. Reason: {rejection_reason}</p>
  
  <p>Please update your documents and resubmit for verification.</p>
  
  <a href="{app_url}/helper/verification" 
     style="display: inline-block; background: #3b82f6; color: white; 
            padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
    Update Documents
  </a>
  
  <p>Best regards,<br>Helparo Team</p>
</div>
```

**Code Location:** `src/app/api/send-email/route.ts`

---

### **Step 8: Welcome Bonus System (₹50 Auto-Credit)**

**Trigger:** When `is_verified` changes from FALSE → TRUE in `profiles` table

**Function:** `grant_welcome_bonus()` (PostgreSQL trigger function)

**Tables Involved:**
- `public.wallet_accounts` - User wallet balances
- `public.user_bonuses` - Bonus transaction records

#### 8.1 Create/Update Wallet
```sql
-- Create wallet if doesn't exist
INSERT INTO public.wallet_accounts (
  user_id,                     -- Helper user ID
  available_balance,           -- 0 (initial)
  escrow_balance,              -- 0 (initial)
  currency,                    -- 'INR'
  created_at,                  -- NOW()
  updated_at                   -- NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Add welcome bonus to wallet (₹50 = 5000 paise)
UPDATE public.wallet_accounts SET
  available_balance = available_balance + 50.00,
  updated_at = NOW()
WHERE user_id = {helper_id};
```

#### 8.2 Record Bonus Transaction
```sql
INSERT INTO public.user_bonuses (
  id,                          -- UUID (generated)
  user_id,                     -- Helper user ID
  bonus_type,                  -- 'welcome'
  amount,                      -- 50.00 DECIMAL(10,2)
  status,                      -- 'credited'
  description,                 -- 'Welcome bonus - Thank you for joining Helparo!'
  credited_at,                 -- NOW()
  expires_at,                  -- NULL (no expiry)
  created_at,                  -- NOW()
  updated_at                   -- NOW()
) VALUES (...);
```

**Bonus Types:**
- `welcome` - ₹50 on verification
- `referral` - Referral bonuses
- `campaign` - Marketing campaigns
- `loyalty` - Loyalty rewards
- `promotion` - Special promotions

**Code Location:** `supabase/migrations/030_welcome_bonus.sql`

**Database Trigger:**
```sql
CREATE TRIGGER trigger_welcome_bonus
  AFTER INSERT OR UPDATE OF is_verified ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_welcome_bonus();
```

---

### **Step 9: Helper Dashboard Access**

**Action:** Helper logs in and accesses dashboard

**Verification Status Check:**
```sql
SELECT 
  hp.verification_status,
  hp.is_approved,
  p.is_verified
FROM public.helper_profiles hp
INNER JOIN public.profiles p ON p.id = hp.user_id
WHERE hp.user_id = {user_id};
```

**Dashboard Access Rules:**
- `verification_status = 'pending'` → Show "Verification Pending" message
- `verification_status = 'rejected'` → Show rejection reason + "Update Documents" button
- `verification_status = 'approved' AND is_approved = TRUE` → Full dashboard access

**Code Location:** `src/app/helper/dashboard/page.tsx`

---

## 📊 Database Tables Summary

### Authentication & User Management

#### 1. `auth.users` (Supabase Built-in)
- Purpose: Store authentication credentials
- Key Columns: `id`, `email`, `encrypted_password`, `email_confirmed_at`, `raw_user_meta_data`

#### 2. `public.profiles`
- Purpose: Extended user information
- Key Columns: `id`, `email`, `role`, `full_name`, `phone`, `is_verified`, `status`, `is_banned`
- Triggers: `handle_new_user()` - Creates profile when auth user created

### Helper-Specific Tables

#### 3. `public.helper_profiles`
- Purpose: Helper professional details and verification status
- Key Columns: 
  - Professional: `service_categories`, `skills`, `experience_years`, `hourly_rate`
  - Location: `address`, `pincode`, `service_area_ids`, `latitude`, `longitude`
  - Availability: `working_hours`, `is_available_now`, `emergency_availability`
  - Verification: `verification_status`, `is_approved`, `verified_by`, `verified_at`, `rejection_reason`
- UNIQUE: `user_id` (one profile per helper)

#### 4. `public.verification_documents`
- Purpose: Store document metadata for KYC verification
- Key Columns: `helper_id`, `document_type`, `document_number`, `document_url`, `selfie_url`, `status`, `verified_by`, `rejection_reason`
- Storage: Files stored in `kyc` bucket

#### 5. `public.helper_bank_accounts`
- Purpose: Helper payout/withdrawal bank account details
- Key Columns: `helper_id`, `account_holder_name`, `account_number`, `ifsc_code`, `bank_name`, `upi_id`, `is_primary`, `status`
- UNIQUE: `(helper_id, is_primary)` - One primary account per helper

### Financial Tables

#### 6. `public.wallet_accounts`
- Purpose: Store user wallet balances
- Key Columns: `user_id`, `available_balance`, `escrow_balance`, `currency`, `total_credited`, `total_debited`
- UNIQUE: `user_id` (one wallet per user)

#### 7. `public.user_bonuses`
- Purpose: Track all bonus credits (welcome, referral, campaigns)
- Key Columns: `user_id`, `bonus_type`, `amount`, `status`, `description`, `credited_at`, `expires_at`
- Triggers: `trigger_welcome_bonus` on `profiles.is_verified`

#### 8. `public.job_earnings`
- Purpose: Track earnings per completed service job
- Key Columns: `request_id`, `helper_id`, `gross_amount_paise`, `commission_paise`, `net_amount_paise`, `status`

#### 9. `public.withdrawal_requests`
- Purpose: Helper withdrawal/payout requests
- Key Columns: `helper_id`, `amount_paise`, `status`, `bank_account_id`, `payout_mode`, `approved_by`, `paid_at`

### Notification System

#### 10. `public.notifications`
- Purpose: In-app notifications for users
- Key Columns: `user_id`, `title`, `message`, `type`, `action_url`, `priority`, `is_read`
- Types: `verification_pending`, `verification_approved`, `verification_rejected`, etc.

### Service Areas

#### 11. `public.service_areas`
- Purpose: Hierarchical service area structure (State → District → City → Area)
- Key Columns: `id`, `name`, `slug`, `level`, `parent_id`, `is_active`
- Levels: `state`, `district`, `city`, `area`

---

## 🔐 Row Level Security (RLS) Policies

### Helper Profiles
```sql
-- Helpers can view/update own profile
CREATE POLICY "Helpers can view own helper profile"
  ON helper_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Helpers can update own helper profile"
  ON helper_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Customers can view approved helpers only
CREATE POLICY "Customers can view approved helpers"
  ON helper_profiles FOR SELECT
  USING (is_approved = TRUE AND verification_status = 'approved');

-- Admins can view all helper profiles
CREATE POLICY "Admins can view all helper profiles"
  ON helper_profiles FOR SELECT
  USING (is_admin(auth.uid()));
```

### Verification Documents
```sql
-- Helpers manage own documents
CREATE POLICY "Users manage own verification docs"
  ON verification_documents FOR ALL
  USING (helper_id = auth.uid());

-- Admins view all documents
CREATE POLICY "Admins view all verification docs"
  ON verification_documents FOR SELECT
  USING (is_admin(auth.uid()));
```

### Storage Bucket (KYC)
```sql
-- Helpers upload to own folder
CREATE POLICY "KYC owners write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc' AND 
    storage.foldername(name)[1] = auth.uid()::text
  );

-- Helpers read own files
CREATE POLICY "KYC owners read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc' AND 
    storage.foldername(name)[1] = auth.uid()::text
  );

-- Admins read all kyc files
CREATE POLICY "KYC admins read all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc' AND is_admin(auth.uid()));
```

---

## 🎯 Key Server Actions

### 1. `completeHelperOnboarding()`
**File:** `src/app/actions/onboarding.ts`

**Purpose:** Save all onboarding data and notify admins

**Input:**
```typescript
{
  service_categories: string[]
  skills: string[]
  experience_years: number
  hourly_rate: number
  address: string
  pincode: string
  service_area_ids: string[]
  working_hours: object
  bank_account: {
    account_number: string
    ifsc_code: string
    upi_id: string
  }
}
```

**Process:**
1. Upsert `helper_profiles` table
2. Upsert `helper_bank_accounts` table
3. Get all admin users
4. Insert notifications for each admin
5. Return success message

### 2. `verifyHelper()`
**File:** `src/app/actions/onboarding.ts`

**Purpose:** Admin approve/reject helper verification

**Input:**
```typescript
{
  helperId: string
  action: 'approve' | 'reject'
  rejectionReason?: string
}
```

**Process:**
1. Update `helper_profiles.verification_status` and `is_approved`
2. Update `verification_documents.status`
3. Update `profiles.is_verified` (triggers welcome bonus!)
4. Create notification for helper
5. Send email via `/api/send-email`
6. Return success message

### 3. `uploadOnboardingDocuments()`
**File:** `src/app/actions/helper-verification.ts`

**Purpose:** Upload KYC documents during onboarding

**Input:** FormData with files:
- `id_proof` (required)
- `photo` (required)
- `professional_cert` (optional)
- `address_proof` (optional)

**Process:**
1. Validate files (size, type)
2. Upload to storage bucket `kyc/{user_id}/filename`
3. Insert record in `verification_documents` table
4. Update `helper_profiles.verification_status = 'pending'`
5. Return success

---

## 📧 Email Notification System

### Setup
- **Service:** Nodemailer
- **Provider:** Gmail SMTP
- **From:** helparonotifications@gmail.com
- **Port:** 587 (TLS)

### Email Templates

#### Verification Approved
- **Subject:** "🎉 Verification Approved!"
- **Color Theme:** Green (#10b981)
- **CTA Button:** "Go to Dashboard" → `/helper/dashboard`
- **Content:** Congratulations message + features list

#### Verification Rejected
- **Subject:** "❌ Verification Rejected"
- **Color Theme:** Red (#ef4444)
- **CTA Button:** "Update Documents" → `/helper/verification`
- **Content:** Rejection reason + instructions

### API Endpoint
```typescript
POST /api/send-email
Content-Type: application/json

{
  "to": "helper@example.com",
  "subject": "Verification Approved",
  "html": "<html>...</html>"
}
```

**Code Location:** `src/app/api/send-email/route.ts`

---

## 🎁 Welcome Bonus Details

### Amount
₹50.00 (5000 paise in database)

### Trigger Condition
```sql
-- Triggers when is_verified changes from FALSE → TRUE
NEW.is_verified = TRUE AND (OLD IS NULL OR OLD.is_verified = FALSE)
```

### Process
1. Check if welcome bonus already granted (prevent duplicates)
2. Create wallet if doesn't exist
3. Add ₹50 to `wallet_accounts.available_balance`
4. Insert record in `user_bonuses` table

### Database Function
```sql
CREATE FUNCTION public.grant_welcome_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if already granted
  IF EXISTS (SELECT 1 FROM user_bonuses WHERE user_id = NEW.id AND bonus_type = 'welcome') THEN
    RETURN NEW;
  END IF;
  
  -- Create wallet
  INSERT INTO wallet_accounts (user_id, available_balance, currency)
  VALUES (NEW.id, 0, 'INR') ON CONFLICT DO NOTHING;
  
  -- Credit bonus
  UPDATE wallet_accounts SET available_balance = available_balance + 50.00 WHERE user_id = NEW.id;
  
  -- Record transaction
  INSERT INTO user_bonuses (user_id, bonus_type, amount, status, description, credited_at)
  VALUES (NEW.id, 'welcome', 50.00, 'credited', 'Welcome bonus', NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔍 Verification Status Flow

```
┌─────────────┐
│ not_started │ (No helper_profiles record)
└──────┬──────┘
       │ Helper completes onboarding
       ↓
┌─────────┐
│ pending │ (Waiting for admin review)
└────┬────┘
     │
     ├──→ Admin Approves
     │    ├─ verification_status = 'approved'
     │    ├─ is_approved = TRUE
     │    ├─ is_verified = TRUE (in profiles)
     │    └─ Welcome bonus credited ✅
     │
     └──→ Admin Rejects
          ├─ verification_status = 'rejected'
          ├─ is_approved = FALSE
          ├─ is_verified = FALSE
          └─ Rejection reason stored
```

---

## 📱 Admin Dashboard - User Management

### Filters
- **Role Filter:** All / Customers / Helpers / Admins
- **Status Filter:** All / Active / Suspended / Inactive / Banned

### Helper Status Badges

#### Incomplete Onboarding
```typescript
// Condition: role = 'helper' AND no helper_profiles record
<Badge color="gray">
  <AlertCircle /> Incomplete Onboarding
</Badge>
```

#### Pending Approval
```typescript
// Condition: helper_profiles exists AND is_approved = FALSE
<Badge color="yellow">
  <AlertCircle /> Pending Approval
</Badge>
```

#### Approved
```typescript
// Condition: is_approved = TRUE AND verification_status = 'approved'
<Badge color="green">
  <CheckCircle /> Approved
</Badge>
```

### Admin Actions
- **Approve Button:** Shows only for pending helpers
- **Suspend/Activate:** Toggle account status
- **Ban/Unban:** Permanent or temporary ban
- **View:** Navigate to user detail page

**Code Location:** `src/app/admin/users/page.tsx`

---

## 🚀 Deployment Checklist

### 1. Install Dependencies
```bash
npm install nodemailer @types/nodemailer
```

### 2. Deploy Database Migrations
```bash
# Run in Supabase SQL Editor or via CLI
supabase/migrations/030_welcome_bonus.sql
supabase/migrations/031_fix_storage_rls.sql
```

### 3. Configure Environment Variables
```env
# .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=helparonotifications@gmail.com
SMTP_PASSWORD=ihyb xove jfeq yobb
FROM_EMAIL=helparonotifications@gmail.com
FROM_NAME=Helparo Team
NEXT_PUBLIC_APP_URL=https://helparo.vercel.app
```

### 4. Test Flow
1. ✅ Create new helper account
2. ✅ Complete 5-step onboarding
3. ✅ Verify data saved to all tables
4. ✅ Check admin receives notification
5. ✅ Admin approves helper
6. ✅ Verify email sent to helper
7. ✅ Verify ₹50 bonus credited to wallet
8. ✅ Helper can access dashboard

---

## 📊 Database Diagram

```
auth.users
    ↓ (trigger: handle_new_user)
profiles (id, email, role, is_verified)
    ↓
    ├─→ helper_profiles (user_id, verification_status, is_approved)
    │       ↓
    │   verification_documents (helper_id, document_type, status)
    │
    ├─→ helper_bank_accounts (helper_id, account_number, upi_id)
    │
    ├─→ wallet_accounts (user_id, available_balance)
    │       ↑ (trigger: grant_welcome_bonus)
    │       └─→ user_bonuses (user_id, bonus_type, amount)
    │
    └─→ notifications (user_id, title, message, type)
```

---

## 🎯 Success Metrics

### For Helpers
- ✅ Complete onboarding in < 10 minutes
- ✅ Receive verification decision within 24-48 hours
- ✅ Get ₹50 welcome bonus immediately on approval
- ✅ Access full dashboard after approval

### For Admins
- ✅ Get notified instantly when helper completes onboarding
- ✅ Review all documents in one place
- ✅ Approve/reject with one click
- ✅ Automatic email notifications to helpers

### For System
- ✅ All data saved to correct tables
- ✅ RLS policies enforce security
- ✅ Welcome bonus auto-credited via trigger
- ✅ Email notifications sent reliably
- ✅ No data loss or inconsistencies

---

## 📝 Notes

1. **Welcome Bonus Trigger:** Only fires when `is_verified` changes from FALSE → TRUE
2. **Document Storage:** Files stored in `kyc` bucket with path `{user_id}/filename`
3. **Admin Notifications:** Created for ALL admins when helper completes onboarding
4. **Email Service:** Uses Gmail SMTP with app-specific password
5. **Verification Flow:** Helper can resubmit documents after rejection
6. **Bank Account:** Helper can add multiple accounts, one marked as primary
7. **Service Areas:** Uses hierarchical structure (State → District → City → Area)
8. **Working Hours:** Stored as JSONB with day-wise start/end times

---

## 🔗 Related Files

### Server Actions
- `src/app/actions/auth.ts` - Authentication
- `src/app/actions/onboarding.ts` - Complete onboarding & verification
- `src/app/actions/helper-verification.ts` - Document upload
- `src/app/actions/bonuses.ts` - Bonus management

### Frontend Pages
- `src/app/helper/onboarding/page.tsx` - 5-step onboarding wizard
- `src/app/helper/dashboard/page.tsx` - Helper dashboard
- `src/app/admin/users/page.tsx` - Admin user management

### API Routes
- `src/app/api/send-email/route.ts` - Email notification endpoint

### Database Migrations
- `supabase/migrations/001_initial_schema.sql` - Base schema
- `supabase/migrations/005_verification.sql` - Verification system
- `supabase/migrations/016_withdrawals.sql` - Financial system
- `supabase/migrations/030_welcome_bonus.sql` - Welcome bonus system
- `supabase/migrations/031_fix_storage_rls.sql` - Storage policies

---

**Document Version:** 1.0  
**Last Updated:** 2024-11-26  
**Author:** Helparo Development Team

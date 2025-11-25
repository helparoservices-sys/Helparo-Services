# Helper Registration & Onboarding Flow Documentation

---

## 🚨 CRITICAL FINDING: INCOMPLETE ONBOARDING

### Current State (What Exists)
The current onboarding flow is **INCOMPLETE**. It only collects:
- ✅ Documents (ID Front, ID Back, Selfie) - 3 files uploaded
- ❌ **Missing 27+ other required fields from `helper_profiles` schema**

### What's Missing
The `helper_profiles` table has **30+ columns**, but currently only **3 fields** are being populated:
1. `user_id` 
2. `verification_status = 'pending'`
3. `is_approved = false`

### What SHOULD Be Collected During Onboarding
The complete onboarding should collect:

**Service Details (5 fields):**
- Service categories
- Skills
- Specialized skills  
- Years of experience
- Hourly rate

**Location & Service Area (6 fields):**
- Full address
- PIN code
- GPS coordinates (latitude/longitude)
- Service radius
- Service areas covered

**Availability (3 fields):**
- Weekly working hours schedule
- Currently available toggle
- Emergency availability toggle

### Required Action
Create a **multi-step onboarding wizard** at `/helper/verification` with 4 steps:
1. **Step 1:** Document Upload (exists) ✅
2. **Step 2:** Service Details (needs creation) ❌
3. **Step 3:** Location & Service Area (needs creation) ❌
4. **Step 4:** Availability & Schedule (needs creation) ❌

---

## Complete Flow Overview

```
1. Registration (Signup)
   ↓
2. Email Verification
   ↓
3. Login
   ↓
4. Legal Consent (if needed)
   ↓
5. Dashboard (with verification alert)
   ↓
6. Verification & Document Upload
   ↓
7. Full Portal Access
```

---

## STEP 1: REGISTRATION (SIGNUP)

### Page: `/auth/signup`
**File:** `src/app/auth/signup/page.tsx`

### User Actions:
1. User visits signup page
2. Selects role: **"Offer Services"** (Helper) or "Find Services" (Customer)
3. Fills form:
   - Full Name
   - Email
   - Phone Number (with country code: +1, +44, +91, etc.)
   - Password (must meet strength requirements)
   - Confirm Password
   - Accept Terms & Conditions and Privacy Policy

### Password Requirements:
- ✓ At least 8 characters
- ✓ One uppercase letter
- ✓ One lowercase letter
- ✓ One number
- ✓ One special character (!@#$%^&*)

### What Happens on Submit:
1. **Supabase Auth Signup** called with:
   ```javascript
   supabase.auth.signUp({
     email: formData.email,
     password: formData.password,
     options: {
       data: {
         full_name: formData.fullName,
         phone: formData.phone,
         country_code: formData.countryCode,
         role: 'helper'  // Important!
       },
       emailRedirectTo: '/auth/callback'
     }
   })
   ```

2. **Database Trigger Fires** (automatic):
   - **Trigger:** `on_auth_user_created` (in `001_initial_schema.sql`)
   - **Function:** `handle_new_user()`
   - **Action:** Creates entry in `profiles` table with:
     ```sql
     INSERT INTO profiles (
       id,           -- User UUID from auth.users
       email,        -- User email
       role,         -- 'helper' (from signup metadata)
       full_name,    -- From form
       phone,        -- From form
       country_code, -- From form (default: '+1')
       is_verified   -- false (default)
     )
     ```

3. **Email Sent**: Verification email sent to user's email address

4. **Success Screen Shown**:
   - "Check Your Email" message
   - Email address displayed
   - "Go to Login" button

### Database State After Signup:
- ✅ `auth.users` table: User created
- ✅ `profiles` table: Profile created with role='helper'
- ✅ `helper_profiles` table: **Auto-created on first login/dashboard access** ⭐

**Note:** Previously, `helper_profiles` was only created during verification document upload, causing "Helper profile not found" errors on first login. This has been FIXED - the profile is now automatically created when the helper first accesses the dashboard.

---

## STEP 2: EMAIL VERIFICATION

### User Actions:
1. User opens email inbox
2. Clicks verification link in email
3. Redirected to `/auth/callback?code=...`

### What Happens:
**File:** `src/app/auth/callback/route.ts`

1. **Exchange code for session**:
   ```javascript
   await supabase.auth.exchangeCodeForSession(code)
   ```

2. **Check Legal Consent**:
   - Fetches latest active Terms & Conditions
   - Fetches latest Privacy Policy
   - Checks if user has accepted current versions
   - If not accepted → Redirect to `/legal/consent`
   - If accepted → Continue

3. **Role-Based Redirect**:
   - Fetches user's role from `profiles` table
   - For helper: Redirects to `/helper/dashboard`

---

## STEP 3: FIRST LOGIN (IF EMAIL ALREADY VERIFIED)

### Page: `/auth/login`
**File:** `src/app/auth/login/page.tsx`

### User Actions:
1. Enter email and password
2. Click "Sign In"

### What Happens:
1. **Supabase Auth Login** called
2. **Middleware Check** (`src/middleware.ts`):
   - Verifies user authentication
   - Fetches role from `profiles` table
   - If role = 'helper' → Redirects to `/helper/dashboard`
   - If role = 'customer' → Redirects to `/customer/dashboard`
   - If role = 'admin' → Redirects to `/admin/dashboard`

---

## STEP 4: HELPER DASHBOARD (FIRST VIEW)

### Page: `/helper/dashboard`
**File:** `src/app/helper/dashboard/page.tsx`

### What User Sees:

#### Verification Alert (if not approved):
```
⚠️ Your account is not verified yet
Complete your profile verification to start receiving job requests
[Complete Verification] button → Links to /helper/verification
```

### Dashboard Sections:
1. **Stats Cards** (4 cards):
   - Today's Earnings: ₹0
   - Active Jobs: 0
   - Average Rating: 0.0
   - Completed Jobs: 0

2. **Earnings Overview**:
   - This Week: ₹0
   - This Month: ₹0
   - Pending: ₹0

3. **Recent Jobs**: Empty state (no jobs yet)

4. **Upcoming Jobs**: Empty state (no upcoming jobs)

5. **Quick Actions** (6 buttons):
   - Browse Requests → `/helper/requests`
   - My Jobs → `/helper/assigned`
   - **Complete Verification** → `/helper/verification` ⭐
   - Update Services → `/helper/services`
   - Manage Schedule → `/helper/availability`
   - View Earnings → `/helper/wallet`

### Database State:
- ✅ `profiles` table: User exists with role='helper'
- ✅ `helper_profiles` table: **Auto-created with minimal data** ⭐
  ```sql
  {
    user_id: {helper_uuid},
    verification_status: 'pending',
    is_approved: false,
    -- All other fields NULL or default values
  }
  ```
- ⚠️ Helper can view dashboard but cannot receive job assignments until verified

---

## STEP 5: VERIFICATION & DOCUMENT UPLOAD (ONBOARDING)

### Page: `/helper/verification`
**File:** `src/app/helper/verification/page.tsx`

---

### 🚨 CURRENT STATE (INCOMPLETE ONBOARDING)

**What Currently Happens:**
Currently, the verification page ONLY collects:
- ✅ ID Front (document upload)
- ✅ ID Back (document upload)
- ✅ Selfie with ID (document upload)

**What Gets Created in Database:**
```sql
INSERT INTO helper_profiles (
  user_id,
  verification_status,  -- 'pending'
  is_approved           -- false
)
-- ONLY 3 fields! Missing 27+ other fields!
```

---

### ✅ COMPLETE ONBOARDING (WHAT SHOULD HAPPEN)

**The onboarding flow should collect ALL helper information in multiple steps:**

#### **STEP 5A: Document Upload** (Currently exists)
- ID Front (required)
- ID Back (optional)
- Selfie with ID (required)

#### **STEP 5B: Service Details** (MISSING - needs to be created)
Form should collect:
1. **Service Categories** (multi-select):
   - Plumbing, Electrical, Carpentry, Cleaning, etc.
   - Example: `['plumbing', 'electrical']`

2. **Skills** (tags/chips input):
   - General skills within categories
   - Example: `['pipe_repair', 'wiring', 'fixture_installation']`

3. **Specialized Skills** (optional tags):
   - Advanced/specialized skills
   - Example: `['solar_panel_installation', 'smart_home_automation']`

4. **Years of Experience** (number input):
   - Total years working in this field
   - Example: `5` years

5. **Hourly Rate** (currency input):
   - Default rate charged per hour
   - Example: `₹500` per hour

#### **STEP 5C: Location & Service Area** (MISSING - needs to be created)
Form should collect:
1. **Full Address** (text area):
   - Complete address with building/apartment
   - Example: "123, Sunshine Apartments, MG Road"

2. **PIN Code** (input):
   - Area PIN/ZIP code
   - Example: "400001"

3. **Location** (map picker OR auto-detect):
   - Latitude and Longitude
   - Example: `19.0760, 72.8777`

4. **Service Radius** (slider):
   - How far willing to travel (in km)
   - Example: `15 km`

5. **Service Areas** (multi-select dropdown):
   - Specific localities/areas covered
   - Example: `['Andheri', 'Bandra', 'Juhu', 'Versova']`

#### **STEP 5D: Availability & Schedule** (MISSING - needs to be created)
Form should collect:
1. **Working Hours** (weekly schedule picker):
   - Select days and time slots
   - Example:
     ```json
     {
       "monday": {"start": "09:00", "end": "18:00", "available": true},
       "tuesday": {"start": "09:00", "end": "18:00", "available": true},
       "wednesday": {"start": "09:00", "end": "18:00", "available": true},
       "thursday": {"start": "09:00", "end": "18:00", "available": true},
       "friday": {"start": "09:00", "end": "18:00", "available": true},
       "saturday": {"start": "10:00", "end": "16:00", "available": true},
       "sunday": {"start": "00:00", "end": "00:00", "available": false}
     }
     ```

2. **Currently Available** (toggle):
   - Are you available to take jobs right now?
   - Default: `true`

3. **Emergency Availability** (toggle):
   - Available for emergency/urgent jobs?
   - Default: `false`

---

### What Database Should Contain After COMPLETE Onboarding:

```sql
INSERT INTO helper_profiles (
  -- Core
  user_id,
  verification_status,        -- 'pending'
  is_approved,                -- false
  
  -- Service Details (from Step 5B)
  service_categories,         -- ['plumbing', 'electrical']
  skills,                     -- ['pipe_repair', 'wiring']
  skills_specialization,      -- ['solar_installation']
  experience_years,           -- 5
  hourly_rate,                -- 500.00
  
  -- Location (from Step 5C)
  address,                    -- "123 Sunshine Apartments, MG Road"
  pincode,                    -- "400001"
  latitude,                   -- 19.0760
  longitude,                  -- 72.8777
  service_radius_km,          -- 15
  service_areas,              -- ['Andheri', 'Bandra', 'Juhu']
  
  -- Availability (from Step 5D)
  working_hours,              -- JSONB weekly schedule
  is_available_now,           -- true
  emergency_availability,     -- false
  
  -- Auto-calculated (system sets defaults)
  rating_sum,                 -- 0
  rating_count,               -- 0
  total_jobs_completed,       -- 0
  response_rate_percent,      -- 100.0
  completion_rate_percent,    -- 100.0
  average_response_minutes    -- NULL
)
```

---

### Current UI (What Exists):

### What User Sees:

#### Verification Status Card:
```
┌─────────────────────────────────────┐
│ Verification Status                  │
│                                      │
│ Status: Not Started                  │
│ Upload documents to get verified     │
└─────────────────────────────────────┘
```

#### Upload Documents Card:

**Document Guidelines:**
- Accepted formats: JPG, PNG, PDF
- Maximum file size: 10MB per file
- Documents must be valid and not expired
- Clear and readable images required

**Required Documents:**

1. **ID Front** (Required) ⭐
   - Upload government-issued ID (front side)
   - Passport, Driver's License, or National ID
   - File input field

2. **ID Back** (Optional)
   - Upload ID back side if applicable
   - File input field

3. **Selfie with ID** (Required) ⭐
   - Upload selfie holding your ID
   - Face and ID must be clearly visible
   - File input field

**Submit Button**: "Submit Documents"

### User Actions:
1. Click "Choose File" for ID Front
2. Select image/PDF file
3. (Optional) Upload ID Back
4. Click "Choose File" for Selfie
5. Select selfie photo
6. Click "Submit Documents"

### What Happens on Submit:

**Action File:** `src/app/actions/helper-verification.ts`

1. **Authentication Check**:
   ```javascript
   requireAuth(UserRole.HELPER)
   ```

2. **File Validation**:
   - Check file size (max 10MB)
   - Check MIME type (image/jpeg, image/png, application/pdf)
   - Sanitize filename

3. **Upload to Supabase Storage**:
   - Bucket: `kyc`
   - Path: `{user_id}/{sanitized_filename}`
   - Files stored securely

4. **Database Entries Created**:

   **Table: `verification_documents`** (for EACH file):
   ```sql
   INSERT INTO verification_documents (
     user_id,              -- Helper's UUID
     doc_type,             -- 'id_front', 'id_back', or 'selfie'
     file_path,            -- 'user_id/filename.jpg'
     file_size,            -- File size in bytes
     mime_type,            -- 'image/jpeg' etc.
     original_filename,    -- Original file name
     status                -- 'pending'
   )
   ```

5. **Create/Update Helper Profile**:

   **Table: `helper_profiles`** ⭐ **CREATED HERE**:
   ```sql
   INSERT INTO helper_profiles (
     user_id,              -- Helper's UUID
     verification_status,  -- 'pending'
     is_approved          -- false
   )
   ON CONFLICT (user_id) DO UPDATE
   SET verification_status = 'pending',
       is_approved = false
   ```

6. **Success Response**:
   - Toast notification: "Verification documents submitted successfully"
   - Page refreshed
   - Status changes to "Pending"

### Database State After Upload:
- ✅ `profiles` table: User with role='helper'
- ✅ `helper_profiles` table: **NOW CREATED** with verification_status='pending'
- ✅ `verification_documents` table: 2-3 documents with status='pending'
- ✅ Supabase Storage (`kyc` bucket): Files uploaded

### Verification Status Card (After Upload):
```
┌─────────────────────────────────────┐
│ Verification Status                  │
│                                      │
│ Status: ⏱️ Pending Review            │
│ We are reviewing your documents.     │
│ This usually takes 24-48 hours       │
│                                      │
│ Uploaded Documents:                  │
│ • ID Front        [⏱️ Pending]       │
│ • Selfie with ID  [⏱️ Pending]       │
└─────────────────────────────────────┘
```

---

## STEP 6: ADMIN VERIFICATION (BACKEND PROCESS)

### Page: `/admin/applications` or `/admin/verification`
**Admin reviews documents**

### Admin Actions:
1. Views uploaded documents
2. Verifies authenticity
3. Updates status to:
   - ✅ **Approved** → Helper can start working
   - ❌ **Rejected** → Helper must re-upload

### Database Updates:
```sql
UPDATE helper_profiles
SET verification_status = 'approved',
    is_approved = true
WHERE user_id = '{helper_id}'

UPDATE verification_documents
SET status = 'approved'
WHERE user_id = '{helper_id}'
```

---

## STEP 7: FULL ACCESS GRANTED

### Helper Dashboard (After Approval):
```
┌─────────────────────────────────────┐
│ ✅ Your account is verified!         │
│ You can now start accepting jobs     │
└─────────────────────────────────────┘
```

### Full Portal Access:

#### 1. Browse Requests (`/helper/requests`):
- View service requests from customers
- Filter by category, location, budget
- Submit bids on requests

#### 2. Assigned Jobs (`/helper/assigned`):
- View assigned jobs
- Update job status
- Track time
- Complete jobs

#### 3. Services & Pricing (`/helper/services`):
- Select service categories
- Set hourly rates (₹100-10,000)
- Set experience level
- Toggle availability

#### 4. Wallet & Earnings (`/helper/wallet`):
- View balance
- Track earnings (today/week/month)
- Request withdrawals (min ₹100)
- View transaction history

#### 5. Ratings & Reviews (`/helper/ratings`):
- View customer ratings
- Read reviews
- Respond to reviews

#### 6. Additional Features:
- Time Tracking
- Subscriptions (Basic/Pro/Enterprise)
- SOS & Safety
- Gamification & Badges
- Notifications
- Trust Score
- Video Calls
- Referrals & Rewards

---

## DATABASE SCHEMA SUMMARY

### Tables Involved:

#### 1. `auth.users` (Supabase Auth)
- Created during signup
- Stores authentication data

#### 2. `profiles`
- Created by trigger after signup
- **Columns used:**
  - `id` (UUID) - User ID
  - `email` (TEXT) - Email address
  - `role` (user_role) - 'helper'
  - `full_name` (TEXT) - Full name
  - `phone` (TEXT) - Phone number
  - `country_code` (TEXT) - Country code
  - `is_verified` (BOOLEAN) - false until verified
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

#### 3. `helper_profiles` ⭐ **ONBOARDING TABLE**
- **Created during verification document upload**
- **COMPLETE SCHEMA (30+ columns):**

**Core Identity:**
  - `id` (UUID) - Profile ID
  - `user_id` (UUID) - References profiles.id (UNIQUE)
  - `verification_status` (verification_status) - 'pending' → 'approved'/'rejected'
  - `is_approved` (BOOLEAN) - false → true after admin approval
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

**Service Details (collected in onboarding):**
  - `service_categories` (TEXT[]) - Array of service categories
  - `skills` (TEXT[]) - Skills array
  - `skills_specialization` (TEXT[]) - Specialized skills
  - `experience_years` (INTEGER) - Total years of experience
  - `years_of_experience` (INTEGER) - Duplicate field
  - `hourly_rate` (NUMERIC) - Default hourly rate

**Location & Service Area (collected in onboarding):**
  - `address` (TEXT) - Full address
  - `pincode` (VARCHAR(10)) - PIN/ZIP code
  - `latitude` (NUMERIC) - GPS latitude
  - `longitude` (NUMERIC) - GPS longitude
  - `service_radius` (INTEGER) - Service radius in km (default: 10)
  - `service_radius_km` (INTEGER) - Duplicate field
  - `service_areas` (TEXT[]) - Array of service areas

**Availability (collected in onboarding):**
  - `working_hours` (JSONB) - Weekly schedule with start/end times per day
    ```json
    {
      "monday": {"start": "09:00", "end": "18:00", "available": true},
      "tuesday": {"start": "09:00", "end": "18:00", "available": true},
      ...
    }
    ```
  - `is_available_now` (BOOLEAN) - Currently available (default: true)
  - `emergency_availability` (BOOLEAN) - Available for emergencies (default: false)

**Performance Metrics (auto-calculated):**
  - `rating_sum` (INTEGER) - Sum of all ratings (default: 0)
  - `rating_count` (INTEGER) - Number of ratings (default: 0)
  - `total_jobs_completed` (INTEGER) - Completed jobs count (default: 0)
  - `response_rate_percent` (NUMERIC) - Response rate % (default: 100)
  - `completion_rate_percent` (NUMERIC) - Completion rate % (default: 100)
  - `average_response_minutes` (INTEGER) - Average response time

#### 4. `verification_documents`
- Created during document upload
- **Columns:**
  - `id` (UUID) - Document ID
  - `user_id` (UUID) - Helper's ID
  - `doc_type` (TEXT) - 'id_front', 'id_back', 'selfie'
  - `file_path` (TEXT) - Storage path
  - `file_size` (INTEGER) - File size in bytes
  - `mime_type` (TEXT) - File MIME type
  - `original_filename` (TEXT) - Original name
  - `status` (TEXT) - 'pending' → 'approved'/'rejected'
  - `created_at` (TIMESTAMP)

---

## COMPLETE FLOW DIAGRAM

```
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: SIGNUP (/auth/signup)                                   │
├────────────────────────────────────────────────────────────────┤
│ Input: Email, Password, Name, Phone, Role='helper'              │
│ Action: supabase.auth.signUp()                                  │
│ Trigger: handle_new_user() → Creates profiles record            │
│ Database: auth.users ✓, profiles ✓ (role='helper')              │
│ Next: Email sent → "Check Your Email" screen                    │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 2: EMAIL VERIFICATION                                       │
├────────────────────────────────────────────────────────────────┤
│ User clicks link → /auth/callback?code=xxx                      │
│ Action: exchangeCodeForSession()                                │
│ Check: Legal consent required?                                  │
│ Redirect: /helper/dashboard                                     │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 3: FIRST DASHBOARD VIEW (/helper/dashboard)                │
├────────────────────────────────────────────────────────────────┤
│ Show: ⚠️ Verification Alert                                     │
│ Stats: All zeros (no data yet)                                  │
│ Action Button: "Complete Verification"                          │
│ Database: helper_profiles NOT created yet                       │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 4: VERIFICATION PAGE (/helper/verification) ⭐ ONBOARDING  │
├────────────────────────────────────────────────────────────────┤
│ Show: Upload form for documents                                 │
│ Required: ID Front, Selfie with ID                              │
│ Optional: ID Back                                               │
│                                                                  │
│ User uploads files → Submit                                     │
│                                                                  │
│ Backend Actions:                                                │
│ 1. Validate files (size, type)                                  │
│ 2. Upload to Supabase Storage (kyc bucket)                      │
│ 3. CREATE verification_documents records (2-3 entries)          │
│ 4. CREATE/UPDATE helper_profiles record ⭐ **PROFILE CREATED**  │
│    - user_id: {helper_uuid}                                     │
│    - verification_status: 'pending'                             │
│    - is_approved: false                                         │
│                                                                  │
│ Database After:                                                  │
│ - helper_profiles ✓ (status='pending', approved=false)          │
│ - verification_documents ✓ (2-3 files, status='pending')        │
│ - Storage/kyc ✓ (files uploaded)                                │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 5: PENDING STATE (24-48 hours)                             │
├────────────────────────────────────────────────────────────────┤
│ Dashboard shows: "⏱️ Pending Review"                             │
│ Verification page shows: Documents under review                 │
│ Helper CANNOT receive jobs yet                                  │
│ Database: helper_profiles.is_approved = false                   │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 6: ADMIN APPROVAL (Admin action)                           │
├────────────────────────────────────────────────────────────────┤
│ Admin reviews documents at /admin/applications                  │
│ Admin approves or rejects                                       │
│                                                                  │
│ If APPROVED:                                                    │
│ UPDATE helper_profiles                                          │
│ SET verification_status = 'approved',                           │
│     is_approved = true                                          │
│                                                                  │
│ UPDATE verification_documents                                   │
│ SET status = 'approved'                                         │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 7: FULL ACCESS GRANTED ✅                                  │
├────────────────────────────────────────────────────────────────┤
│ Dashboard shows: "✅ Your account is verified!"                 │
│ Helper can now:                                                 │
│ - Browse service requests (/helper/requests)                    │
│ - Submit bids on jobs                                           │
│ - Get job assignments                                           │
│ - Update services & rates (/helper/services)                    │
│ - Track earnings (/helper/wallet)                               │
│ - Manage time tracking                                          │
│ - Access all 15 helper portal features                          │
│                                                                  │
│ Database: helper_profiles.is_approved = true ✓                  │
└────────────────────────────────────────────────────────────────┘
```

---

## CRITICAL POINTS TO UNDERSTAND

### ⭐ When is `helper_profiles` Created?
**Answer:** During **FIRST document upload** at `/helper/verification`
- NOT during signup
- NOT during email verification
- **ONLY when user submits verification documents**

### ⭐ What Columns are Required in `helper_profiles`?

**MINIMUM fields created during verification upload:**
```sql
user_id              -- UUID (required, unique)
verification_status  -- 'pending' (initially)
is_approved          -- false (initially)
```

**COMPLETE ONBOARDING DATA (should be collected):**

**1. Service Details:**
```sql
service_categories    -- TEXT[] - Which services they offer (e.g., ['plumbing', 'electrical'])
skills                -- TEXT[] - General skills (e.g., ['pipe_repair', 'wiring'])
skills_specialization -- TEXT[] - Specialized skills (e.g., ['solar_installation'])
experience_years      -- INTEGER - Total years of experience (e.g., 5)
hourly_rate           -- NUMERIC - Default hourly rate (e.g., 500.00)
```

**2. Location & Service Area:**
```sql
address               -- TEXT - Full address (e.g., "123 Main St, Apartment 4B")
pincode               -- VARCHAR(10) - PIN code (e.g., "400001")
latitude              -- NUMERIC - GPS latitude (e.g., 19.0760)
longitude             -- NUMERIC - GPS longitude (e.g., 72.8777)
service_radius_km     -- INTEGER - Service radius in km (e.g., 15)
service_areas         -- TEXT[] - Areas covered (e.g., ['Andheri', 'Bandra', 'Juhu'])
```

**3. Availability & Working Hours:**
```sql
working_hours         -- JSONB - Weekly schedule with times per day
is_available_now      -- BOOLEAN - Currently available (default: true)
emergency_availability -- BOOLEAN - Available for emergencies (default: false)
```

**4. Auto-calculated (DO NOT collect, system manages):**
```sql
rating_sum            -- INTEGER - Calculated from reviews
rating_count          -- INTEGER - Calculated from reviews
total_jobs_completed  -- INTEGER - Calculated from jobs
response_rate_percent -- NUMERIC - Calculated from interactions
completion_rate_percent -- NUMERIC - Calculated from jobs
average_response_minutes -- INTEGER - Calculated from response times
```

### ⭐ Can Helper Access Portal Before Verification?
**Yes, but with limitations:**
- ✅ Can view dashboard
- ✅ Can access verification page
- ✅ Can view services page
- ❌ **Cannot receive job requests**
- ❌ **Cannot bid on requests**
- ❌ **Cannot get job assignments**

### ⭐ Flow Summary by Page:

| Page | Database Changes | Helper Can Access? |
|------|------------------|-------------------|
| `/auth/signup` | `profiles` created | ❌ Not logged in |
| Email verification | None | ❌ Not logged in |
| `/helper/dashboard` (first view) | None | ✅ View only, no jobs |
| `/helper/verification` (after upload) | `helper_profiles` **CREATED** ✅<br>`verification_documents` created | ✅ But pending approval |
| After admin approval | `helper_profiles.is_approved = true` | ✅ **FULL ACCESS** |

---

## QUESTIONS & ANSWERS

**Q1: What happens if helper tries to skip verification?**
A: They can view the dashboard but won't receive any job requests. The dashboard shows a prominent alert to complete verification.

**Q2: Which page creates the helper_profiles record?**
A: `/helper/verification` page when documents are uploaded (action: `uploadVerificationDocuments`)

**Q3: What are the required documents?**
A:
- ID Front (required)
- Selfie with ID (required)
- ID Back (optional)

**Q4: Where are files stored?**
A: Supabase Storage bucket named `kyc`, path: `{user_id}/{filename}`

**Q5: How long does verification take?**
A: Typically 24-48 hours (admin manual review)

**Q6: Can helper update services before verification?**
A: Yes, they can access `/helper/services` page, but changes won't be effective until verification is approved.

**Q7: What columns should be in helper_profiles after COMPLETE onboarding?**
A: **30+ columns in total:**
```
Core (verification):
- user_id, verification_status='pending', is_approved=false

Service Details (should collect):
- service_categories[], skills[], skills_specialization[]
- experience_years, hourly_rate

Location (should collect):
- address, pincode, latitude, longitude
- service_radius_km, service_areas[]

Availability (should collect):
- working_hours (JSONB with weekly schedule)
- is_available_now, emergency_availability

Auto-calculated (system managed):
- rating_sum, rating_count, total_jobs_completed
- response_rate_percent, completion_rate_percent
- average_response_minutes
```

**Q8: Which page do helpers see after first login?**
A: `/helper/dashboard` with verification alert

---

## FILES REFERENCE

### Frontend Pages:
- `src/app/auth/signup/page.tsx` - Registration form
- `src/app/auth/login/page.tsx` - Login form
- `src/app/auth/callback/route.ts` - Email verification handler
- `src/app/helper/dashboard/page.tsx` - Dashboard with verification alert
- `src/app/helper/verification/page.tsx` - **⭐ ONBOARDING PAGE** (document upload)

### Backend Actions:
- `src/app/actions/helper-verification.ts` - **⭐ Creates helper_profiles**
- `src/app/actions/helper-dashboard.ts` - Dashboard data

### Database:
- `supabase/migrations/001_initial_schema.sql` - Core tables & trigger
- `supabase/migrations/005_verification.sql` - Verification documents table

### Middleware:
- `src/middleware.ts` - Route protection & role-based redirects

---

**Generated:** November 25, 2025
**Version:** 1.0
**Status:** Complete and Accurate

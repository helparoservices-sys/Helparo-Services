# SOS & Trust-Safety Pages - Database Tables Reference

## 📊 SOS PAGE (`/admin/sos`)

### Tables Used:
1. **`sos_alerts`** - Main table for emergency alerts
   - Columns: id, user_id, alert_type, status, latitude, longitude, address, description, contact_phone
   - Status types: `active`, `acknowledged`, `resolved`, `false_alarm`, `cancelled`
   - Alert types: `emergency`, `safety_concern`, `dispute`, `harassment`, `other`

### RPC Function:
- **`get_active_sos_alerts()`** - Fetches active/acknowledged alerts with calculated time elapsed

### Sample Data Structure:
```sql
-- Active Emergency Alert
{
  id: uuid,
  user_id: uuid,
  alert_type: 'emergency',
  status: 'active',
  latitude: 28.6139,
  longitude: 77.2090,
  address: 'Connaught Place, New Delhi',
  description: 'Need immediate help!',
  contact_phone: '+91-9876543210',
  created_at: timestamp
}
```

---

## 🛡️ TRUST & SAFETY PAGE (`/admin/trust-safety`)

### Tables Used:

#### 1. **`background_check_results`** (Background Checks Tab)
   - Columns: id, helper_id, check_type, status, verification_score, verified_at, expires_at
   - Check types: `identity`, `criminal`, `address`, `employment`, `references`, `driving_license`
   - Status types: `pending`, `in_progress`, `verified`, `rejected`, `expired`
   - Verification score: 0-100

#### 2. **`helper_trust_scores`** (Trust Scores Tab)
   - Columns: helper_id, trust_score (overall_score), status, verification_level, updated_at
   - Trust score: 0-100 (calculated from multiple factors)
   - Status: `active`, `flagged`, `suspended`
   - Verification levels: `basic`, `bronze`, `silver`, `gold`

### Sample Data Structure:

```sql
-- Background Check
{
  id: uuid,
  helper_id: uuid,
  check_type: 'identity',
  provider: 'AuthBridge',
  status: 'verified',
  verification_score: 95,
  verified_at: timestamp,
  expires_at: timestamp,
  created_at: timestamp
}

-- Trust Score
{
  helper_id: uuid,
  trust_score: 92,
  status: 'active',
  verification_level: 'gold',
  background_check_score: 95,
  document_verification_score: 100,
  behavior_score: 98,
  customer_feedback_score: 90,
  geofence_compliance_score: 100,
  total_violations: 0,
  updated_at: timestamp
}
```

---

## 🚀 How to Insert Sample Data

1. **Open Supabase SQL Editor**
2. **Run this file**: `supabase/sample_sos_trust_safety_data.sql`
3. **Prerequisites**:
   - At least 3-4 profiles with `role='helper'`
   - At least 2-3 profiles with `role='customer'`
   - At least 1 profile with `role='admin'`

### Quick Insert Commands:

```sql
-- Insert SOS Alert (Active)
INSERT INTO public.sos_alerts (
  user_id, alert_type, status, latitude, longitude, 
  address, description, contact_phone
) VALUES (
  'YOUR_CUSTOMER_ID',
  'emergency',
  'active',
  28.6139, 77.2090,
  'Connaught Place, New Delhi',
  'Need immediate help!',
  '+91-9876543210'
);

-- Insert Background Check (Verified)
INSERT INTO public.background_check_results (
  helper_id, check_type, provider, status, verification_score,
  verified_at, expires_at
) VALUES (
  'YOUR_HELPER_ID',
  'identity',
  'AuthBridge',
  'verified',
  95,
  NOW(),
  NOW() + INTERVAL '1 year'
);

-- Insert Trust Score
INSERT INTO public.helper_trust_scores (
  helper_id, overall_score, trust_score, status, verification_level
) VALUES (
  'YOUR_HELPER_ID',
  92, 92, 'active', 'gold'
)
ON CONFLICT (helper_id) DO UPDATE 
SET overall_score = 92, trust_score = 92;
```

---

## 📱 What You'll See

### SOS Page (`/admin/sos`):
- **Stats Cards**: Total Alerts, Pending, Acknowledged, Avg Response Time
- **Alert List**: Each showing:
  - User name & phone
  - Alert type & description
  - Location (lat/long + address)
  - Time elapsed since creation
  - Action buttons: Acknowledge, Resolve, Call Emergency

### Trust & Safety Page (`/admin/trust-safety`):
- **Stats Cards**: Total Checks, Pending, Verified, Expired, Trust Scores
- **Tab 1 - Background Checks**:
  - Helper name & email
  - Check type (Identity, Criminal, Address, etc.)
  - Status badge (Pending, Verified, Expired)
  - Verification score (0-100)
  - Verified date & expiry date
- **Tab 2 - Trust Scores**:
  - Helper name & email
  - Trust score (0-100) with color coding
  - Status (Active, Flagged, Suspended)
  - Verification level badge (Basic, Bronze, Silver, Gold)
  - Last updated date

---

## 🔍 Testing Checklist

- [ ] Run `sample_sos_trust_safety_data.sql` in Supabase
- [ ] Navigate to `/admin/sos` - should see 3 active alerts
- [ ] Click "Acknowledge" on an alert - status changes to acknowledged
- [ ] Click "Resolve" on an alert - status changes to resolved
- [ ] Navigate to `/admin/trust-safety`
- [ ] See Background Checks tab with 5 checks (pending, verified, expired)
- [ ] Filter by "Pending" - see only pending checks
- [ ] Search by helper name - filters results
- [ ] Switch to Trust Scores tab - see 4 helpers with different scores
- [ ] Verify color coding: Green (>80), Blue (70-89), Yellow (50-69), Red (<50)
- [ ] Click refresh button - data reloads

---

## 📝 Related Files

- **SOS Migration**: `supabase/migrations/014_sos_emergency.sql`
- **Trust & Safety Migration**: `supabase/migrations/024_trust_safety.sql`
- **SOS Page**: `src/app/admin/sos/page.tsx`
- **SOS Client**: `src/components/admin/sos-page-client.tsx`
- **Trust Page**: `src/app/admin/trust-safety/page.tsx`
- **Trust Client**: `src/components/admin/trust-safety-page-client.tsx`
- **Sample Data**: `supabase/sample_sos_trust_safety_data.sql`

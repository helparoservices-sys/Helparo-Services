# Verification & Video Calls Pages - Explanation

## 📋 What These Pages Do

### 1. **Verification Page** (`/admin/verification`)

**Purpose**: Review and approve new helpers before they can start working on the platform.

**How it works**:
- When someone signs up as a helper, they upload documents (ID proof, photos, certificates)
- These helpers are in "pending" status and cannot accept jobs yet
- Admin reviews their documents and either:
  - ✅ **Approves** them → Helper can now work and earn money
  - ❌ **Rejects** them → Helper cannot work, gets notified why

**Tables Used**:
- `helper_profiles` - Stores helper info and verification_status (pending/approved/rejected)
- `verification_documents` - Stores uploaded documents (Aadhar, PAN, driving license, etc.)
- `verification_reviews` - Logs admin decisions with comments

**Real-world example**: 
- Helper "Raj Kumar" uploads Aadhar card + photo
- Admin sees "Raj Kumar" in queue with 2 documents
- Admin clicks "View Aadhar" → Opens document
- Admin approves → Raj can now accept cleaning jobs

---

### 2. **Video Calls Page** (`/admin/video-calls`)

**Purpose**: Monitor all video consultations happening on the platform + view recordings.

**How it works**:
- Customers can do video calls with helpers (like Zoom for services)
- Use cases:
  - 📹 **Pre-booking consultation**: Customer shows the messy room before booking cleaning
  - 🛠️ **Live support**: Plumber guides customer through fixing a leak
  - 📚 **Training**: Helper learns new skills via video call
  - 🆘 **Dispute resolution**: Admin joins call to resolve customer-helper issues

**Tables Used**:
- `video_call_sessions` - All video call sessions (ongoing, completed, scheduled)
- `call_participants` - Who joined the call and for how long
- `call_recordings` - Saved recordings for review
- `call_analytics` - Performance metrics (connection quality, duration)

**Real-world example**:
- Customer wants AC repair but not sure what's wrong
- Customer books video consultation with AC technician helper
- 15-minute video call → Helper sees the AC and gives estimate
- Call recorded → Both can review later
- Admin can see: Call duration, quality rating, if customer booked service after

---

## 🗂️ Database Tables Summary

### Verification System Tables:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `helper_profiles` | Helper basic info | `user_id`, `verification_status` (pending/approved/rejected) |
| `verification_documents` | Uploaded docs | `helper_id`, `document_type`, `document_url`, `status` |
| `verification_reviews` | Admin decisions | `helper_user_id`, `admin_user_id`, `decision`, `comment` |

### Video Call System Tables:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `video_call_sessions` | Call sessions | `customer_id`, `helper_id`, `status`, `duration_seconds`, `recording_url` |
| `call_participants` | Who joined | `session_id`, `user_id`, `role`, `joined_at`, `left_at` |
| `call_recordings` | Saved videos | `session_id`, `file_url`, `duration_seconds` |
| `call_analytics` | Metrics | `session_id`, `metric_name`, `metric_value` |

---

## 🎯 Why These Pages Matter

### Verification Page = Quality Control
- **Prevents fraud**: Only verified helpers can work
- **Safety**: Customers trust helpers with verified IDs
- **Compliance**: Legal requirement to verify workers

### Video Calls Page = Modern Service Platform
- **Saves time**: Customer doesn't need in-person visit for estimates
- **Better matching**: Customer sees helper before booking
- **Support**: Live help during service
- **Training**: Upskill helpers remotely
- **Dispute resolution**: Recording proves what was said/done

---

## 📊 Sample Data We'll Create

### For Verification Page:
- 2 new pending helpers with full profiles
- Each helper has 3-4 documents:
  - Aadhar card (identity proof)
  - PAN card (tax ID)
  - Photo (selfie)
  - Police verification (background check)
- Ready for admin to approve/reject

### For Video Calls Page:
- 5 completed video calls with different scenarios
- 2 ongoing calls (live right now)
- 1 scheduled future call
- Includes recordings, durations, quality ratings
- Shows different call types: consultation, support, training

---

## 🚀 How to Test (After Sample Data)

### Test Verification Page:
1. Go to `/admin/verification`
2. See 2 pending helpers in queue
3. Click "View aadhar" → Opens document
4. Add comment: "Documents look good"
5. Click "Approve" → Helper removed from queue
6. Check `helper_profiles` table → `verification_status` = 'approved'

### Test Video Calls Page:
1. Go to `/admin/video-calls`
2. See stats: 7 total calls, 2 active now, 5 completed
3. Filter by "ongoing" → See live calls
4. Click on call → See participants, duration, quality
5. View recording link (if available)
6. Check analytics: Average duration, quality rating

---

## 🔑 Key Differences from Other Pages

| Feature | SOS Alerts | Trust-Safety | Verification | Video Calls |
|---------|-----------|--------------|--------------|-------------|
| **Urgency** | 🚨 Emergency | ⚠️ Risk review | 📋 Onboarding | 📹 Communication |
| **Frequency** | Rare | Regular checks | One-time approval | Per-service |
| **Action** | Immediate response | Review history | Approve/Reject | Monitor quality |
| **User Impact** | Life/safety | Trust score | Can work or not | Service quality |

---

This will help you understand what we're building! 🚀

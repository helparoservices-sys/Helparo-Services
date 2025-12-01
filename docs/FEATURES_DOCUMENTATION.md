# Helparo - Detailed Features Documentation
## Complete Feature Breakdown with Examples

**Version:** 1.0  
**Date:** November 30, 2025

---

## 📑 Table of Contents

1. [User Management & Authentication](#1-user-management--authentication)
2. [Service Discovery & Booking](#2-service-discovery--booking)
3. [Smart Matching Algorithm](#3-smart-matching-algorithm)
4. [Bidding System](#4-bidding-system)
5. [Real-Time Communication](#5-real-time-communication)
6. [Video Consultation](#6-video-consultation)
7. [Payment & Escrow System](#7-payment--escrow-system)
8. [Time Tracking & Work Proof](#8-time-tracking--work-proof)
9. [Trust & Safety Features](#9-trust--safety-features)
10. [Geofencing & Location Tracking](#10-geofencing--location-tracking)
11. [Emergency SOS System](#11-emergency-sos-system)
12. [Review & Rating System](#12-review--rating-system)
13. [Subscription Plans](#13-subscription-plans)
14. [Loyalty & Gamification](#14-loyalty--gamification)
15. [Referral Program](#15-referral-program)
16. [Promo Codes & Discounts](#16-promo-codes--discounts)
17. [Service Bundles](#17-service-bundles)
18. [Seasonal Campaigns](#18-seasonal-campaigns)
19. [Support & Ticketing](#19-support--ticketing)
20. [Wallet & Withdrawals](#20-wallet--withdrawals)
21. [Insurance Coverage](#21-insurance-coverage)
22. [Admin Dashboard](#22-admin-dashboard)
23. [Notifications System](#23-notifications-system)
24. [Analytics & Reporting](#24-analytics--reporting)

---

## 1. User Management & Authentication

### Features
- **Multi-role registration** (Customer, Helper, Admin)
- **Phone & Email verification**
- **Social login** (Google, Facebook)
- **Profile management**
- **Location auto-detection**
- **Session management**
- **Password reset**

### Example Flow
```
New User Journey:
1. User opens app
2. Selects role (Customer/Helper)
3. Enters phone number → Receives OTP
4. Verifies OTP
5. Enters: Name, Email, Password
6. Auto-detects location via GPS
7. Selects State → District → City
8. Profile created ✓

Helper Additional Steps:
9. Upload Aadhaar/PAN
10. Add service categories
11. Set hourly rates
12. Define service areas
13. Upload profile photo
14. Account pending verification
```

### Technical Implementation
- **Database Tables**: `profiles`, `helper_profiles`, `verification_documents`
- **Authentication**: Supabase Auth with JWT tokens
- **Location**: Google Maps Geocoding API
- **Verification**: Document upload to Supabase Storage

---

## 2. Service Discovery & Booking

### Features
- **25+ service categories**
- **Category-wise browsing**
- **Search functionality**
- **Service details page**
- **Request creation wizard**
- **Budget range selector**
- **Schedule picker** (Date & Time)
- **Location selector** with map
- **Photo upload** (up to 5 images)
- **Urgency levels** (Normal, Urgent, Emergency)

### Example: Creating a Service Request

**Scenario**: Customer needs AC repair

```
Step 1: Select Category
- Browse categories → Home Appliances → AC Repair

Step 2: Service Details
- Title: "Split AC not cooling"
- Description: "1.5 ton AC making noise, not cooling properly"
- Upload photos: [Before images of AC]
- Urgency: Normal

Step 3: Location
- Auto-filled from profile: "Kukatpally, Hyderabad"
- Pin exact location on map
- Add landmark: "Near JNTU Metro"

Step 4: Schedule
- Preferred Date: Dec 1, 2025
- Time Slot: 2:00 PM - 4:00 PM
- Flexible timing: Yes

Step 5: Budget
- Min: ₹500
- Max: ₹1,500
- Estimated by system: ₹800-1,200

Step 6: Review & Submit
- Request posted ✓
- Notification sent to nearby helpers
- Status: "Open for Bids"
```

### Post-Creation
- Helper notifications within 10km radius
- Request visible to helpers with AC repair skills
- Customer receives real-time bid notifications
- Automatic request expiry after 24 hours if no bids

---

## 3. Smart Matching Algorithm

### Algorithm Factors
1. **Location Proximity** (50% weight)
   - Helper within service radius
   - Distance from request location
   - Traffic conditions (if available)

2. **Skill Match** (20% weight)
   - Exact category match
   - Related category experience
   - Specialization verification

3. **Availability** (15% weight)
   - Current online status
   - Working hours schedule
   - Existing bookings

4. **Rating & Experience** (10% weight)
   - Average rating (min 4.0 preferred)
   - Total jobs completed
   - Category-specific rating

5. **Subscription Level** (5% weight)
   - Premium helpers get priority
   - Pro helpers rank higher
   - Free helpers last

### Example Matching

**Request**: Plumbing service in Banjara Hills, Hyderabad

**Available Helpers:**
| Helper | Distance | Rating | Jobs | Subscription | Match Score |
|--------|----------|--------|------|--------------|-------------|
| Ramesh | 2.5 km   | 4.8    | 250  | Premium      | **95/100**  |
| Suresh | 1.8 km   | 4.5    | 120  | Pro          | **88/100**  |
| Mahesh | 5.0 km   | 4.9    | 500  | Free         | **82/100**  |
| Ganesh | 8.0 km   | 4.2    | 50   | Free         | **65/100**  |

**Result**: Top 3 helpers notified (Ramesh, Suresh, Mahesh)

---

## 4. Bidding System

### Features
- **Competitive bidding**
- **Bid breakdown** (Parts + Labor)
- **Bid validity period** (24-48 hours)
- **Cover letter** with bid
- **Availability notes**
- **Estimated duration**
- **Bid history tracking**
- **Counter-offer capability**

### Example Bidding Scenario

**Customer Request**: House painting (2BHK)

**Helper Bids Received:**

#### Bid 1 - Painter A
```
Total Bid: ₹25,000
Breakdown:
- Material (Paint): ₹12,000
- Labor: ₹10,000
- Equipment: ₹2,000
- Transportation: ₹1,000

Estimated Duration: 5 days
Cover Note: "10 years experience. Asian Paints certified. 
Will provide color consultation free."
Valid Until: Dec 2, 2025
```

#### Bid 2 - Painter B
```
Total Bid: ₹22,000
Breakdown:
- Material (Paint): ₹10,000
- Labor: ₹9,500
- Equipment: ₹1,500
- Transportation: ₹1,000

Estimated Duration: 6 days
Cover Note: "Specialized in texture painting. 
Previous work photos available."
Valid Until: Dec 3, 2025
```

#### Bid 3 - Painter C
```
Total Bid: ₹28,000
Breakdown:
- Material (Premium Paint): ₹15,000
- Labor: ₹10,000
- Equipment: ₹2,000
- Transportation: ₹1,000

Estimated Duration: 4 days
Cover Note: "Premium Berger Paints. 1-year warranty. 
Royal touch experience certified."
Valid Until: Dec 2, 2025
```

### Customer Decision Process
1. Compare all 3 bids side-by-side
2. Check helper profiles & ratings
3. View previous work photos
4. Initiate video call with top 2 (optional)
5. Accept Bid 2 (best value)
6. Painter B assigned automatically
7. Escrow payment initiated

---

## 5. Real-Time Communication

### Features
- **In-app messaging**
- **Text messages**
- **Image sharing**
- **Document sharing** (PDF, DOC)
- **Voice messages** (coming soon)
- **Typing indicators**
- **Read receipts**
- **Message history**
- **Push notifications**
- **Unread count badges**

### Example Chat Flow

```
Customer: Hi, can you come tomorrow at 3 PM?
[Sent 2:30 PM ✓✓]

Helper: Yes, I'm available. Do you need any specific materials?
[Sent 2:31 PM ✓✓ Read]

Customer: [Sends image of broken pipe]
Customer: This needs to be replaced
[Sent 2:32 PM ✓✓]

Helper: Okay, I'll bring 1-inch PVC pipes and connectors
Helper: Will take approximately 2 hours
[Sent 2:33 PM ✓✓ Read]

Customer: Perfect! See you tomorrow
[Sent 2:34 PM ✓✓]
```

### Notification Types
- New message received
- Helper typing...
- Image/document received
- Service request update
- Payment status change
- Rating reminder

---

## 6. Video Consultation

### Features
- **In-app video calls**
- **Screen sharing**
- **Call recording** (with consent)
- **Call duration tracking**
- **Connection quality monitoring**
- **Device compatibility check**
- **Scheduled video calls**
- **Call history**
- **Analytics per session**

### Example Use Case

**Scenario**: AC troubleshooting via video

```
Step 1: Customer Initiates Call
- Customer selects helper
- Clicks "Video Consultation"
- Helper receives call notification

Step 2: Video Session
Duration: 8 minutes

0:00 - Call connected
0:30 - Customer shows AC unit
1:00 - Helper asks to show control panel
2:00 - Helper notices temperature setting
3:00 - Helper guides: "Press Mode button 3 times"
4:00 - Customer follows instructions
5:00 - AC starts cooling
6:00 - Helper confirms issue resolved
7:00 - Helper suggests annual servicing
8:00 - Call ended

Step 3: Post-Call Actions
- Customer: Rate call quality (5 stars)
- Customer: Convert to booking for annual service
- Helper: Gets notification for service booking
```

### Benefits
- **Saves time**: No unnecessary home visits
- **Quick diagnosis**: Visual assessment
- **Trust building**: Face-to-face interaction
- **Cost-effective**: Free consultation
- **Upselling**: Convert to paid services

---

## 7. Payment & Escrow System

### Features
- **Multiple payment methods**
  - UPI (Google Pay, PhonePe, Paytm)
  - Credit/Debit Cards
  - Net Banking
  - Wallets (Paytm, Mobikwik)
  
- **Escrow protection**
- **Automatic fund release**
- **Refund processing**
- **Payment splitting**
- **Transaction history**
- **Invoice generation**
- **TDS calculation** (for helpers)

### Escrow Flow Example

**Service**: Laptop Repair - ₹5,000

```
Stage 1: Booking Confirmed
├─ Customer pays ₹5,000
├─ Payment status: Success ✓
├─ Funds held in escrow
└─ Helper notified: "Payment secured"

Stage 2: Service In Progress
├─ Helper starts work
├─ Time tracking begins
├─ Escrow status: Locked
└─ Funds protected for both parties

Stage 3: Service Completed
├─ Helper marks "Job Complete"
├─ Uploads work proof (photos/video)
├─ Customer reviews work
└─ Customer approves completion

Stage 4: Payment Release
├─ Funds released from escrow
├─ Platform commission: ₹750 (15%)
├─ Helper receives: ₹4,250
├─ Transfer to wallet: Instant
└─ Invoice generated for records

Alternative: Dispute Scenario
├─ Customer raises complaint
├─ Funds remain in escrow
├─ Admin investigates
├─ Evidence reviewed
└─ Decision: Full/Partial refund or Release
```

### Payment Security
- PCI DSS compliant
- End-to-end encryption
- 3D Secure authentication
- Fraud detection
- Chargeback protection

---

## 8. Time Tracking & Work Proof

### Features
- **Automatic time logging**
- **GPS-based arrival detection**
- **Start/pause/resume controls**
- **Break management**
- **Overtime calculation**
- **Photo/video proof upload**
- **Before/after comparisons**
- **Customer verification**
- **Time-lapse reports**

### Example: Cleaning Service

```
Job: Deep Home Cleaning
Scheduled: 9:00 AM - 1:00 PM (4 hours)
Helper: Cleaning Team (3 people)

Timeline:
├─ 8:55 AM: Helper arrives at location
│   └─ Geofencing confirms arrival ✓
│
├─ 9:00 AM: [START WORK] 
│   ├─ Upload "Before" photos (living room, kitchen, bathrooms)
│   └─ Customer confirms start ✓
│
├─ 10:30 AM: [BREAK] - 15 minutes
│   └─ Timer paused automatically
│
├─ 10:45 AM: [RESUME WORK]
│   └─ Timer continues
│
├─ 12:00 PM: Mid-work progress update
│   └─ Upload "During" photos
│
├─ 1:00 PM: [WORK COMPLETE]
│   ├─ Upload "After" photos (all rooms)
│   ├─ Total time: 3h 45min (break excluded)
│   └─ Request customer approval
│
└─ 1:15 PM: Customer verification
    ├─ Reviews before/after photos
    ├─ Inspects work quality
    ├─ Approves completion ✓
    └─ Payment released from escrow
```

### Work Proof Requirements
- Minimum 3 photos (before, during, after)
- GPS timestamp on photos
- Customer approval mandatory
- Quality check by admin (random sampling)

---

## 9. Trust & Safety Features

### Multi-Level Verification

#### Level 1: Phone Verification ✅
- OTP-based verification
- Mandatory for all users
- Instant verification

#### Level 2: Email Verification ✅
- Email link verification
- Spam prevention
- Communication channel

#### Level 3: Document Verification 📄
**For Helpers Only**
- Aadhaar Card (mandatory)
- PAN Card (for tax purposes)
- Driving License (for vehicle-based services)
- Skills Certificates
- Previous employer letters

#### Level 4: Background Check 🔍
**Police Verification**
- Criminal record check
- Address verification
- Character certificate
- Takes 7-14 days
- Third-party agency partnership

#### Level 5: Skills Verification ⭐
- Category-specific tests
- Portfolio review
- Sample work evaluation
- Expert assessment
- Certification badges

### Trust Score System

**Calculation Formula:**
```
Trust Score (0-100) = 
  Background Check Score (25 points) +
  Document Verification (20 points) +
  Customer Reviews (25 points) +
  Geofence Compliance (20 points) +
  Job Completion Rate (10 points)
```

**Example Helper Profile:**

```
Helper: Rajesh Kumar - Electrician
Overall Trust Score: 87/100 ⭐

Breakdown:
├─ Background Check: 25/25 ✓ (Verified)
├─ Documents: 18/20 (Aadhaar ✓, PAN ✓, License ✗)
├─ Customer Reviews: 23/25 (4.6★ avg, 150 reviews)
├─ Geofence: 18/20 (2 minor violations)
└─ Completion: 10/10 (98% completion rate)

Badges Earned:
🏆 100 Jobs Completed
⭐ 5-Star Specialist
🔧 Certified Electrician
✅ Background Verified
```

---

## 10. Geofencing & Location Tracking

### Features
- **Arrival verification** (±100m accuracy)
- **Work area monitoring**
- **False arrival detection**
- **Location spoofing prevention**
- **Route tracking** (from helper location to job)
- **Live location sharing** (with customer)
- **Geofence violation alerts**
- **Trust score impact**

### How It Works

```
Geofence Setup:
├─ Customer provides service address
├─ System creates 100m radius geofence
├─ Helper's live location monitored
└─ Arrival detected when inside fence

Arrival Verification:
┌─────────────────────────────────┐
│   Service Location (Center)     │
│          🏠                      │
│                                 │
│     [100m Radius Circle]        │
│         ○ ○ ○ ○ ○              │
│       ○           ○            │
│      ○      🏠      ○          │
│      ○  Helper ↓    ○          │
│       ○     📍     ○           │
│         ○ ○ ○ ○ ○              │
└─────────────────────────────────┘

When helper enters circle:
✓ Arrival logged
✓ Customer notified
✓ Time tracking can begin
```

### Violation Examples & Actions

#### Minor Violation
```
Scenario: Helper marks arrival but is 150m away
├─ Warning issued automatically
├─ Helper notified: "Please move closer"
├─ Trust score: -1 point
└─ Logged in system
```

#### Major Violation
```
Scenario: Helper marks arrival but is 2km away
├─ Automatic alert to admin
├─ Customer notified immediately
├─ Booking auto-cancelled option
├─ Trust score: -5 points
├─ Investigation triggered
└─ Possible suspension
```

#### Critical Violation
```
Scenario: Repeated false arrivals (3+ times)
├─ Account temporarily suspended
├─ Admin manual review required
├─ Trust score: -20 points
├─ Previous customers notified
└─ Possible permanent ban
```

---

## 11. Emergency SOS System

### Features
- **One-tap emergency button**
- **GPS location sharing**
- **Emergency contacts notification**
- **Admin immediate alert**
- **Call emergency services option**
- **Audio/video evidence recording**
- **Incident reporting**
- **Follow-up tracking**

### SOS Activation Flow

```
Emergency Situation: Customer feels unsafe

Step 1: Trigger SOS
├─ Customer presses big red SOS button
├─ Alert type selection:
│   ○ Safety Concern
│   ○ Dispute
│   ○ Medical Emergency
│   ● Harassment (selected)
└─ GPS location captured instantly

Step 2: Immediate Actions (Simultaneous)
├─ Admin Dashboard: 🚨 RED ALERT notification
├─ Nearby Admins: Push notification
├─ Emergency Contacts (3): SMS + Call
├─ Police Hotline: Auto-dial option shown
└─ Helper: Instant notification + Location freeze

Step 3: Evidence Collection
├─ Camera auto-activates (with permission)
├─ Audio recording starts
├─ Screenshots captured
├─ Timeline created
└─ All evidence stored securely

Step 4: Admin Response
├─ Admin acknowledges: < 30 seconds
├─ Calls customer immediately
├─ Assesses situation severity
├─ Dispatches help if needed
└─ Updates incident status

Step 5: Resolution
├─ Situation resolved
├─ SOS marked closed
├─ Follow-up call next day
├─ Action taken on helper (if needed)
└─ Incident report generated
```

### Example Incident Report

```
SOS Alert #SOS-2025-0847
Date: Nov 30, 2025, 3:45 PM
User: Priya Sharma (Customer)
Service: Home Cleaning
Helper: [Name Redacted]

Timeline:
├─ 3:45 PM: SOS triggered (Type: Safety Concern)
├─ 3:45 PM: Admin Ravi acknowledged
├─ 3:46 PM: Customer called by admin
├─ 3:47 PM: Police informed (precautionary)
├─ 3:50 PM: Helper asked to leave premises
├─ 3:55 PM: Customer confirmed safe
├─ 4:00 PM: SOS closed
└─ 4:30 PM: Full refund processed

Action Taken:
├─ Helper account suspended pending investigation
├─ Police complaint filed
├─ Evidence submitted
├─ Customer provided counseling support
└─ Follow-up scheduled for Dec 1
```

---

## 12. Review & Rating System

### Features
- **5-star rating system**
- **Multi-criteria ratings**
  - Quality of Work
  - Timeliness
  - Professionalism
  - Value for Money
- **Written reviews**
- **Photo/video reviews**
- **Verified purchase badge**
- **Helper response mechanism**
- **Review moderation**
- **Helpful votes on reviews**

### Example Review Breakdown

```
Service: Laptop Screen Replacement
Helper: TechFix - Suresh
Date: Nov 28, 2025

Overall Rating: 4.5 ⭐⭐⭐⭐⭐

Detailed Ratings:
├─ Quality: 5.0 ⭐⭐⭐⭐⭐
├─ Timeliness: 4.0 ⭐⭐⭐⭐
├─ Professionalism: 5.0 ⭐⭐⭐⭐⭐
└─ Value: 4.0 ⭐⭐⭐⭐

Review by: Amit Verma ✓ Verified
"Excellent service! Screen replaced perfectly with genuine 
Dell part. Helper arrived 15 mins late but work quality 
was top-notch. Professional and knowledgeable. Recommended!"

[Photo: Before - Cracked Screen]
[Photo: After - New Screen]

👍 15 people found this helpful

Helper Response (Nov 29):
"Thank you for the feedback! Sorry for the delay - traffic 
issue. Glad you're satisfied with the work. Feel free to 
contact for any laptop issues."
```

### Review Impact on Helper

```
Helper: Suresh - Tech Repair Specialist
Total Reviews: 234
Average Rating: 4.7 ⭐

Rating Distribution:
⭐⭐⭐⭐⭐ (5 stars): ████████████████ 65% (152)
⭐⭐⭐⭐   (4 stars): ██████████ 25% (58)
⭐⭐⭐     (3 stars): ███ 7% (17)
⭐⭐       (2 stars): ██ 2% (5)
⭐         (1 star): █ 1% (2)

Benefits from Good Reviews:
✓ Higher search ranking
✓ More bid acceptance (42% accept rate)
✓ Premium pricing authority (+15%)
✓ Badge: "5-Star Specialist"
✓ Featured in "Top Rated" section
```

---

## 13. Subscription Plans

### Helper Subscription Tiers

#### 🆓 Free Plan (₹0/month)
```
Features:
├─ Basic listing
├─ Standard commission: 15%
├─ Service radius: 10km
├─ Bid on open requests
├─ Profile visibility
└─ Email support

Ideal for: New helpers testing platform
```

#### 📦 Basic Plan (₹299/month)
```
Features:
├─ Reduced commission: 10% (-5%)
├─ Service radius: 15km (+5km)
├─ Priority in search (Level 1)
├─ Featured in category
├─ 24/7 chat support
└─ 7-day free trial

Benefits:
- Save ₹1,500/month on 30 jobs @ avg ₹1,000
- ROI: 5x

Ideal for: Part-time professionals
```

#### 👑 Pro Plan (₹699/month)
```
Features:
├─ Reduced commission: 7% (-8%)
├─ Service radius: 20km (+10km)
├─ Priority in search (Level 3)
├─ Profile badge: "PRO"
├─ Highlight in search results
├─ Premium support (Priority)
├─ Performance analytics
└─ 14-day free trial

Benefits:
- Save ₹4,800/month on 60 jobs @ avg ₹1,000
- ROI: 7x

Ideal for: Full-time professionals
```

#### 💎 Premium Plan (₹1,499/month)
```
Features:
├─ Reduced commission: 5% (-10%)
├─ Service radius: 30km (+20km)
├─ Priority in search (Level 5 - TOP)
├─ Profile badge: "PREMIUM"
├─ Top search placement
├─ Instant payouts (instead of T+2)
├─ Dedicated account manager
├─ Advanced analytics
├─ Marketing support
└─ 30-day free trial

Benefits:
- Save ₹12,000/month on 120 jobs @ avg ₹1,000
- ROI: 8x

Ideal for: Professional agencies, top earners
```

### Customer Subscription Tiers

#### 🆓 Free Plan (₹0/month)
```
Features:
├─ Browse all services
├─ Unlimited bookings
├─ Standard support
├─ Basic loyalty points
└─ Standard cancellation policy
```

#### ➕ Plus Plan (₹199/month)
```
Features:
├─ Priority support (24/7)
├─ 5% discount on all services
├─ Double loyalty points (2x)
├─ Free cancellation (up to 2 hours before)
├─ Exclusive offers
└─ 7-day free trial

Savings Example:
- 4 bookings/month @ avg ₹1,000 = ₹4,000
- 5% discount = ₹200/month
- Subscription cost = ₹199
- Net benefit = ₹1 + exclusive perks
```

#### 💎 Premium Plan (₹499/month)
```
Features:
├─ All Plus features
├─ 10% discount on all services
├─ Priority booking (helpers see first)
├─ Free cancellation anytime
├─ 3x loyalty points
├─ Exclusive bundles access
├─ Dedicated support manager
├─ Service warranties included
└─ 14-day free trial

Savings Example:
- 6 bookings/month @ avg ₹1,500 = ₹9,000
- 10% discount = ₹900/month
- Subscription cost = ₹499
- Net benefit = ₹401 + premium perks
```

---

## 14. Loyalty & Gamification

### Loyalty Points System

**Earning Points:**
```
Action                          Points Earned
──────────────────────────────────────────────
Complete booking (Customer)     = Service₹ / 100
Complete booking (Helper)       = Earning₹ / 50
Write review                    = 10 points
Add photo to review             = 5 points
Refer a friend (signup)         = 50 points
Refer a friend (first booking)  = 100 points
Daily login                     = 1 point
Complete profile 100%           = 25 points
Verify phone                    = 10 points
Verify email                    = 10 points
```

**Redeeming Points:**
```
1,000 points = ₹100 discount
2,500 points = ₹300 discount
5,000 points = ₹750 discount
10,000 points = ₹2,000 discount

Redemption Rules:
- Minimum: 500 points
- Maximum: 50% of booking value
- Expiry: 1 year from earning
```

**Tier System:**
```
🥉 Bronze (0-1,000 points)
├─ Standard benefits
├─ 1x point earning
└─ Basic offers

🥈 Silver (1,001-5,000 points)
├─ 1.2x point earning
├─ Exclusive offers
└─ Priority support

🥇 Gold (5,001-15,000 points)
├─ 1.5x point earning
├─ Premium offers
├─ Birthday bonus (100 pts)
└─ Dedicated manager

💎 Platinum (15,000+ points)
├─ 2x point earning
├─ VIP treatment
├─ Concierge service
├─ Early access to new features
└─ Annual gift voucher (₹500)
```

### Badges & Achievements

**Performance Badges:**
```
🏆 Rookie - First booking completed
🌟 Rising Star - 10 bookings
⭐ Veteran - 50 bookings
💪 Expert - 100 bookings
👑 Master - 500 bookings
🎖️ Legend - 1,000 bookings
```

**Rating Badges:**
```
⭐ 4-Star Helper - Maintain 4+ rating
🌟 5-Star Specialist - Maintain 4.8+ rating (50+ reviews)
💫 Perfect Record - 5.0 rating (100+ reviews)
```

**Consistency Badges:**
```
🔥 7-Day Streak - Active 7 consecutive days
📅 Monthly Champion - 30+ jobs in a month
🎯 100% Completion - No cancellations in 3 months
⚡ Quick Responder - <5 min avg response time
```

**Category Expert:**
```
🔧 Plumbing Expert - 50+ plumbing jobs
💡 Electrical Master - 50+ electrical jobs
🎨 Painting Pro - 50+ painting jobs
```

### Example Gamification in Action

```
Helper: Ravi Sharma
Current Stats:
├─ Total Jobs: 127
├─ Points: 6,847 (Gold Tier)
├─ Current Streak: 23 days
└─ Rating: 4.9 ⭐

Badges Earned (12):
🏆 Rookie ✓
🌟 Rising Star ✓
⭐ Veteran ✓
💪 Expert ✓
🔥 7-Day Streak ✓
🔥 30-Day Streak ✓
📅 Monthly Champion ✓
⭐ 4-Star Helper ✓
🌟 5-Star Specialist ✓
🔧 Plumbing Expert ✓
⚡ Quick Responder ✓
🎯 100% Completion ✓

Next Milestone:
👑 Master (373 jobs to go)
💫 Perfect Record (need 5.0 rating)

Rewards Unlocked:
✓ 1.5x point multiplier
✓ Featured on homepage
✓ Priority in plumbing category
✓ Birthday bonus: 150 points
```

---

## 15. Referral Program

### How It Works

**For Referrer (Existing User):**
```
Step 1: Get Unique Code
- Code: RAVI2025
- Shareable link generated
- QR code for easy sharing

Step 2: Share with Friends
- WhatsApp share button
- Copy link
- Share on social media

Step 3: Friend Signs Up
- Friend uses code RAVI2025
- Referrer gets ₹50 bonus
- Friend gets ₹50 welcome credit

Step 4: Friend Makes First Booking
- Referrer gets ₹100 bonus
- Friend gets additional ₹50 discount
- Both get loyalty points
```

**Referral Rewards:**
```
Event                           Referrer    Referee
─────────────────────────────────────────────────────
Sign up using code              ₹50         ₹50
First booking completed         ₹100        ₹50 off
Complete 5 bookings            ₹200        10% off
Helper verification complete    ₹300        Trial Sub
```

**Referral Tiers:**
```
🥉 Bronze Referrer (1-5 referrals)
├─ Standard rewards
└─ ₹150 per successful referral

🥈 Silver Referrer (6-20 referrals)
├─ 1.5x rewards
└─ ₹225 per successful referral
└─ Bonus: ₹500 at 10 referrals

🥇 Gold Referrer (21-50 referrals)
├─ 2x rewards
├─ ₹300 per successful referral
└─ Bonus: ₹2,000 at 25 referrals

💎 Ambassador (50+ referrals)
├─ 2.5x rewards
├─ ₹375 per successful referral
├─ Monthly bonus: ₹5,000
└─ Special recognition badge
```

### Example Referral Success

```
User: Priya Sharma
Referral Code: PRIYA2025
Total Referrals: 32 (Gold Tier)

Breakdown:
├─ Signed up: 45 users
├─ Completed first booking: 32 users
├─ Active users: 28 users
└─ Total earnings: ₹9,600

Tier Bonuses:
├─ 10 referrals bonus: ₹500
├─ 25 referrals bonus: ₹2,000
└─ Total bonuses: ₹2,500

Grand Total Earned: ₹12,100
```

---

## 16. Promo Codes & Discounts

### Types of Promo Codes

#### 1. **Percentage Discount**
```
Code: FIRST50
Type: Percentage
Discount: 50% off
Max Discount: ₹500
Min Order: ₹200
Usage Limit: 1 per user
Total Redemptions: 10,000
Valid: Nov 1 - Dec 31, 2025
Applicable to: New customers only
```

#### 2. **Flat Discount**
```
Code: CLEAN100
Type: Flat
Discount: ₹100 off
Min Order: ₹500
Usage Limit: 3 per user
Categories: Cleaning services only
Valid: Weekdays only
Total Redemptions: Unlimited
Valid: Throughout December 2025
```

#### 3. **Cashback**
```
Code: CASHBACK200
Type: Cashback
Amount: ₹200 back to wallet
Min Order: ₹1,000
Usage Limit: 1 per user
Credited: Within 24 hours
Valid: Dec 1-15, 2025
Applicable to: All services
```

### Example: Customer Using Promo

```
Booking: Home Deep Cleaning
Original Price: ₹3,500
Promo Code: CLEAN100

Calculation:
├─ Service Amount: ₹3,500
├─ Promo (CLEAN100): -₹100
├─ Loyalty Points (500): -₹50
├─ Subtotal: ₹3,350
├─ GST (18%): +₹603
└─ Final Amount: ₹3,953

Savings Summary:
- Promo discount: ₹100
- Loyalty discount: ₹50
- Total saved: ₹150
```

---

## 17. Service Bundles

### Bundle Types

#### 1. **Home Maintenance Bundle**
```
Bundle Name: Complete Home Care
Original Price: ₹8,500
Bundle Price: ₹6,499
Savings: ₹2,001 (24% off)
Validity: 30 days

Included Services:
├─ AC Servicing (Split - 2 units) → ₹1,800
├─ Electrical checkup → ₹1,500
├─ Plumbing inspection → ₹1,200
├─ Deep Cleaning (2BHK) → ₹2,500
└─ Pest Control → ₹1,500

Terms:
- Use all 5 services within 30 days
- Schedule in advance
- Cannot split bundle
- Non-refundable
```

#### 2. **Event Services Package**
```
Bundle Name: Perfect Party Package
Original Price: ₹15,000
Bundle Price: ₹11,999
Savings: ₹3,001 (20% off)
Validity: Single event date

Included Services:
├─ Photography (5 hours) → ₹6,000
├─ Catering setup → ₹4,000
├─ Decoration → ₹3,500
└─ Cleanup post-event → ₹1,500

Free Add-ons:
+ Event planner consultation (1 hour)
+ 100 printed photos
```

#### 3. **Monthly Subscription Bundle**
```
Bundle Name: Weekly Cleaning Subscription
Monthly Price: ₹2,999
Per-visit cost: ₹750 (4 visits)
Regular price: ₹4,000 (₹1,000/visit)
Savings: ₹1,001/month (25% off)

What's Included:
├─ Weekly home cleaning (every Saturday)
├─ Kitchen deep clean (once/month)
├─ Bathroom deep clean (once/month)
└─ Balcony cleaning (once/month)

Benefits:
- Same helper every week
- Dedicated time slot
- Free rescheduling
- Cancel anytime
```

### Bundle Purchase Flow

```
Customer: Amit wants "Complete Home Care" bundle

Step 1: Select Bundle
- Browses bundles section
- Clicks "Complete Home Care"
- Reviews included services

Step 2: Payment
- Bundle price: ₹6,499
- Applies promo: BUNDLE10 (extra 10% off)
- Final price: ₹5,849
- Payment made → Bundle activated

Step 3: Schedule Services
- Service 1: AC Servicing → Dec 5, 10 AM
- Service 2: Electrical → Dec 8, 3 PM
- Service 3: Plumbing → Dec 12, 11 AM
- Service 4: Deep Cleaning → Dec 15, 9 AM
- Service 5: Pest Control → Dec 20, 2 PM

Step 4: Service Completion
- All 5 services marked complete
- Bundle status: Fully utilized
- Total saved: ₹2,651 (original - final)
```

---

## 18. Seasonal Campaigns

### Campaign Examples

#### 1. **Diwali Deep Clean Campaign**
```
Campaign: "Sparkling Diwali Homes"
Duration: Oct 15 - Nov 5, 2025
Discount: 30% off all cleaning services
Max Discount: ₹1,500
Min Order: ₹1,000

Special Features:
├─ Free wall painting touch-up with deep clean
├─ Complimentary window cleaning
├─ Priority scheduling
└─ Same-day service available

Target: All customers
Estimated Revenue: ₹50 Lakhs
Expected Bookings: 5,000
```

#### 2. **Monsoon Plumbing Care**
```
Campaign: "Leak-Free Monsoon"
Duration: June 1 - August 31, 2025
Offer: Flat ₹200 off on plumbing services
Includes:
├─ Free drainage check
├─ Waterproofing consultation
└─ Monsoon preparedness guide

Additional:
- Emergency plumbing: 24/7 availability
- No surge pricing during rains
- Waterproofing packages: 20% off
```

#### 3. **Summer AC Servicing Drive**
```
Campaign: "Cool Summer Guaranteed"
Duration: March 1 - May 31, 2025
Packages:
├─ Basic Service: ₹399 (reg. ₹699)
├─ Deep Service: ₹799 (reg. ₹1,299)
└─ Gas Refill: ₹1,499 (reg. ₹2,199)

Bundle Offer:
- Service 2 ACs: Get 3rd free
- Book now, service later (until July)
- Free AC health report
```

---

## 19. Support & Ticketing

### Support Channels
1. **In-app Chat** (Real-time)
2. **Email** (24-hour response)
3. **Phone** (Business hours: 9 AM - 9 PM)
4. **WhatsApp** (Quick queries)
5. **Knowledge Base** (Self-service)

### Ticket Categories
```
Category                Priority    SLA
──────────────────────────────────────────
Payment Issues          Urgent      2 hours
Account Access          High        4 hours
Booking Problems        High        4 hours
Helper Dispute          Medium      12 hours
Feature Request         Low         48 hours
General Inquiry         Low         24 hours
Technical Issue         Medium      8 hours
```

### Example Support Flow

```
Issue: Customer didn't receive refund

Step 1: Ticket Creation
├─ Ticket #SUP-2025-1234
├─ Category: Payment Issues
├─ Priority: Urgent
├─ Created: Nov 30, 2025 2:30 PM
└─ Assigned to: Support Agent Ravi

Step 2: Initial Response (within 2 hours)
├─ 3:15 PM: Agent acknowledges ticket
├─ Requested: Transaction ID, booking details
└─ Customer provides info

Step 3: Investigation
├─ 4:00 PM: Payment gateway checked
├─ Refund initiated but failed
├─ Reason: Invalid bank account
└─ Customer notified

Step 4: Resolution
├─ 4:30 PM: Correct bank details collected
├─ 5:00 PM: Refund re-initiated
├─ 5:15 PM: Confirmation received
└─ 5:20 PM: Customer informed

Step 5: Closure
├─ 6:00 PM: Ticket marked resolved
├─ Satisfaction survey sent
├─ Customer rates: 5 ⭐
└─ Case closed

Total resolution time: 3 hours 30 minutes
SLA: Met ✓ (< 2 hours from escalation)
```

---

## 20. Wallet & Withdrawals

### Wallet Features
- **Digital balance storage**
- **Automatic earnings credit**
- **Transaction history**
- **Low balance alerts**
- **Withdrawal to bank account**
- **UPI withdrawal**
- **Instant vs Standard transfer**

### Helper Wallet Example

```
Helper: Suresh Kumar
Current Balance: ₹18,450

Recent Transactions:
┌──────────────────────────────────────────────┐
│ Date       Type        Amount    Balance    │
├──────────────────────────────────────────────┤
│ Nov 30     Earning     +₹2,500   ₹18,450   │
│ Nov 29     Withdrawal  -₹5,000   ₹15,950   │
│ Nov 29     Earning     +₹1,800   ₹20,950   │
│ Nov 28     Earning     +₹3,200   ₹19,150   │
│ Nov 27     Commission  -₹675     ₹15,950   │
│ Nov 27     Earning     +₹4,500   ₹16,625   │
└──────────────────────────────────────────────┘
```

### Withdrawal Process

```
Helper initiates withdrawal: ₹15,000

Step 1: Withdrawal Request
├─ Amount: ₹15,000
├─ Method: Bank Transfer
├─ Account: HDFC Bank ****1234
└─ Type: Standard (Free, T+2 days)

Alternative:
└─ Instant Transfer (₹50 fee, within 1 hour)

Step 2: Validation
├─ Minimum balance check: ✓ (₹100 min)
├─ KYC verified: ✓
├─ Bank details verified: ✓
└─ No pending disputes: ✓

Step 3: Processing
├─ Status: Processing
├─ Transaction ID: WD-2025-5678
├─ Initiated: Nov 30, 3:00 PM
└─ Expected: Dec 2, by 6:00 PM

Step 4: Completion
├─ Amount debited from wallet: ₹15,000
├─ New balance: ₹3,450
├─ Bank credited: Dec 2, 11:30 AM
├─ SMS confirmation sent
└─ Status: Completed ✓
```

### Withdrawal Rules
```
Minimum Withdrawal: ₹100
Maximum Withdrawal: ₹50,000/day
Processing Time:
├─ Standard: T+2 days (Free)
└─ Instant: 1 hour (₹50 fee for Premium)

Weekly Limit: ₹2,00,000
Monthly Limit: ₹8,00,000

Auto-Payout Feature:
- Threshold: ₹10,000
- Automatically withdraw when reached
- Weekly schedule (every Monday)
```

---

## 21. Insurance Coverage

### Insurance Types

#### 1. **Property Damage Protection**
```
Coverage: Up to ₹50,000
Premium: ₹99 per booking
Covers:
├─ Accidental furniture damage
├─ Wall/floor damage
├─ Appliance damage
└─ Fixture breakage

Example Claim:
Service: Plumbing repair
Incident: Sink fixture broken during work
Claim Amount: ₹3,500
Processing: 3 days
Status: Approved ✓
Payment: Directly to customer
```

#### 2. **Theft Protection**
```
Coverage: Up to ₹1,00,000
Premium: ₹199 per booking
Covers:
├─ Item theft during service
├─ Missing valuables
└─ Fraudulent activities

Exclusions:
- Cash losses
- Pre-existing missing items
- Items not disclosed beforehand
```

#### 3. **Personal Injury Coverage**
```
Coverage: Up to ₹5,00,000
Premium: Included in all bookings
Covers:
├─ Medical expenses
├─ Hospitalization
├─ Accidental injuries
└─ Emergency treatment

Applicable for: Both customer and helper
```

### Insurance Claim Flow

```
Incident: Customer's laptop damaged during laptop repair

Step 1: Report Incident
├─ Booking: #BK-2025-4321
├─ Service: Laptop Repair
├─ Incident: Screen broken by helper
├─ Value: ₹25,000
└─ Evidence: Photos uploaded

Step 2: Initial Assessment
├─ Insurance team notified: < 1 hour
├─ Preliminary review: Valid claim
├─ Customer contacted: Documentation requested
└─ Helper statement recorded

Step 3: Investigation
├─ Helper interview conducted
├─ Work video footage reviewed
├─ Third-party assessment: ₹22,000
├─ Evidence verified: Claim valid ✓
└─ Approval granted

Step 4: Settlement
├─ Approved amount: ₹22,000
├─ Processing time: 5 business days
├─ Payment method: Bank transfer
├─ Status: Claim settled ✓
└─ Case closed

Total time: 7 days from report to payment
```

---

## 22. Admin Dashboard

### Dashboard Sections

#### 1. **Overview Analytics**
```
Today's Metrics (Nov 30, 2025):
┌─────────────────────────────────────┐
│ 📊 Active Bookings: 347           │
│ 👤 New Users: 125                  │
│ 💰 Revenue: ₹4,52,000              │
│ ⭐ Avg Rating: 4.6                 │
└─────────────────────────────────────┘

This Month:
├─ Total Bookings: 8,450
├─ GMV: ₹1.2 Crores
├─ Commission: ₹18 Lakhs
├─ Subscriptions: ₹4.5 Lakhs
└─ Total Revenue: ₹22.5 Lakhs

Growth:
├─ Users: +23% MoM
├─ Bookings: +35% MoM
└─ Revenue: +42% MoM
```

#### 2. **User Management**
```
Pending Verifications: 45
├─ Documents: 28
├─ Background checks: 12
└─ Skills certification: 5

Flagged Users: 8
├─ Trust score < 50: 3
├─ Multiple complaints: 5
└─ Payment issues: 0

Active Bans: 12
├─ Temporary: 8 (7-30 days)
└─ Permanent: 4
```

#### 3. **Financial Dashboard**
```
Revenue Breakdown (November):
├─ Commission: ₹18,00,000 (80%)
├─ Subscriptions: ₹4,50,000 (20%)
├─ Insurance: ₹50,000 (2%)
└─ Total: ₹22,50,000

Pending Payouts: ₹8,75,000
├─ Due today: ₹2,15,000
├─ Due this week: ₹6,60,000
└─ Processing: ₹45,000

Refunds Issued: ₹1,20,000
├─ Service cancellations: ₹85,000
└─ Disputes: ₹35,000
```

#### 4. **Support Queue**
```
Open Tickets: 67
├─ Urgent: 5 (🔴 SLA breach risk)
├─ High: 18
├─ Medium: 32
└─ Low: 12

Response Metrics:
├─ Avg First Response: 1.2 hours
├─ Avg Resolution: 8.5 hours
└─ CSAT Score: 4.5/5

Top Issues:
1. Payment delays (18 tickets)
2. Helper no-show (12 tickets)
3. Service quality (15 tickets)
```

---

## 23. Notifications System

### Notification Types

#### Push Notifications
```
Trigger Events:
├─ New bid received
├─ Booking confirmed
├─ Helper nearby (5 min ETA)
├─ Service started
├─ Payment successful
├─ Review reminder
├─ Promo code expiring soon
└─ Loyalty milestone reached
```

#### SMS Notifications
```
Critical Events:
├─ OTP for login
├─ Booking confirmation
├─ Payment receipt
├─ SOS alert triggered
└─ Withdrawal successful
```

#### Email Notifications
```
Regular Updates:
├─ Weekly booking summary
├─ Monthly earnings report
├─ New features announcement
├─ Subscription renewal reminder
└─ Marketing campaigns
```

### Example Notification Flow

```
Event: New booking request created

Customer Side:
├─ 0 min: "Request posted successfully" (Push)
├─ 5 min: "3 helpers viewed your request" (Push)
├─ 15 min: "You received 2 bids" (Push + SMS)
└─ Email: Bid summary with helper profiles

Helper Side (for 50 matched helpers):
├─ 0 min: "New request near you" (Push)
├─ Content: "AC Repair - 2.5 km away - ₹800-1,200"
├─ Action: "View Details" → "Submit Bid"
└─ If no action in 1 hour: Reminder push

After Bid Acceptance:
Customer:
├─ "Your request assigned to Ravi" (Push + SMS)
├─ Helper contact details shared
└─ Escrow payment link

Helper:
├─ "Congratulations! Bid accepted" (Push + SMS)
├─ Customer details shared
└─ "Start navigation" button

On Service Day:
Both receive:
├─ Morning reminder (8 AM)
├─ 1-hour before reminder
└─ "Helper on the way" (with live tracking)
```

---

## 24. Analytics & Reporting

### Helper Performance Reports

```
Helper: Ravi Sharma
Report Period: November 2025

Performance Summary:
┌──────────────────────────────────────┐
│ Total Jobs: 42                      │
│ Completion Rate: 98% (41/42)        │
│ Avg Rating: 4.8 ⭐                  │
│ Total Earnings: ₹84,500             │
│ Commission Paid: ₹12,675 (15%)      │
│ Net Earnings: ₹71,825               │
└──────────────────────────────────────┘

Category Breakdown:
├─ Plumbing: 25 jobs (₹50,000)
├─ Electrical: 12 jobs (₹24,000)
└─ General Repairs: 5 jobs (₹10,500)

Time Analysis:
├─ Total Hours Worked: 168 hours
├─ Avg Job Duration: 4 hours
├─ Hourly Rate: ₹500
└─ Peak Hours: 2 PM - 6 PM (35%)

Customer Satisfaction:
├─ 5 Stars: 85%
├─ 4 Stars: 12%
├─ 3 Stars: 3%
└─ Response Rate: 94%

Growth Opportunities:
! Consider Premium subscription
  → Save ₹8,450/month in commission
! Expand to AC servicing category
  → High demand in your area
```

### Platform Analytics

```
Platform Health Dashboard
Date: November 30, 2025

User Metrics:
├─ Total Users: 125,450
├─ Customers: 98,250 (78%)
├─ Helpers: 27,200 (22%)
├─ Daily Active: 12,500 (10%)
└─ Monthly Active: 45,000 (36%)

Booking Metrics:
├─ Total Bookings (MTD): 8,450
├─ Success Rate: 87%
├─ Cancellation Rate: 8%
└─ Dispute Rate: 5%

Financial Metrics:
├─ GMV: ₹1.2 Crores
├─ Revenue: ₹22.5 Lakhs
├─ AOV: ₹1,420
└─ Profit Margin: 42%

Geographic Distribution:
├─ Hyderabad: 35%
├─ Bangalore: 28%
├─ Mumbai: 20%
├─ Delhi: 12%
└─ Others: 5%

Top Categories:
1. Home Cleaning: 2,100 bookings
2. Plumbing: 1,850 bookings
3. Electrical: 1,650 bookings
4. AC Repair: 1,420 bookings
5. Painting: 1,430 bookings
```

---

## 🎯 Conclusion

Helparo provides a comprehensive, feature-rich platform that addresses all aspects of the on-demand local services market. With robust trust & safety mechanisms, multiple revenue streams, and user-centric features, the platform is positioned to become the leading services marketplace.

**Key Strengths:**
- ✅ 25+ service categories
- ✅ Multi-stakeholder platform (Customer, Helper, Admin)
- ✅ Advanced matching & bidding
- ✅ Strong monetization (Commission + Subscriptions + Bundles)
- ✅ Trust & safety first approach
- ✅ Gamification for engagement
- ✅ Scalable technology stack

---

**Document Version:** 1.0  
**Last Updated:** November 30, 2025  
**For:** Investor Presentation

*All features documented are implemented and ready for demonstration.*

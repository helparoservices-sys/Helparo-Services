# Firebase Studio Migration Prompt - Helparo Services

Copy and paste the following prompt into Firebase Studio:

---

## PROMPT START

Create a complete Firebase-based application called **"Helparo"** - an on-demand local services platform connecting customers with verified service providers (helpers). The application has 3 user roles: **Customer**, **Helper**, and **Admin**.

---

## 1. APPLICATION OVERVIEW

**Helparo** is a comprehensive on-demand local services marketplace with:
- Multi-role authentication (Customer, Helper, Admin)
- Service request and bidding system
- Real-time chat and video consultations
- Escrow-based payment system
- Trust & safety features (background checks, SOS)
- Gamification (loyalty points, badges, achievements)
- Subscription plans for helpers
- Promo codes and referral system

**Tech Stack Requirements:**
- Firebase Authentication (Email/Password, Google OAuth, Phone OTP)
- Cloud Firestore for database
- Firebase Storage for file uploads
- Firebase Cloud Functions for backend logic
- Firebase Cloud Messaging for push notifications
- Firebase Hosting for web app

**Currency:** INR (Indian Rupees ₹)
**Region:** India

---

## 2. DATABASE SCHEMA (Firestore Collections)

### 2.1 Users & Profiles

```
Collection: users
Document ID: {userId}
Fields:
  - email: string
  - phone: string
  - fullName: string
  - role: string (enum: "customer", "helper", "admin")
  - avatarUrl: string (nullable)
  - isVerified: boolean (default: false)
  - isActive: boolean (default: true)
  - isBanned: boolean (default: false)
  - state: string
  - district: string
  - city: string
  - address: string
  - pincode: string
  - latitude: number (nullable)
  - longitude: number (nullable)
  - fcmToken: string (nullable)
  - createdAt: timestamp
  - updatedAt: timestamp
  - lastLoginAt: timestamp
```

```
Collection: helperProfiles
Document ID: {userId}
Fields:
  - userId: string (reference to users)
  - serviceCategories: array<string> (category IDs)
  - skills: array<string>
  - hourlyRate: number
  - serviceRadius: number (in km, default: 10)
  - isApproved: boolean (default: false)
  - verificationStatus: string (enum: "pending", "approved", "rejected")
  - instantBookingEnabled: boolean (default: false)
  - emergencyAvailability: boolean (default: false)
  - isAvailableNow: boolean (default: false)
  - autoAccept: boolean (default: false)
  - completedJobs: number (default: 0)
  - totalEarnings: number (default: 0)
  - averageRating: number (default: 0)
  - totalReviews: number (default: 0)
  - responseTimeAvg: number (minutes, nullable)
  - bio: string (nullable)
  - experience: string (nullable)
  - languages: array<string>
  - workingHours: map {
      monday: { start: string, end: string, isWorking: boolean },
      tuesday: { start: string, end: string, isWorking: boolean },
      ...
    }
  - bankAccountId: string (nullable)
  - createdAt: timestamp
  - updatedAt: timestamp
```

### 2.2 Service Categories

```
Collection: serviceCategories
Document ID: {categoryId}
Fields:
  - name: string
  - slug: string (unique)
  - description: string
  - icon: string (icon name or URL)
  - parentId: string (nullable, for subcategories)
  - isActive: boolean (default: true)
  - sortOrder: number
  - basePrice: number (minimum price in INR)
  - priceUnit: string (enum: "per_hour", "per_job", "per_sqft")
  - createdAt: timestamp
```

**Default Categories to Create:**
1. Plumbing
2. Electrical
3. AC Repair & Service
4. Carpentry
5. Painting
6. Cleaning (Home, Deep, Office)
7. Pest Control
8. Appliance Repair
9. Computer & IT Support
10. Mobile Repair
11. Beauty & Salon
12. Fitness Training
13. Gardening & Landscaping
14. Moving & Packing
15. Home Renovation
16. Locksmith
17. Car Wash & Detailing
18. Photography
19. Event Planning
20. Tutoring

### 2.3 Service Requests

```
Collection: serviceRequests
Document ID: {requestId}
Fields:
  - customerId: string (reference to users)
  - categoryId: string (reference to serviceCategories)
  - title: string
  - description: string
  - images: array<string> (Storage URLs, max 5)
  - status: string (enum: "draft", "open", "assigned", "in_progress", "completed", "cancelled", "disputed")
  - urgencyLevel: string (enum: "normal", "urgent", "emergency")
  - budgetMin: number
  - budgetMax: number
  - finalPrice: number (nullable, set after acceptance)
  - scheduledDate: timestamp
  - scheduledTimeSlot: string (e.g., "10:00-12:00")
  - isFlexibleTime: boolean
  - serviceAddress: string
  - landmark: string (nullable)
  - latitude: number
  - longitude: number
  - assignedHelperId: string (nullable)
  - acceptedBidId: string (nullable)
  - bookingType: string (enum: "bidding", "instant")
  - startedAt: timestamp (nullable)
  - completedAt: timestamp (nullable)
  - cancelledAt: timestamp (nullable)
  - cancellationReason: string (nullable)
  - aiAnalysis: map (nullable) {
      estimatedPrice: number,
      estimatedDuration: number (hours),
      severity: string,
      requiredSkills: array<string>,
      materialsNeeded: array<string>,
      confidence: number (0-100)
    }
  - createdAt: timestamp
  - updatedAt: timestamp
```

### 2.4 Bids/Applications

```
Collection: bids
Document ID: {bidId}
Fields:
  - requestId: string (reference to serviceRequests)
  - helperId: string (reference to users)
  - status: string (enum: "applied", "accepted", "rejected", "withdrawn", "expired")
  - bidAmount: number (total in INR)
  - bidBreakdown: map {
      labor: number,
      materials: number,
      transportation: number,
      other: number
    }
  - estimatedDuration: number (hours)
  - coverNote: string (helper's message)
  - validUntil: timestamp
  - acceptedAt: timestamp (nullable)
  - rejectedAt: timestamp (nullable)
  - createdAt: timestamp
  - updatedAt: timestamp
```

### 2.5 Chat/Messages

```
Collection: conversations
Document ID: {conversationId}
Fields:
  - requestId: string (reference to serviceRequests)
  - customerId: string
  - helperId: string
  - lastMessage: string
  - lastMessageAt: timestamp
  - customerUnreadCount: number
  - helperUnreadCount: number
  - isActive: boolean
  - createdAt: timestamp

Subcollection: conversations/{conversationId}/messages
Document ID: {messageId}
Fields:
  - senderId: string
  - senderRole: string (enum: "customer", "helper")
  - content: string
  - type: string (enum: "text", "image", "document", "system")
  - attachmentUrl: string (nullable)
  - isRead: boolean (default: false)
  - readAt: timestamp (nullable)
  - createdAt: timestamp
```

### 2.6 Reviews & Ratings

```
Collection: reviews
Document ID: {reviewId}
Fields:
  - requestId: string
  - customerId: string
  - helperId: string
  - overallRating: number (1-5)
  - qualityRating: number (1-5)
  - punctualityRating: number (1-5)
  - communicationRating: number (1-5)
  - valueRating: number (1-5)
  - reviewText: string (nullable)
  - photos: array<string> (nullable)
  - helperResponse: string (nullable)
  - helperRespondedAt: timestamp (nullable)
  - isPublic: boolean (default: true)
  - createdAt: timestamp
```

### 2.7 Wallet & Payments

```
Collection: wallets
Document ID: {userId}
Fields:
  - userId: string
  - availableBalance: number (default: 0)
  - escrowBalance: number (default: 0)
  - totalEarnings: number (default: 0)
  - totalWithdrawn: number (default: 0)
  - currency: string (default: "INR")
  - updatedAt: timestamp
```

```
Collection: transactions
Document ID: {transactionId}
Fields:
  - walletId: string
  - userId: string
  - type: string (enum: "credit", "debit", "escrow_fund", "escrow_release", "withdrawal", "refund", "commission", "bonus")
  - amount: number
  - balanceBefore: number
  - balanceAfter: number
  - description: string
  - referenceId: string (nullable, e.g., requestId)
  - referenceType: string (nullable, e.g., "service_request")
  - status: string (enum: "pending", "completed", "failed")
  - createdAt: timestamp
```

```
Collection: escrows
Document ID: {escrowId}
Fields:
  - requestId: string
  - customerId: string
  - helperId: string
  - amount: number
  - platformFee: number (12% of amount)
  - helperAmount: number (88% of amount)
  - status: string (enum: "funded", "released", "refunded", "disputed")
  - fundedAt: timestamp
  - releasedAt: timestamp (nullable)
  - refundedAt: timestamp (nullable)
  - createdAt: timestamp
```

```
Collection: withdrawalRequests
Document ID: {withdrawalId}
Fields:
  - helperId: string
  - amount: number
  - bankAccountId: string
  - status: string (enum: "requested", "approved", "processing", "completed", "rejected", "failed")
  - rejectionReason: string (nullable)
  - processedBy: string (nullable, admin userId)
  - processedAt: timestamp (nullable)
  - transactionRef: string (nullable)
  - createdAt: timestamp
```

```
Collection: helperBankAccounts
Document ID: {accountId}
Fields:
  - helperId: string
  - accountType: string (enum: "bank", "upi")
  - bankName: string (nullable)
  - accountNumber: string (nullable, encrypted)
  - ifscCode: string (nullable)
  - accountHolderName: string
  - upiId: string (nullable)
  - isDefault: boolean
  - isVerified: boolean
  - createdAt: timestamp
```

### 2.8 Verification & Trust

```
Collection: verificationDocuments
Document ID: {documentId}
Fields:
  - userId: string
  - documentType: string (enum: "aadhaar", "pan", "driving_license", "voter_id", "passport")
  - documentNumber: string (encrypted)
  - frontImageUrl: string
  - backImageUrl: string (nullable)
  - status: string (enum: "pending", "verified", "rejected")
  - verifiedBy: string (nullable, admin userId)
  - verifiedAt: timestamp (nullable)
  - rejectionReason: string (nullable)
  - createdAt: timestamp
```

```
Collection: backgroundChecks
Document ID: {checkId}
Fields:
  - helperId: string
  - checkType: string (enum: "identity", "criminal", "address")
  - status: string (enum: "pending", "passed", "failed", "inconclusive")
  - provider: string
  - reportUrl: string (nullable)
  - checkedAt: timestamp (nullable)
  - validUntil: timestamp (nullable)
  - createdAt: timestamp
```

### 2.9 SOS Emergency System

```
Collection: sosAlerts
Document ID: {alertId}
Fields:
  - userId: string
  - userRole: string (enum: "customer", "helper")
  - requestId: string (nullable)
  - sosType: string (enum: "safety", "medical", "dispute", "other")
  - description: string (nullable)
  - latitude: number
  - longitude: number
  - status: string (enum: "active", "acknowledged", "resolved", "false_alarm", "cancelled")
  - acknowledgedBy: string (nullable, admin userId)
  - acknowledgedAt: timestamp (nullable)
  - resolvedBy: string (nullable)
  - resolvedAt: timestamp (nullable)
  - resolution: string (nullable)
  - createdAt: timestamp

Subcollection: sosAlerts/{alertId}/evidence
Document ID: {evidenceId}
Fields:
  - type: string (enum: "image", "video", "audio")
  - url: string
  - uploadedAt: timestamp
```

### 2.10 Notifications

```
Collection: notifications
Document ID: {notificationId}
Fields:
  - userId: string
  - title: string
  - body: string
  - type: string (enum: "new_request", "new_bid", "bid_accepted", "job_started", "job_completed", "payment", "sos", "system", "promo")
  - data: map (additional data based on type)
  - channel: string (enum: "push", "in_app", "email", "sms")
  - status: string (enum: "queued", "sent", "failed", "read")
  - readAt: timestamp (nullable)
  - createdAt: timestamp
```

### 2.11 Subscriptions (Helper Plans)

```
Collection: subscriptionPlans
Document ID: {planId}
Fields:
  - name: string (e.g., "Free", "Pro", "Premium")
  - price: number (monthly in INR)
  - features: array<string>
  - maxBidsPerDay: number
  - commissionRate: number (percentage)
  - priorityListing: boolean
  - badgeColor: string
  - isActive: boolean
  - createdAt: timestamp
```

```
Collection: helperSubscriptions
Document ID: {subscriptionId}
Fields:
  - helperId: string
  - planId: string
  - status: string (enum: "active", "cancelled", "expired", "past_due")
  - startDate: timestamp
  - endDate: timestamp
  - autoRenew: boolean
  - paymentMethod: string
  - createdAt: timestamp
```

### 2.12 Loyalty & Gamification

```
Collection: loyaltyPoints
Document ID: {userId}
Fields:
  - userId: string
  - pointsBalance: number (default: 0)
  - lifetimePoints: number (default: 0)
  - tierLevel: string (enum: "bronze", "silver", "gold", "platinum")
  - updatedAt: timestamp
```

```
Collection: loyaltyTransactions
Document ID: {transactionId}
Fields:
  - userId: string
  - points: number (positive for earn, negative for redeem)
  - type: string (enum: "earn_booking", "earn_review", "earn_referral", "redeem_discount", "expire", "bonus")
  - description: string
  - referenceId: string (nullable)
  - createdAt: timestamp
```

```
Collection: badges
Document ID: {badgeId}
Fields:
  - name: string
  - description: string
  - icon: string
  - criteria: map {
      type: string,
      threshold: number
    }
  - points: number (reward points)
  - createdAt: timestamp
```

```
Collection: userBadges
Document ID: auto
Fields:
  - userId: string
  - badgeId: string
  - earnedAt: timestamp
```

```
Collection: achievements
Document ID: {achievementId}
Fields:
  - name: string
  - description: string
  - icon: string
  - targetValue: number
  - rewardPoints: number
  - rewardType: string (enum: "points", "badge", "discount")
  - createdAt: timestamp
```

```
Collection: userAchievements
Document ID: auto
Fields:
  - userId: string
  - achievementId: string
  - currentProgress: number
  - isCompleted: boolean
  - completedAt: timestamp (nullable)
  - createdAt: timestamp
```

### 2.13 Referrals

```
Collection: referrals
Document ID: {referralId}
Fields:
  - referrerId: string
  - referredId: string
  - referredRole: string (enum: "customer", "helper")
  - referralCode: string
  - status: string (enum: "pending", "completed", "rewarded")
  - rewardAmount: number
  - rewardedAt: timestamp (nullable)
  - createdAt: timestamp
```

### 2.14 Promo Codes

```
Collection: promoCodes
Document ID: {promoId}
Fields:
  - code: string (unique, uppercase)
  - description: string
  - discountType: string (enum: "percentage", "fixed")
  - discountValue: number
  - minOrderValue: number
  - maxDiscount: number (nullable)
  - usageLimit: number (nullable)
  - usageCount: number (default: 0)
  - perUserLimit: number (default: 1)
  - applicableCategories: array<string> (nullable, all if empty)
  - validFrom: timestamp
  - validUntil: timestamp
  - isActive: boolean
  - createdBy: string (admin userId)
  - createdAt: timestamp
```

```
Collection: promoCodeUsages
Document ID: auto
Fields:
  - promoId: string
  - userId: string
  - requestId: string
  - discountAmount: number
  - usedAt: timestamp
```

### 2.15 Video Calls

```
Collection: videoCalls
Document ID: {callId}
Fields:
  - requestId: string (nullable)
  - customerId: string
  - helperId: string
  - callType: string (enum: "consultation", "support", "dispute")
  - status: string (enum: "scheduled", "in_progress", "completed", "missed", "cancelled")
  - scheduledAt: timestamp (nullable)
  - startedAt: timestamp (nullable)
  - endedAt: timestamp (nullable)
  - durationSeconds: number (nullable)
  - recordingUrl: string (nullable)
  - roomId: string (for video SDK)
  - createdAt: timestamp
```

### 2.16 Support Tickets

```
Collection: supportTickets
Document ID: {ticketId}
Fields:
  - userId: string
  - userRole: string
  - category: string (enum: "payment", "service", "helper", "technical", "other")
  - subject: string
  - description: string
  - priority: string (enum: "low", "medium", "high", "urgent")
  - status: string (enum: "open", "in_progress", "waiting_response", "resolved", "closed")
  - assignedTo: string (nullable, admin userId)
  - relatedRequestId: string (nullable)
  - createdAt: timestamp
  - updatedAt: timestamp
  - resolvedAt: timestamp (nullable)

Subcollection: supportTickets/{ticketId}/messages
Document ID: {messageId}
Fields:
  - senderId: string
  - senderRole: string (enum: "user", "admin")
  - content: string
  - attachments: array<string>
  - createdAt: timestamp
```

### 2.17 Time Tracking & Work Proof

```
Collection: workProofs
Document ID: {proofId}
Fields:
  - requestId: string
  - helperId: string
  - type: string (enum: "before", "during", "after")
  - imageUrl: string
  - description: string (nullable)
  - latitude: number (nullable)
  - longitude: number (nullable)
  - capturedAt: timestamp
```

```
Collection: jobCheckpoints
Document ID: auto
Fields:
  - requestId: string
  - helperId: string
  - checkpointType: string (enum: "arrived", "started", "paused", "resumed", "completed")
  - latitude: number
  - longitude: number
  - notes: string (nullable)
  - createdAt: timestamp
```

### 2.18 Admin Settings

```
Collection: platformSettings
Document ID: "config"
Fields:
  - commissionRate: number (default: 12, percentage)
  - minWithdrawalAmount: number (default: 500)
  - maxWithdrawalAmount: number (default: 50000)
  - referralRewardCustomer: number (default: 100)
  - referralRewardHelper: number (default: 200)
  - loyaltyPointsPerRupee: number (default: 1)
  - sosResponseTimeSLA: number (minutes, default: 5)
  - bidExpiryHours: number (default: 24)
  - requestExpiryHours: number (default: 48)
  - maintenanceMode: boolean (default: false)
  - updatedAt: timestamp
  - updatedBy: string
```

---

## 3. CLOUD FUNCTIONS

### 3.1 Authentication Triggers

```javascript
// On user creation - create profile and wallet
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  // Create user document in Firestore
  // Create wallet with 0 balance
  // Send welcome email
  // If referral code provided, create referral record
});

// On user deletion - cleanup
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
  // Soft delete user data
  // Cancel pending requests
  // Handle wallet balance
});
```

### 3.2 Service Request Functions

```javascript
// When request created - notify helpers
exports.onRequestCreated = functions.firestore
  .document('serviceRequests/{requestId}')
  .onCreate(async (snap, context) => {
    // Find matching helpers based on:
    //   - Category match
    //   - Location within service radius
    //   - Availability
    //   - Not banned
    // Send push notifications to matched helpers
    // Create notification records
  });

// When request status changes
exports.onRequestStatusChange = functions.firestore
  .document('serviceRequests/{requestId}')
  .onUpdate(async (change, context) => {
    // Handle status transitions
    // If assigned -> notify helper
    // If completed -> trigger payment release
    // If cancelled -> process refund
    // Send appropriate notifications
  });
```

### 3.3 Bid Functions

```javascript
// When bid created - notify customer
exports.onBidCreated = functions.firestore
  .document('bids/{bidId}')
  .onCreate(async (snap, context) => {
    // Get request details
    // Notify customer of new bid
    // Update request bid count
  });

// When bid accepted
exports.onBidAccepted = functions.firestore
  .document('bids/{bidId}')
  .onUpdate(async (change, context) => {
    // If status changed to 'accepted':
    //   - Update request status to 'assigned'
    //   - Reject all other bids
    //   - Create escrow
    //   - Notify helper
    //   - Create conversation for chat
  });
```

### 3.4 Payment Functions

```javascript
// Fund escrow
exports.fundEscrow = functions.https.onCall(async (data, context) => {
  // Verify user is customer
  // Verify request exists and belongs to user
  // Calculate amount with platform fee
  // Deduct from customer wallet or process payment
  // Create escrow record
  // Update request status
  // Return success/failure
});

// Release escrow to helper
exports.releaseEscrow = functions.https.onCall(async (data, context) => {
  // Verify request is completed
  // Calculate helper amount (total - commission)
  // Update escrow status
  // Credit helper wallet
  // Create transaction records
  // Send notifications
});

// Process withdrawal request
exports.processWithdrawal = functions.https.onCall(async (data, context) => {
  // Admin only
  // Verify helper has sufficient balance
  // Deduct from wallet
  // Update withdrawal status
  // Trigger bank transfer (integrate with payment gateway)
});
```

### 3.5 Notification Functions

```javascript
// Send push notification
exports.sendPushNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    // Get user FCM token
    // Build notification payload
    // Send via FCM
    // Update notification status
  });

// Scheduled: Send reminder notifications
exports.sendReminders = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    // Find upcoming scheduled requests
    // Send reminders 24h and 1h before
    // Find pending reviews
    // Send review reminders
  });
```

### 3.6 SOS Functions

```javascript
// On SOS alert created
exports.onSOSCreated = functions.firestore
  .document('sosAlerts/{alertId}')
  .onCreate(async (snap, context) => {
    // Immediately notify all online admins
    // Send SMS to emergency contacts
    // Log location
    // Start 5-minute SLA timer
  });
```

### 3.7 Gamification Functions

```javascript
// Award loyalty points
exports.awardLoyaltyPoints = functions.firestore
  .document('serviceRequests/{requestId}')
  .onUpdate(async (change, context) => {
    // If status changed to 'completed':
    //   - Award points to customer (1 point per ₹100)
    //   - Check tier upgrade
    //   - Check badge eligibility
  });

// Check and award badges
exports.checkBadgeEligibility = functions.https.onCall(async (data, context) => {
  // Get user stats
  // Compare against badge criteria
  // Award earned badges
  // Create notification
});
```

### 3.8 Scheduled Cleanup Functions

```javascript
// Expire old requests
exports.expireOldRequests = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context) => {
    // Find requests older than 48 hours with status 'open'
    // Update status to 'expired'
    // Notify customers
  });

// Expire old bids
exports.expireOldBids = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    // Find bids past validUntil
    // Update status to 'expired'
  });
```

---

## 4. SECURITY RULES

### 4.1 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isHelper() {
      return hasRole('helper');
    }
    
    function isCustomer() {
      return hasRole('customer');
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Helper profiles
    match /helperProfiles/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId) && isHelper();
      allow update: if isOwner(userId) || isAdmin();
    }
    
    // Service requests
    match /serviceRequests/{requestId} {
      allow read: if isAuthenticated();
      allow create: if isCustomer();
      allow update: if isOwner(resource.data.customerId) || 
                      isOwner(resource.data.assignedHelperId) || 
                      isAdmin();
    }
    
    // Bids
    match /bids/{bidId} {
      allow read: if isAuthenticated();
      allow create: if isHelper();
      allow update: if isOwner(resource.data.helperId) || 
                      isOwner(get(/databases/$(database)/documents/serviceRequests/$(resource.data.requestId)).data.customerId);
    }
    
    // Messages - only participants can read/write
    match /conversations/{conversationId} {
      allow read, write: if isOwner(resource.data.customerId) || 
                           isOwner(resource.data.helperId);
      
      match /messages/{messageId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/conversations/$(conversationId)).data.customerId) ||
                             isOwner(get(/databases/$(database)/documents/conversations/$(conversationId)).data.helperId);
      }
    }
    
    // Wallets - only owner can read
    match /wallets/{userId} {
      allow read: if isOwner(userId);
      allow write: if false; // Only via Cloud Functions
    }
    
    // Transactions - only owner can read
    match /transactions/{transactionId} {
      allow read: if isOwner(resource.data.userId);
      allow write: if false; // Only via Cloud Functions
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if true; // Public
      allow create: if isCustomer() && isOwner(request.resource.data.customerId);
      allow update: if isOwner(resource.data.helperId); // Helper can respond
    }
    
    // SOS Alerts
    match /sosAlerts/{alertId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated();
      allow update: if isAdmin();
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      allow update: if isOwner(resource.data.userId); // Mark as read
      allow write: if false; // Only via Cloud Functions
    }
    
    // Admin-only collections
    match /platformSettings/{document} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /subscriptionPlans/{planId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /promoCodes/{promoId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /verificationDocuments/{docId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isOwner(request.resource.data.userId);
      allow update: if isAdmin();
    }
  }
}
```

### 4.2 Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Profile avatars
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth.uid == userId &&
                     request.resource.size < 5 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
    }
    
    // KYC documents (private)
    match /kyc/{userId}/{fileName} {
      allow read: if request.auth.uid == userId || 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == userId &&
                     request.resource.size < 10 * 1024 * 1024;
    }
    
    // Work proof photos
    match /workProofs/{requestId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     request.resource.size < 10 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
    }
    
    // Chat attachments
    match /chatAttachments/{conversationId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     request.resource.size < 10 * 1024 * 1024;
    }
    
    // SOS evidence
    match /sosEvidence/{alertId}/{fileName} {
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth != null;
    }
    
    // Review photos
    match /reviewPhotos/{reviewId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null &&
                     request.resource.size < 5 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 5. USER INTERFACES

### 5.1 Customer App Screens

1. **Authentication**
   - Login (Email/Phone/Google)
   - Register
   - Forgot Password
   - OTP Verification

2. **Dashboard**
   - Welcome message
   - Active requests summary
   - Recent bookings
   - Quick action buttons

3. **Service Discovery**
   - Category grid
   - Search
   - Service details
   - Helper listings

4. **Request Creation**
   - Category selection
   - Description & photos
   - Location picker with map
   - Date/time scheduler
   - Budget range
   - Review & submit

5. **My Requests**
   - Active tab
   - Completed tab
   - Cancelled tab
   - Request detail view

6. **Bid Management**
   - View all bids
   - Compare bids
   - Helper profiles
   - Accept/reject actions

7. **Booking Detail**
   - Status timeline
   - Helper info
   - Chat button
   - Video call button
   - Work proof gallery
   - Cancel button
   - Complete & review

8. **Chat**
   - Message list
   - Real-time messaging
   - Image sharing
   - Request context

9. **Reviews**
   - Star ratings
   - Detailed ratings
   - Written review
   - Photo upload

10. **Profile & Settings**
    - Edit profile
    - Addresses
    - Notifications preferences
    - Help & Support

11. **Emergency SOS**
    - Quick trigger button
    - Location sharing
    - Evidence upload

### 5.2 Helper App Screens

1. **Authentication**
   - Login
   - Register as Helper
   - Document upload
   - Verification status

2. **Dashboard**
   - Online/offline toggle
   - Today's earnings
   - Active jobs
   - Rating summary
   - Quick stats

3. **Browse Requests**
   - Available requests list
   - Filters (category, distance, budget)
   - Request details
   - Submit bid form

4. **My Bids**
   - Pending bids
   - Accepted bids
   - Rejected/expired bids
   - Bid history

5. **My Jobs**
   - Assigned jobs
   - In-progress jobs
   - Completed jobs
   - Job details with timeline

6. **Job Execution**
   - Start job button
   - Upload work proofs
   - Checkpoint logging
   - Complete job
   - Customer signature (optional)

7. **Earnings**
   - Balance overview
   - Transaction history
   - Withdrawal request
   - Bank account management

8. **Profile**
   - Service categories
   - Hourly rates
   - Service areas
   - Working hours
   - Verification status

9. **Ratings & Reviews**
   - Overall rating
   - Review list
   - Response to reviews

10. **Settings**
    - Notification preferences
    - Instant booking toggle
    - Emergency availability
    - Help & Support

### 5.3 Admin Web Dashboard

1. **Overview Dashboard**
   - Key metrics (users, requests, revenue)
   - Charts & graphs
   - Recent activity feed
   - SOS alerts widget

2. **User Management**
   - Customer list
   - Helper list
   - Admin list
   - User details
   - Ban/suspend actions

3. **Helper Verification**
   - Pending verifications queue
   - Document review
   - Approve/reject actions
   - Background check status

4. **Request Management**
   - All requests list
   - Filters by status
   - Request details
   - Intervention actions

5. **Payment Management**
   - Transaction history
   - Withdrawal requests
   - Approve/reject withdrawals
   - Refund processing

6. **SOS Management**
   - Active SOS alerts
   - Alert details
   - Resolution actions
   - SOS history

7. **Categories**
   - Category list
   - Add/edit categories
   - Subcategories
   - Pricing configuration

8. **Promotions**
   - Promo codes list
   - Create promo code
   - Usage statistics

9. **Subscriptions**
   - Plan management
   - Subscriber list
   - Revenue reports

10. **Support Tickets**
    - Open tickets
    - Ticket detail
    - Response interface
    - Resolution tracking

11. **Analytics**
    - User growth
    - Request trends
    - Revenue analytics
    - Geographic distribution
    - Helper performance

12. **Settings**
    - Platform configuration
    - Commission rates
    - SLA settings
    - Notification templates

---

## 6. INTEGRATIONS REQUIRED

### 6.1 Maps & Location
- **Google Maps SDK** for maps display
- **Google Places API** for address autocomplete
- **Google Geocoding API** for lat/lng conversion

### 6.2 Payments (Future)
- **Razorpay** or **Cashfree** for:
  - UPI payments
  - Card payments
  - Bank transfers for withdrawals

### 6.3 Video Calls
- **Agora** or **Twilio** for video consultations

### 6.4 SMS/OTP
- **Firebase Phone Auth** for OTP
- **MSG91** or **Twilio** for transactional SMS

### 6.5 Email
- **Firebase Extensions - Trigger Email** with SendGrid/Mailgun

### 6.6 AI (Optional)
- **Google Vertex AI** or **Gemini API** for:
  - Job photo analysis
  - Price estimation
  - Smart matching

---

## 7. INITIAL DATA TO SEED

### 7.1 Service Categories
Create 20 categories as listed in section 2.2

### 7.2 Subscription Plans
```
1. Free Plan
   - Price: ₹0
   - Max bids/day: 5
   - Commission: 15%
   - Priority: No

2. Pro Plan
   - Price: ₹499/month
   - Max bids/day: 20
   - Commission: 12%
   - Priority: Yes
   - Badge: Blue

3. Premium Plan
   - Price: ₹999/month
   - Max bids/day: Unlimited
   - Commission: 10%
   - Priority: Yes
   - Badge: Gold
   - Featured listing
```

### 7.3 Badges
```
1. "Newcomer" - Complete profile
2. "First Job" - Complete first job
3. "Rising Star" - 10 jobs completed
4. "Pro Helper" - 50 jobs completed
5. "Expert" - 100 jobs completed
6. "5-Star Champion" - Maintain 5.0 rating for 10 jobs
7. "Speed Demon" - Average response time < 5 minutes
8. "Trusted Helper" - Background check verified
9. "Top Earner" - Earn ₹50,000 in a month
10. "Community Hero" - 5 successful referrals
```

### 7.4 Platform Settings
```
{
  commissionRate: 12,
  minWithdrawalAmount: 500,
  maxWithdrawalAmount: 50000,
  referralRewardCustomer: 100,
  referralRewardHelper: 200,
  loyaltyPointsPerRupee: 1,
  sosResponseTimeSLA: 5,
  bidExpiryHours: 24,
  requestExpiryHours: 48,
  maintenanceMode: false
}
```

### 7.5 Admin User
Create first admin user for dashboard access

---

## 8. TESTING SCENARIOS

### 8.1 Customer Flow
1. Register as customer
2. Browse categories
3. Create service request with photos
4. Receive and compare bids
5. Accept a bid
6. Chat with helper
7. Track job progress
8. Complete job and submit review
9. Check loyalty points earned

### 8.2 Helper Flow
1. Register as helper
2. Upload verification documents
3. Wait for approval
4. Set up service profile
5. Browse available requests
6. Submit bid with breakdown
7. Get bid accepted
8. Start job and upload proofs
9. Complete job
10. Check earnings and withdraw

### 8.3 Admin Flow
1. Login to admin dashboard
2. Review helper verification queue
3. Approve/reject helpers
4. Monitor active SOS alerts
5. Process withdrawal requests
6. Create promo codes
7. View analytics

---

## 9. DEPLOYMENT CONFIGURATION

### 9.1 Firebase Project Setup
- Create Firebase project: "helparo-production"
- Enable Authentication (Email, Google, Phone)
- Create Firestore database (production mode)
- Create Storage bucket
- Deploy Cloud Functions
- Set up Firebase Hosting

### 9.2 Environment Variables
```
GOOGLE_MAPS_API_KEY=xxx
RAZORPAY_KEY_ID=xxx (future)
RAZORPAY_KEY_SECRET=xxx (future)
AGORA_APP_ID=xxx
SENDGRID_API_KEY=xxx
ADMIN_EMAIL=admin@helparo.com
```

### 9.3 Indexes Required
Create composite indexes for:
- serviceRequests: (status, categoryId, createdAt)
- serviceRequests: (customerId, status, createdAt)
- bids: (requestId, status, createdAt)
- bids: (helperId, status, createdAt)
- transactions: (userId, createdAt)
- notifications: (userId, status, createdAt)

---

## PROMPT END

---

**Notes for Firebase Studio:**
1. Start with authentication and user management
2. Then implement service request flow
3. Add payment/wallet system
4. Implement real-time features (chat, notifications)
5. Add gamification last
6. Test each feature before moving to next

**Priority Order:**
1. Auth + Users + Profiles (Critical)
2. Categories + Requests + Bids (Critical)
3. Chat + Notifications (High)
4. Reviews + Ratings (High)
5. Wallet + Payments (Medium - hidden for now)
6. SOS + Safety (Medium)
7. Gamification + Loyalty (Low)
8. Subscriptions + Promos (Low - hidden for now)

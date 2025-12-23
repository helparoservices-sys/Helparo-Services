# 🔔 Helparo Push Notification System

> **Optimized for Minimal Backend Cost**

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Event → Push Decision Table](#event-push-decision-table)
3. [Push Payload Schemas](#push-payload-schemas)
4. [DB Fetch Rules](#db-fetch-rules)
5. [Push + Realtime Coordination](#push-realtime-coordination)
6. [Anti-Egress Checklist](#anti-egress-checklist)
7. [Common Anti-Patterns to AVOID](#common-anti-patterns-to-avoid)
8. [Implementation Guide](#implementation-guide)

---

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUSH NOTIFICATION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌────────────┐    ┌─────────┐    ┌──────────┐ │
│  │  Event   │───▶│ Dispatcher │───▶│   FCM   │───▶│  Device  │ │
│  │ Trigger  │    │            │    │         │    │          │ │
│  └──────────┘    └────────────┘    └─────────┘    └──────────┘ │
│       │              │                                │         │
│       │              ▼                                ▼         │
│       │         ┌─────────┐                    ┌──────────┐    │
│       │         │ Checks: │                    │ Render   │    │
│       │         │ • Dedupe│                    │ from     │    │
│       │         │ • Rate  │                    │ payload  │    │
│       │         │ • Quiet │                    │ (NO DB!) │    │
│       │         └─────────┘                    └──────────┘    │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────┐                                                  │
│  │ Record   │    ❌ NO automatic DB fetch on push receipt      │
│  │ in DB    │    ❌ NO full-page reload on notification tap    │
│  └──────────┘    ❌ NO "fetch all" on notification open        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Principles

| Principle | Rule |
|-----------|------|
| **Payload Self-Sufficiency** | Push contains ALL data needed to render UI |
| **No Auto-Fetch** | Push receipt → Show notification, NOT trigger DB fetch |
| **Scoped Fetch Only** | DB reads ONLY on explicit user interaction |
| **Single Source** | Use Push OR Realtime per event, never both |
| **Deduplicate Everything** | Dedupe at server, dedupe at client |

---

## 📊 Event → Push Decision Table

### Customer Events

| Event | Push? | Realtime? | Priority | TTL | Rate Limit | Quiet Hours |
|-------|-------|-----------|----------|-----|------------|-------------|
| `booking_abandoned` | ✅ | ❌ | Normal | 1hr | 1/hr, 2/day | ✅ |
| `helpers_searching` | ❌ | ✅ | - | - | - | - |
| `helper_applied` | ✅ | ❌ | High | 30min | 10/hr, 50/day | ❌ |
| `helper_assigned` | ✅ | ✅* | High | 1hr | 5/hr, 20/day | ❌ |
| `job_started` | ✅ | ❌ | High | 1hr | 5/hr, 20/day | ❌ |
| `job_completed` | ✅ | ❌ | High | 2hr | 5/hr, 20/day | ❌ |
| `payment_pending` | ✅ | ❌ | Normal | 24hr | 1/hr, 3/day | ✅ |
| `no_helpers_found` | ✅ | ❌ | Normal | 30min | 2/hr, 5/day | ❌ |
| `re_engagement` | ✅ | ❌ | Normal | 24hr | 1/hr, 1/day | ✅ |

### Helper Events

| Event | Push? | Realtime? | Priority | TTL | Rate Limit | Quiet Hours |
|-------|-------|-----------|----------|-----|------------|-------------|
| `new_job_nearby` | ✅ | ❌ | High | 60s | 30/hr, 100/day | ❌ |
| `job_expiring` | ✅ | ❌ | High | 30s | 10/hr, 50/day | ❌ |
| `job_accepted` | ✅ | ✅* | High | 1hr | 5/hr, 20/day | ❌ |
| `job_rejected` | ✅ | ❌ | Normal | 30min | 10/hr, 50/day | ❌ |
| `customer_otp_shared` | ✅ | ❌ | High | 10min | 5/hr, 20/day | ❌ |
| `payment_credited` | ✅ | ❌ | Normal | 24hr | 5/hr, 20/day | ✅ |
| `inactivity_reminder` | ✅ | ❌ | Normal | 24hr | 1/hr, 1/day | ✅ |
| `document_expiring` | ✅ | ❌ | Normal | 24hr | 1/hr, 2/day | ✅ |

> *✅* = Push PRIMARY, Realtime BACKUP (client must dedupe)

---

## 📦 Push Payload Schemas

### Base Payload (ALL notifications)

```json
{
  "type": "helper_applied",
  "requestId": "uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1"
}
```

### Customer: Helper Applied

```json
{
  "type": "helper_applied",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1",
  "helperName": "Raju K.",
  "helperRating": "4.8",
  "proposedPrice": "₹599",
  "serviceTitle": "Plumbing - Tap Repair",
  "totalBids": "3"
}
```

### Customer: Job Started

```json
{
  "type": "job_started",
  "requestId": "uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1",
  "helperName": "Raju K.",
  "serviceTitle": "Plumbing - Tap Repair",
  "startTime": "2:30 PM"
}
```

### Customer: Job Completed

```json
{
  "type": "job_completed",
  "requestId": "uuid",
  "timestamp": "2024-01-15T11:15:00Z",
  "version": "1",
  "helperName": "Raju K.",
  "serviceTitle": "Plumbing - Tap Repair",
  "finalAmount": "₹650",
  "duration": "45 mins",
  "paymentStatus": "pending"
}
```

### Helper: New Job Nearby

```json
{
  "type": "new_job_nearby",
  "requestId": "uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1",
  "jobTitle": "Plumbing - Tap Repair",
  "price": "₹400-600",
  "distance": "2.3 km",
  "location": "Labbipet, Vijayawada",
  "urgency": "normal",
  "expiresAt": "2024-01-15T10:31:00Z"
}
```

### Helper: Payment Credited

```json
{
  "type": "payment_credited",
  "requestId": "uuid",
  "timestamp": "2024-01-15T12:00:00Z",
  "version": "1",
  "amount": "₹599",
  "newBalance": "₹2,450",
  "jobTitle": "Plumbing - Tap Repair"
}
```

---

## 🚫 DB Fetch Rules

### FORBIDDEN vs ALLOWED

```
┌─────────────────────────────────────────────────────────────────┐
│                     FETCH DECISION TREE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push/Realtime Event Received                                    │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────────┐                                         │
│  │ Can I render UI    │                                         │
│  │ from payload data? │                                         │
│  └────────────────────┘                                         │
│           │                                                      │
│      YES  │  NO                                                  │
│           ▼   ▼                                                  │
│   ┌───────────┐  ┌─────────────────┐                           │
│   │ Render UI │  │ Is this from    │                           │
│   │ NO FETCH! │  │ user tap/click? │                           │
│   └───────────┘  └─────────────────┘                           │
│                          │                                       │
│                     YES  │  NO                                   │
│                          ▼   ▼                                   │
│              ┌───────────────┐  ┌─────────────────┐            │
│              │ SCOPED fetch  │  │ DO NOT FETCH!   │            │
│              │ (1 record)    │  │ Wait for tap    │            │
│              └───────────────┘  └─────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Per-Event Fetch Rules

| Event | On Receipt | On Tap | On User Action |
|-------|------------|--------|----------------|
| `helper_applied` | ❌ FORBIDDEN | ❌ FORBIDDEN | ✅ Fetch bids list |
| `job_started` | ❌ FORBIDDEN | ✅ Fetch 1 job | ✅ Fetch details |
| `new_job_nearby` | ❌ FORBIDDEN | ❌ FORBIDDEN | ✅ Fetch if "More Details" |
| `payment_credited` | ❌ FORBIDDEN | ❌ FORBIDDEN | ✅ Fetch transaction |
| `job_completed` | ❌ FORBIDDEN | ✅ Fetch 1 job | ✅ Full details |

### What "SCOPED" Means

```sql
-- ✅ ALLOWED: Single record by ID
SELECT * FROM service_requests WHERE id = 'uuid' LIMIT 1;

-- ❌ FORBIDDEN: List fetch
SELECT * FROM service_requests WHERE customer_id = 'uuid';

-- ❌ FORBIDDEN: Join-heavy fetch
SELECT * FROM service_requests 
JOIN profiles ON ... 
JOIN request_applications ON ...
WHERE ...;
```

---

## 🔄 Push + Realtime Coordination

### Channel Ownership

```
┌─────────────────────────────────────────────────────────────────┐
│              WHO OWNS THE DATA DELIVERY?                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │   PUSH ONLY     │  Events that don't need live updates       │
│  │                 │  • booking_abandoned                        │
│  │                 │  • payment_pending                          │
│  │                 │  • payment_credited                         │
│  │                 │  • re_engagement                            │
│  │                 │  • inactivity_reminder                      │
│  │                 │  • document_expiring                        │
│  │                 │  • job_rejected                             │
│  │                 │  • no_helpers_found                         │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │  REALTIME ONLY  │  App likely open, watching live            │
│  │                 │  • helpers_searching (progress bar)         │
│  └─────────────────┘                                            │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ PUSH + REALTIME │  Critical events, ensure delivery          │
│  │ (Client Dedupe) │  • helper_applied                          │
│  │                 │  • helper_assigned                          │
│  │                 │  • job_started                              │
│  │                 │  • job_completed                            │
│  │                 │  • new_job_nearby                           │
│  │                 │  • job_accepted                             │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Client-Side Deduplication

```typescript
// When push arrives
const eventKey = `${payload.type}:${payload.requestId}:${payload.timestamp}`
if (eventTracker.hasProcessed(eventKey)) {
  console.log('Already processed by realtime, skipping')
  return
}
eventTracker.markProcessed(eventKey)
// Handle the push

// When realtime arrives
const eventKey = `${eventType}:${record.id}:${record.created_at}`
if (eventTracker.hasProcessed(eventKey)) {
  console.log('Already processed by push, skipping')
  return
}
eventTracker.markProcessed(eventKey)
// Handle the realtime
```

---

## ✅ Anti-Egress Checklist

### Before Sending Push

- [ ] Is this event type configured for push? (Check `PUSH_DECISIONS`)
- [ ] Has this exact notification been sent? (Dedupe check)
- [ ] Is user in quiet hours? (Queue if yes)
- [ ] Is rate limit exceeded? (Skip if yes)
- [ ] Does payload contain ALL data to render? (No placeholders)
- [ ] Are all values pre-formatted? (₹599, not 599)

### Before Client Fetch

- [ ] Is this triggered by user interaction? (tap, button click)
- [ ] Is the fetch scoped to a single record?
- [ ] Was this data already in the push payload?
- [ ] Am I fetching the same data realtime already provides?
- [ ] Will this query return < 10 records?

### Realtime Subscriptions

- [ ] Does user have an active push token?
- [ ] If yes: Only subscribe for in-app live updates
- [ ] If no: Subscribe for critical event notifications
- [ ] Never subscribe to tables handled by push-only events

---

## 🚨 Common Anti-Patterns to AVOID

### ❌ Anti-Pattern 1: Auto-Refresh on Push

```typescript
// ❌ WRONG
PushNotifications.addListener('pushNotificationReceived', () => {
  // Fetches ALL bookings from DB
  refreshBookings()  // ← NEVER DO THIS
})

// ✅ CORRECT
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  // Update local state from payload only
  updateLocalState(notification.data)
})
```

### ❌ Anti-Pattern 2: Fetch-on-Navigate

```typescript
// ❌ WRONG
// In JobDetails screen
useEffect(() => {
  // Fetches job from DB every time
  fetchJob(jobId)  // ← WRONG if navigated from notification
}, [jobId])

// ✅ CORRECT
function JobDetails({ route }) {
  const { jobId, initialData } = route.params
  const [job, setJob] = useState(initialData)  // ← From push payload
  
  // Only fetch if user explicitly requests refresh
  const handleRefresh = () => fetchJob(jobId)
}
```

### ❌ Anti-Pattern 3: Double Subscription

```typescript
// ❌ WRONG
// Subscribe to realtime for helper_applied
supabase.channel('bids').on('INSERT', () => {
  fetchAllBids()  // ← Called on every bid
})
// AND also handle push for helper_applied
// Result: 2 fetches for same event

// ✅ CORRECT
// Use push for helper_applied, realtime only for in-app progress
// Client dedupes based on event key
```

### ❌ Anti-Pattern 4: Unscoped Queries

```typescript
// ❌ WRONG
// On notification tap
const { data } = await supabase
  .from('service_requests')
  .select('*, profiles(*), request_applications(*)')
  .eq('customer_id', userId)  // ← Fetches ALL requests

// ✅ CORRECT
const { data } = await supabase
  .from('service_requests')
  .select('*')
  .eq('id', requestId)  // ← Single record only
  .single()
```

### ❌ Anti-Pattern 5: Fetching What's in Payload

```typescript
// ❌ WRONG
// Push payload already has: { helperName, helperRating, proposedPrice }
// But then you do:
const { data: helper } = await supabase
  .from('profiles')
  .select('name, rating')
  .eq('id', helperId)
  .single()

// ✅ CORRECT
// Just use payload data
const { helperName, helperRating } = notification.data
```

### ❌ Anti-Pattern 6: Full Page Reload

```typescript
// ❌ WRONG
PushNotifications.addListener('pushNotificationActionPerformed', () => {
  window.location.reload()  // ← Reloads everything, fetches all data
})

// ✅ CORRECT
PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
  navigation.navigate('Screen', { 
    data: action.notification.data  // ← Pass payload, no reload
  })
})
```

---

## 🛠️ Implementation Guide

### 1. Server-Side Usage

```typescript
import { 
  notifyHelperApplied,
  notifyJobStarted,
  notifyNewJobNearby 
} from '@/lib/push-system'

// When helper applies for a job
await notifyHelperApplied({
  customerId: request.customer_id,
  requestId: request.id,
  helperName: helper.name,
  helperRating: helper.rating,
  proposedPrice: application.proposed_price,
  serviceTitle: request.service_type,
  totalBids: bidCount,
})

// When broadcasting job to helpers
await notifyNewJobNearby({
  helperIds: nearbyHelpers.map(h => h.id),
  requestId: request.id,
  jobTitle: request.service_type,
  minPrice: request.min_price,
  maxPrice: request.max_price,
  distance: helperDistances,
  location: request.area_name,
  urgency: request.is_emergency ? 'emergency' : 'normal',
  expiresAt: new Date(Date.now() + 60000),
})
```

### 2. Client-Side Setup

```typescript
import { 
  initPushNotificationHandler,
  subscribeToNotificationState,
  getTotalBadgeCount 
} from '@/lib/push-system'

// In app entry point
useEffect(() => {
  initPushNotificationHandler()
}, [])

// In component
useEffect(() => {
  return subscribeToNotificationState((state) => {
    setBadgeCount(getTotalBadgeCount())
    setLatestBid(state.latestBid)
  })
}, [])
```

### 3. File Structure

```
src/lib/push-system/
├── index.ts           # Barrel export
├── types.ts           # All types, schemas, decision tables
├── dispatcher.ts      # Server-side send logic
├── handlers.ts        # Event-specific handlers
├── coordination.ts    # Push + Realtime rules
└── client-handler.ts  # Client-side notification handling
```

---

## 📈 Cost Savings Estimate

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| DB reads per push | ~5 | 0-1 | 80-100% |
| Realtime subscriptions | All tables | 2-3 tables | 60% |
| Duplicate events | Common | Eliminated | 100% |
| API calls per notification tap | 3-5 | 0-1 | 80% |

---

## 🔗 Related Files

- [types.ts](src/lib/push-system/types.ts) - Type definitions and schemas
- [dispatcher.ts](src/lib/push-system/dispatcher.ts) - Server-side dispatch logic
- [handlers.ts](src/lib/push-system/handlers.ts) - Event handlers
- [coordination.ts](src/lib/push-system/coordination.ts) - Push/Realtime coordination
- [client-handler.ts](src/lib/push-system/client-handler.ts) - Client-side handling

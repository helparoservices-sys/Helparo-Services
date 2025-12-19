# Re-broadcast Notification Testing Guide

## Problem
When a helper cancels an accepted job, the re-broadcast should notify other helpers. 
Currently, the second/third helper isn't receiving the notification popup.

## Debugging Steps

### 1. Check Helper Status
Visit: `http://localhost:3000/api/debug/reset-helpers`
- Both helpers should have `is_on_job: false`
- At least one helper should have `is_online: true` OR `is_available_now: true`

### 2. Check Notifications in Database
Visit: `http://localhost:3000/api/debug/broadcast-status`
- Look for notifications with `status: "sent"` and recent `sent_at` timestamps
- Note the `request_id` for the active broadcasting job

### 3. As the "Third" Helper, Check Your Notifications
Login as the helper who should receive the notification and visit:
`http://localhost:3000/api/debug/my-notifications`

This will show:
- `userRole`: Should be "helper"
- `helperProfile.is_on_job`: Should be false
- `rlsNotifications`: Notifications visible via RLS
- `rlsNotificationsWithJoin`: Notifications with service_request data (critical for popup)
- `adminNotifications`: All notifications for this helper

**Key Issue Indicators**:
- If `adminCount > 0` but `rlsCount = 0` → RLS is blocking broadcast_notifications
- If `rlsCount > 0` but `rlsJoinCount = 0` → RLS is blocking the service_request JOIN
- If all counts are 0 → No pending notifications for this helper

### 4. Check Browser Console
Open the helper dashboard and look for these logs in the browser console:
- `🔔 Starting polling fallback for helper:` - Poll is running
- `🔔 [POLL] Query result - Found notification ID:` - Notification found
- `🔔 [POLL] Query result - No notification found` - No pending notifications
- `🔔 [REALTIME] New job notification received via realtime:` - Realtime working

### 5. Test Rebroadcast Manually
After the first helper cancels, you can also test rebroadcast directly:
```powershell
$requestId = "YOUR_REQUEST_ID_HERE"
Invoke-RestMethod -Uri "http://localhost:3000/api/requests/$requestId/rebroadcast" -Method POST
```

Then immediately check:
1. Browser console for realtime or poll messages
2. `/api/debug/my-notifications` as the second helper

## Common Issues

### RLS Blocking Notifications
If `rlsCount = 0` but `adminCount > 0`, check:
1. Helper profile has correct `user_id`
2. User is authenticated properly
3. RLS policy on `broadcast_notifications` matches the helper's profile

### Service Request RLS Blocking
If `rlsJoinCount = 0` but `rlsCount > 0`, the service_request status might not be 'open':
1. Check service_request status is 'open' (not 'assigned' or 'cancelled')
2. Verify user role is 'helper' in profiles table

### Poll Not Running
If no poll logs appear in console:
1. Check if `is_on_job` is stuck as true in component state
2. Try refreshing the page
3. Check if helperProfile is loaded

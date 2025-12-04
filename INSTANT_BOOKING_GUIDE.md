# Instant Booking Feature - Implementation Guide

## Overview
The Instant Booking feature has been successfully integrated into Helparo, allowing customers to choose between two booking flows in a unified interface:

1. **Instant Booking** - Direct selection → Payment → Confirmed job
2. **Normal Booking** - Post request → Receive bids → Choose → Payment

## Database Changes

### Migration: `030_instant_booking.sql`
Added the following fields to `helper_profiles` table:
- `instant_booking_enabled` (BOOLEAN) - Whether helper accepts instant bookings
- `instant_booking_price` (DECIMAL) - Fixed price for instant services
- `instant_booking_duration_minutes` (INTEGER) - Standard service duration
- `available_time_slots` (JSONB) - Available time slots
- `auto_accept_enabled` (BOOLEAN) - Auto-accept bookings without confirmation
- `max_concurrent_bookings` (INTEGER) - Maximum simultaneous bookings
- `response_time_minutes` (INTEGER) - Average response time

Added to `service_requests` table:
- `booking_type` (ENUM: 'normal' | 'instant')
- `assigned_helper_id` (UUID) - Direct helper assignment for instant bookings
- `instant_booking_confirmed_at` (TIMESTAMP) - Confirmation timestamp

**To apply this migration:**
```bash
# Connect to Supabase and run the migration
psql -h your-supabase-db.supabase.co -U postgres -d postgres -f supabase/migrations/030_instant_booking.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

## Components Created

### 1. `InstantHelperCard` (`src/components/instant-helper-card.tsx`)
Displays helper information with:
- Avatar with initials fallback
- Helper name and experience
- Skills display
- Fixed price and duration
- Auto-accept badge
- Response time indicator
- Interactive selection state

**Usage:**
```tsx
<InstantHelperCard
  helper={helperData}
  selected={selectedHelper?.id === helperData.id}
  onSelect={setSelectedHelper}
/>
```

### 2. `Avatar` Component (`src/components/ui/avatar.tsx`)
Reusable avatar component using Radix UI primitives:
- Image display with fallback
- Circular styling
- Customizable size and appearance

### 3. Instant Confirmation Page (`src/app/customer/bookings/instant-confirm/page.tsx`)
Review page before payment:
- Helper details summary
- Service details display
- Location and contact info
- "What happens next" information
- Confirm & Pay button

## API Endpoints

### GET `/api/helpers/instant`
Fetches available instant booking helpers.

**Query Parameters:**
- `category_id` - Filter by service category
- `lat` - User latitude (optional)
- `lng` - User longitude (optional)
- `radius` - Search radius in km (default: 25)

**Response:**
```json
{
  "data": [
    {
      "id": "helper-uuid",
      "instant_booking_price": 500,
      "instant_booking_duration_minutes": 60,
      "auto_accept_enabled": true,
      "response_time_minutes": 15,
      "profiles": {
        "full_name": "John Doe",
        "avatar_url": "...",
        "phone": "+91..."
      }
    }
  ],
  "count": 5
}
```

### POST `/api/bookings/instant`
Creates an instant booking.

**Request Body:**
```json
{
  "helper_id": "uuid",
  "category_id": "uuid",
  "description": "Service description",
  "service_address": "123 Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "location_lat": 19.0760,
  "location_lng": 72.8777,
  "price": 500,
  "duration_minutes": 60
}
```

**Response:**
```json
{
  "success": true,
  "booking_id": "request-uuid",
  "auto_confirmed": true
}
```

## Updated Service Request Page

### Location: `src/app/customer/requests/new/page.tsx`

**New Features:**
1. **Dual-Flow Selector** - Large toggle buttons at top:
   - **Instant Booking**: Teal theme, Zap icon
   - **Get Quotes**: Purple theme, Users icon

2. **Dynamic Form Fields**:
   - Title field: Only required for normal flow
   - Description: Required for normal, optional for instant
   - Budget: Only shown in normal flow
   - Urgency selector: Only shown in normal flow

3. **Two-Column Layout** (Instant mode only):
   - **Left**: Service details form
   - **Right**: Live list of available instant helpers

4. **Smart Helper Loading**:
   - Auto-fetches when category or location changes
   - Shows loading spinner during fetch
   - Displays "no helpers" message with option to switch flows

5. **Submit Button Behavior**:
   - **Instant mode**: "Proceed to Payment - ₹{price}" (disabled if no helper selected)
   - **Normal mode**: "Post Request & Get Quotes"

## User Flow

### Instant Booking Flow:
```
1. Customer clicks "Instant Booking" tab
2. Selects service category
3. Sets location on map
4. Views available helpers in right panel
5. Clicks on helper card to select
6. Reviews details
7. Clicks "Proceed to Payment"
8. Redirected to confirmation page
9. Reviews booking summary
10. Clicks "Confirm & Pay"
11. Redirected to payment gateway
12. Booking auto-confirmed (if auto-accept enabled)
```

### Normal Booking Flow:
```
1. Customer clicks "Get Quotes" tab
2. Fills complete service request form
3. Sets budget range (optional)
4. Selects urgency level
5. Clicks "Post Request & Get Quotes"
6. Request posted to marketplace
7. Helpers bid on request
8. Customer compares bids
9. Selects preferred helper
10. Proceeds to payment
```

## Helper Requirements for Instant Booking

To enable instant booking, helpers must:
1. Set `instant_booking_enabled = true`
2. Define `instant_booking_price`
3. Set `instant_booking_duration_minutes`
4. Be approved (`is_approved = true`, `verification_status = 'approved'`)

**Optional enhancements:**
- Enable `auto_accept_enabled` for instant confirmation
- Define `available_time_slots` for scheduling
- Set `max_concurrent_bookings` to manage capacity
- Configure `response_time_minutes` for customer expectations

## Admin Configuration

Admins can enable instant booking for helpers via:
1. Helper profile management page
2. Direct database update:
   ```sql
   UPDATE helper_profiles
   SET 
     instant_booking_enabled = true,
     instant_booking_price = 500,
     instant_booking_duration_minutes = 60,
     auto_accept_enabled = true
   WHERE user_id = 'helper-user-id';
   ```

## Testing Checklist

- [ ] Migrate database with `030_instant_booking.sql`
- [ ] Configure at least one helper with instant booking enabled
- [ ] Test instant booking flow end-to-end
- [ ] Test normal booking flow (ensure it still works)
- [ ] Test switching between flows
- [ ] Test with no available instant helpers
- [ ] Test helper auto-accept behavior
- [ ] Test manual accept behavior
- [ ] Verify payment integration works with both flows
- [ ] Test mobile responsiveness

## Future Enhancements

1. **Time Slot Selection**: Allow customers to choose specific time slots
2. **Helper Availability Calendar**: Real-time availability display
3. **Distance-Based Filtering**: Show helpers within service radius
4. **Favorite Helpers**: Quick booking for repeat customers
5. **Instant Chat**: Direct messaging with selected helper
6. **Rating Display**: Show helper ratings in instant cards
7. **Surge Pricing**: Dynamic pricing based on demand
8. **Scheduler Integration**: Auto-schedule based on helper calendar

## Troubleshooting

### TypeScript errors for Avatar component
If you see "Cannot find module '@/components/ui/avatar'":
1. Restart TypeScript server in VS Code (Ctrl+Shift+P → "TypeScript: Restart TS Server")
2. Ensure `@radix-ui/react-avatar` is installed: `npm install @radix-ui/react-avatar`
3. Clear Next.js cache: `rm -rf .next`

### No instant helpers showing
1. Verify database migration ran successfully
2. Check at least one helper has `instant_booking_enabled = true`
3. Verify helper is approved
4. Check API endpoint: `http://localhost:3000/api/helpers/instant?category_id=<uuid>`

### Server running on port 3001
Port 3000 is in use. Either:
- Stop other process: `taskkill /F /IM node.exe`
- Use port 3001: `http://localhost:3001`

## Summary

The Instant Booking feature is now fully integrated with:
- ✅ Database schema updated
- ✅ API endpoints created
- ✅ UI components built
- ✅ Unified booking page with dual flows
- ✅ Confirmation page implemented
- ✅ Auto-accept functionality
- ✅ Payment integration ready

Both booking flows coexist in the same interface, giving customers flexibility while maintaining the existing bidding system.

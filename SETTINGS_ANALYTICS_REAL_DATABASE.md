# Settings & Analytics Pages - Database Integration

## 🔧 **Settings Page - Real Database Operations**

### **Database Tables Used:**

#### 1. **`commission_settings`** (Primary settings)
- **`percent`** - Platform commission (0-100%)
- **`surge_multiplier`** - Peak hour price multiplier (1.0-5.0x)  
- **`service_radius_km`** - Default service area (1-100km)
- **`emergency_radius_km`** - Extended SOS service area (1-100km)
- **`min_withdrawal_amount`** - Minimum helper withdrawal (₹)
- **`auto_payout_threshold`** - Auto-payout trigger amount (₹)
- **`updated_at`** - Last modification timestamp

#### 2. **`system_settings`** (JSON configurations)
- **`gamification_config`** - Badge/points/leaderboard toggles
- **`subscription_plans`** - Helper Pro & Customer Premium settings  
- **`notification_config`** - Email/SMS/push notification settings
- **`payment_config`** - Gateway configurations (Cashfree/Razorpay)

#### 3. **`subscriptions`** (Active plans)
- Used to count active Helper Pro and Customer Premium subscriptions
- Provides real-time subscription statistics for the overview

### **Server Actions:**

#### `updateCommissionSettings(formData)`
- **Purpose**: Save all settings form data to database
- **Tables Updated**: `commission_settings`, `system_settings` 
- **Validation**: Rate limiting, admin auth, input sanitization
- **Cache**: Invalidates settings cache with `revalidateTag('settings')`

#### `getSystemSettings()`
- **Purpose**: Fetch current settings for display
- **Returns**: Combined commission + gamification settings
- **Fallbacks**: Default values if no database records exist

### **Real Data Flow:**
```
1. User loads /admin/settings
2. Server component fetches from DB (commission_settings + system_settings)
3. Client component shows real values in forms
4. User modifies settings and clicks "Save"
5. updateCommissionSettings() server action executes
6. Database records updated with new values
7. Page refreshes and shows updated settings
8. No more mock data or simulated saves!
```

## 📊 **Analytics Page - Time Range Server Actions**

### **Database Tables Used:**

#### 1. **`bookings`** (Revenue & booking metrics)
- **`total_amount`** - For revenue calculations
- **`status`** - Filter for completed bookings
- **`created_at`** - Time-based filtering (7d/30d/90d/1y)

#### 2. **`profiles`** (User statistics)
- **`role`** - Separate helpers vs customers
- **`status`** - Count only active users
- **`average_rating`** - Top performer rankings

#### 3. **`categories`** (Service performance)
- **`name`** - Service category names
- Used for category performance table

### **Server Actions:**

#### `getAnalyticsData(timeRange)`
- **Purpose**: Fetch analytics data for specific time period
- **Parameters**: '7d' | '30d' | '90d' | '1y'
- **Parallel Queries**: Revenue, bookings, helpers, customers, categories
- **Real Calculations**: Actual revenue sums, booking counts, user counts
- **Trend Data**: Generated based on real data patterns

### **Time Range Functionality:**
```
1. User clicks "7 Days" / "30 Days" / etc.
2. handleTimeRangeChange() calls getAnalyticsData(range)
3. Server action queries database with date filters
4. Real data returned based on selected time period
5. Charts and metrics update with actual numbers
6. No more placeholder or random data!
```

## 🚀 **Migration Applied:**

### **File**: `supabase/migrations/027_platform_settings.sql`
- ✅ Extended `commission_settings` with missing columns
- ✅ Created `system_settings` table for JSON configurations  
- ✅ Added proper indexes and RLS policies
- ✅ Default values and constraints for data integrity
- ✅ Triggers for automatic `updated_at` timestamp updates

### **Sample Data**: `supabase/sample_settings_data.sql`
- ✅ Realistic commission settings (12%, 1.5x surge, 15km radius)
- ✅ Gamification config (badges/points enabled)
- ✅ Sample Helper Pro (3) and Customer Premium (2) subscriptions
- ✅ Additional system configurations for testing

## 🔍 **Testing the Real Database Integration:**

### **Settings Page Test:**
1. Go to `/admin/settings`
2. Change commission from 12% to 15%
3. Modify service radius from 15km to 20km
4. Toggle off "Enable Badges"
5. Click "Save Changes"
6. Refresh page manually - settings should persist with new values
7. Check database: `SELECT * FROM commission_settings ORDER BY updated_at DESC LIMIT 1;`

### **Analytics Page Test:**
1. Go to `/admin/analytics`  
2. Default shows "30 Days" data
3. Click "7 Days" - should reload with filtered data
4. Click "1 Year" - should show broader date range
5. Loading states appear during time range changes
6. All numbers come from real database queries

## 🛡️ **Security & Performance:**

### **Admin Authentication:**
- All server actions require `requireAdmin()` 
- Only users with `role = 'admin'` can access

### **Rate Limiting:**
- Settings updates limited to prevent spam
- Analytics queries throttled per admin user

### **Input Validation:**
- Commission: 0-100% with 2 decimal precision
- Radii: 1-100km with integer constraints
- Surge multiplier: 1.0-5.0x range validation

### **Caching Strategy:**
- `revalidateTag('settings')` on updates
- Server-side rendered data eliminates client-side loading
- Real-time subscription counts on each page load

## 🎯 **No More Mock Data!**

### **Before (Issues Fixed):**
- ❌ Fake setTimeout() saves
- ❌ Hard-coded settings values  
- ❌ No database persistence
- ❌ Client-side only analytics
- ❌ Placeholder random data

### **After (Real Implementation):**
- ✅ Actual database CRUD operations
- ✅ Server-side data fetching
- ✅ Persistent settings across page reloads
- ✅ Real revenue/booking calculations
- ✅ Live subscription counts

The settings page now provides complete admin control over platform configuration with full database persistence!
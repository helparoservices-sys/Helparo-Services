# Migration 011: Enhanced Service Schema

## Overview
This migration adds comprehensive service features including:
- Dynamic pricing per service type
- Location-based services (Google Maps integration)
- Urgency levels (normal, urgent, emergency)
- Phone number with country code
- Helper availability and working hours
- Service radius and location tracking
- Surge pricing rules
- Helper matching algorithm

## ⚠️ IMPORTANT: Apply Migration First, Then Regenerate Types

### Step 1: Apply Migration in Supabase

1. Open **Supabase Dashboard** → SQL Editor
2. Copy entire content from `supabase/migrations/011_enhanced_services.sql`
3. Click **Run**
4. Verify success (should see "Success. No rows returned")

### Step 2: Verify Migration Applied

Run this query to check new columns exist:

```sql
-- Check service_requests has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_requests' 
  AND column_name IN ('location_type', 'urgency_level', 'latitude', 'longitude');

-- Check helper_profiles has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'helper_profiles' 
  AND column_name IN ('latitude', 'longitude', 'service_radius_km', 'working_hours');

-- Check new table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'surge_pricing_rules'
);

-- Check new functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('calculate_service_price', 'find_nearby_helpers');
```

### Step 3: Test New Features

```sql
-- Test price calculation function
SELECT public.calculate_service_price(
  (SELECT id FROM service_categories WHERE slug = 'pipe-repair' LIMIT 1),
  5, -- quantity
  'normal'::urgency_level,
  'home'::location_type,
  NULL -- no specific helper
);

-- Test helper matching (example coordinates for Delhi)
SELECT * FROM public.find_nearby_helpers(
  (SELECT id FROM service_categories WHERE slug = 'plumbing' LIMIT 1),
  28.6139,  -- latitude
  77.2090,  -- longitude
  'normal'::urgency_level,
  20, -- 20km radius
  10  -- top 10 helpers
);
```

###Step 4: Regenerate TypeScript Types (After Migration Applied)

**CRITICAL**: Only do this AFTER migration is successfully applied in Supabase!

```bash
# Install Supabase CLI if not installed
npm install supabase --save-dev

# Generate types from your Supabase project
npx supabase gen types typescript --project-id opnjibjsddwyojrerbll > src/lib/supabase/database.types.ts
```

**OR** Manually update `database.types.ts` to add the new enum types:

Add to Enums section:
```typescript
location_type: 'home' | 'shop' | 'on_highway' | 'remote'
urgency_level: 'normal' | 'urgent' | 'emergency'
price_type: 'per_hour' | 'per_unit' | 'per_sqft' | 'per_room' | 'fixed' | 'custom'
```

## What Changed

### New Enums
- `location_type`: Where service is performed (home/shop/on_highway/remote)
- `urgency_level`: Service urgency (normal/urgent/emergency)
- `price_type`: How service is priced (per_hour/per_unit/per_sqft/etc.)

### Enhanced Tables

#### `profiles` table
**New columns:**
- `phone_number` (VARCHAR) - Phone without country code
- `country_code` (VARCHAR) - Default '+91' for India
- `phone_verified` (BOOLEAN) - Phone verification status
- `phone_verified_at` (TIMESTAMPTZ) - Verification timestamp

#### `service_categories` table
**New columns:**
- `price_type` (ENUM) - Pricing method
- `unit_name` (TEXT) - Unit for pricing (foot, tap, room, etc.)
- `base_price` (DECIMAL) - Base price for service
- `icon` (TEXT) - Icon name for UI
- `image_url` (TEXT) - Category image
- `requires_location` (BOOLEAN) - Location mandatory
- `supports_emergency` (BOOLEAN) - Emergency service available
- `display_order` (INTEGER) - Sort order

**Seeded categories:**
- **Plumbing**: Pipe repair (₹50/foot), Tap fixing (₹200/tap), Cariphering (₹800), Door repair (₹400), Drain cleaning (₹600)
- **Electrical**: Wiring (₹150/point), Switch repair (₹100/switch), Appliance fixing (₹300), Fan installation (₹250), Light fitting (₹120)
- **Cleaning**: Home (₹200/room), Office (₹3/sqft), Deep (₹400/hour), Kitchen (₹500), Bathroom (₹250/unit)
- **Vehicle Repair**: Highway emergency (₹1500), Shop repair (₹400/hour), Home service (₹800), Bike (₹500), Car (₹1000)
- **Windows & Doors**: Window repair (₹300), Door installation (₹800), Lock repair (₹200), Window installation (₹600)

#### `service_requests` table
**New columns:**
- `location_type` (ENUM) - Service location type
- `urgency_level` (ENUM) - Urgency level
- `latitude`, `longitude` (DECIMAL) - GPS coordinates
- `address_line1`, `address_line2` (TEXT) - Full address
- `landmark`, `pincode`, `state` (TEXT) - Address details
- `service_type_details` (JSONB) - Specific requirements (e.g., pipe_length, number_of_taps)
- `quantity` (INTEGER) - Number of units
- `estimated_price` (DECIMAL) - Calculated estimate
- `surge_multiplier` (DECIMAL) - Surge pricing factor
- `preferred_date`, `preferred_time_start`, `preferred_time_end` - Scheduling
- `is_flexible` (BOOLEAN) - Flexible timing
- `images` (TEXT[]) - Photo uploads

#### `helper_services` table
**New columns:**
- `custom_price` (DECIMAL) - Helper's custom pricing
- `price_type` (ENUM) - Pricing method
- `min_price` (DECIMAL) - Minimum job charge
- `service_description` (TEXT) - Service details
- `supports_emergency` (BOOLEAN) - Emergency availability
- `emergency_price_multiplier` (DECIMAL) - Default 1.5x
- `response_time_minutes` (INTEGER) - Typical response time
- `is_available` (BOOLEAN) - Currently available

#### `helper_profiles` table
**New columns:**
- `latitude`, `longitude` (DECIMAL) - Helper location
- `service_radius_km` (INTEGER) - Travel distance (default 10km)
- `address`, `pincode` (TEXT) - Helper address
- `service_areas` (TEXT[]) - Areas they serve
- `working_hours` (JSONB) - Weekly schedule
- `emergency_availability` (BOOLEAN) - Emergency services
- `is_available_now` (BOOLEAN) - Real-time availability
- `skills_specialization` (TEXT[]) - Specific skills
- `years_of_experience` (INTEGER) - Experience
- `total_jobs_completed` (INTEGER) - Job count
- `response_rate_percent`, `completion_rate_percent` (DECIMAL) - Metrics
- `average_response_minutes` (INTEGER) - Response time

### New Table: `surge_pricing_rules`
Dynamic pricing rules based on:
- Category (specific or all)
- Urgency level (emergency/urgent/normal)
- Day of week (0-6)
- Time of day (hour_start - hour_end)
- Multiplier (1.0 = normal, 1.5 = 50% surge, 2.0 = double)

**Seeded rules:**
- Emergency: 1.8x multiplier
- Urgent: 1.3x multiplier

### New Functions

#### `calculate_service_price()`
Calculate service price with all factors:
```sql
SELECT public.calculate_service_price(
  p_category_id UUID,
  p_quantity INTEGER,
  p_urgency urgency_level,
  p_location_type location_type,
  p_helper_id UUID DEFAULT NULL
) RETURNS DECIMAL(10,2);
```

Factors:
- Base price from category
- Helper's custom price (if specified)
- Quantity
- Urgency multiplier (1.3x for urgent, 1.8x for emergency)
- Surge pricing rules
- Minimum price (if set by helper)

#### `find_nearby_helpers()`
Find helpers within distance, sorted by best match:
```sql
SELECT * FROM public.find_nearby_helpers(
  p_category_id UUID,
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8),
  p_urgency urgency_level DEFAULT 'normal',
  p_max_distance_km INTEGER DEFAULT 20,
  p_limit INTEGER DEFAULT 10
);
```

Returns:
- helper_id, helper_name
- distance_km (Haversine formula)
- rating, total_reviews
- hourly_rate
- is_available
- response_time_minutes

Sorting priority:
1. Emergency availability (if emergency request)
2. Distance (nearest first)
3. Rating (highest first)
4. Response time (fastest first)

## Impact on Existing Data

✅ **Safe Migration** - All new columns have defaults or are nullable
✅ **No data loss** - Existing data remains intact
✅ **Backward compatible** - Old queries still work

## Next Steps After Migration

1. **Update UI forms** to capture new fields:
   - Phone number with country selector
   - Location picker (Google Maps)
   - Urgency level selector
   - Service type details (dynamic based on category)
   - Preferred date/time

2. **Update server actions** to use new functions:
   - `calculatePrice()` - Use `calculate_service_price` function
   - `findHelpers()` - Use `find_nearby_helpers` function

3. **Create new UI components**:
   - Country code selector
   - Google Maps location picker
   - Urgency level selector with price preview
   - Helper matching results with distance/ratings
   - Working hours scheduler for helpers

4. **Test scenarios**:
   - Create request with urgency and location
   - Calculate dynamic prices
   - Search for nearby helpers
   - Test surge pricing rules

## Rollback (if needed)

```sql
-- Drop new table
DROP TABLE IF EXISTS public.surge_pricing_rules CASCADE;

-- Drop new functions
DROP FUNCTION IF EXISTS public.calculate_service_price CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_helpers CASCADE;

-- Remove new columns (example for service_requests)
ALTER TABLE public.service_requests 
  DROP COLUMN IF EXISTS location_type,
  DROP COLUMN IF EXISTS urgency_level,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  -- ... (list all new columns)
;

-- Drop new enums
DROP TYPE IF EXISTS location_type CASCADE;
DROP TYPE IF EXISTS urgency_level CASCADE;
DROP TYPE IF EXISTS price_type CASCADE;
```

## Support

If you encounter issues:
1. Check migration applied successfully
2. Verify RLS policies are active
3. Test functions with sample data
4. Check console for errors

**Ready?** Apply migration 011 in Supabase Dashboard now! 🚀

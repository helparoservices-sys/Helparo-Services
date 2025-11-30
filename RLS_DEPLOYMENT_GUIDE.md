# HOW TO ENABLE ROW LEVEL SECURITY (RLS) ON SUPABASE

## 🎯 IMPORTANT: READ BEFORE EXECUTING

This guide will help you enable Row Level Security on ALL tables in your Helparo database.

---

## 📋 PREREQUISITES

- ✅ Supabase project access
- ✅ Database admin permissions
- ✅ Backup of current database (recommended)

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### **Step 1: Backup Your Database** (CRITICAL!)

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Backups**
3. Click **Create Backup** (or verify automatic backup exists)
4. Wait for backup to complete

### **Step 2: Open SQL Editor**

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**

### **Step 3: Copy RLS Migration File**

1. Open this file: `supabase/migrations/999_enable_rls_policies.sql`
2. Copy the ENTIRE content (Ctrl+A, then Ctrl+C)

### **Step 4: Paste and Execute**

1. Paste the copied SQL into the SQL Editor
2. Review the content (optional but recommended)
3. Click **Run** button at bottom right

### **Step 5: Verify Execution**

You should see messages like:
```
ALTER TABLE
CREATE POLICY
CREATE POLICY
...
(200+ successful operations)
```

If you see **ANY ERRORS**, **STOP** and contact support.

### **Step 6: Test RLS Policies**

Run these test queries to verify RLS is working:

#### Test 1: Public Tables (Should Work)
```sql
-- This should return active categories
SELECT * FROM public.service_categories WHERE is_active = true LIMIT 5;
```

#### Test 2: Protected Tables (Should Return Empty)
```sql
-- This should return NOTHING (unless you're logged in as admin)
SELECT * FROM public.profiles LIMIT 5;
```

#### Test 3: Helper Profiles (Should Be Protected)
```sql
-- Should fail or return empty (unless you have auth context)
SELECT * FROM public.helper_profiles LIMIT 5;
```

---

## ✅ VERIFICATION CHECKLIST

After running the migration, verify:

- [ ] All tables have RLS enabled
- [ ] Public tables are accessible (service_categories, service_areas)
- [ ] Private tables are protected (profiles, payments, bank_accounts)
- [ ] Admin tables are restricted (system_settings, commission_settings)
- [ ] No errors in SQL execution
- [ ] Application still works correctly

---

## 🔍 HOW TO CHECK IF RLS IS ENABLED

Run this query in SQL Editor:

```sql
-- Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

You should see `true` for **RLS Enabled** column for ALL tables.

---

## 🐛 TROUBLESHOOTING

### Problem: "Permission denied" errors in application

**Solution**: 
- User might not be authenticated properly
- Check if auth.uid() is available
- Verify user role in profiles table

### Problem: "No rows returned" for valid queries

**Solution**:
- RLS policies might be too restrictive
- Check if user has correct role
- Verify user_id matches auth.uid()

### Problem: Migration fails with "policy already exists"

**Solution**:
- Some policies might already exist
- You can safely ignore these errors
- Or drop existing policies first:

```sql
-- Drop all existing policies (CAREFUL!)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;
```

### Problem: Admin can't access data

**Solution**:
- Verify admin has `role = 'admin'` in profiles table:

```sql
-- Check your admin role
SELECT id, email, role FROM public.profiles WHERE id = auth.uid();

-- If role is wrong, update it (replace YOUR_USER_ID):
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_ID';
```

---

## 🔐 SECURITY POLICIES EXPLAINED

### **User Roles:**
- `admin` - Full access to everything
- `helper` - Service providers
- `customer` - Service users

### **Access Levels:**

1. **Own Data Access**
   - Users can view/edit their own records
   - Example: Helper can see their own profile

2. **Related Data Access**
   - Users can access data they're involved in
   - Example: Customer can see their service requests

3. **Public Data Access**
   - Anyone can view public information
   - Example: Service categories, pricing

4. **Admin Access**
   - Admins can view/manage all data
   - Example: Admin can see all user profiles

---

## 📊 POLICY COUNT BY TABLE TYPE

- **User Data**: 30+ policies (profiles, auth, sessions)
- **Service Data**: 25+ policies (requests, applications, messages)
- **Financial Data**: 35+ policies (payments, wallets, withdrawals)
- **Admin Data**: 15+ policies (settings, configurations)
- **Public Data**: 10+ policies (categories, areas, plans)

**Total**: 115+ RLS policies protecting your database!

---

## 🚨 CRITICAL WARNINGS

### ⚠️ DO NOT:
- Delete policies without understanding impact
- Disable RLS on production tables
- Share service role key with untrusted parties
- Use service role key in client-side code

### ✅ DO:
- Test policies in development first
- Monitor logs for access issues
- Keep policies simple and readable
- Document any custom policies

---

## 📞 SUPPORT

If you encounter issues:

1. **Check Logs**: Supabase Dashboard → Logs
2. **Test Queries**: Run test queries above
3. **Review Policies**: Check if user role is correct
4. **Backup First**: Always have a backup before changes

---

## 🎉 SUCCESS INDICATORS

After successful RLS implementation:

- ✅ Users can login and see their own data
- ✅ Users CANNOT see other users' private data
- ✅ Admins can see all data when needed
- ✅ Public pages work without authentication
- ✅ No "permission denied" errors for valid operations
- ✅ No unauthorized access to sensitive data

---

## 📝 POST-DEPLOYMENT CHECKLIST

- [ ] RLS migration executed successfully
- [ ] All 80+ tables have RLS enabled
- [ ] Test user can login and view own data
- [ ] Test user CANNOT access other users' data
- [ ] Admin can access all admin features
- [ ] Public pages load correctly
- [ ] No security warnings in logs
- [ ] Application performance is normal

---

**Migration File**: `supabase/migrations/999_enable_rls_policies.sql`  
**Total Tables Protected**: 80+  
**Total Policies**: 115+  
**Security Level**: Enterprise-Grade  

**Status**: 🟢 READY TO DEPLOY

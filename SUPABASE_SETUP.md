# SUPABASE SETUP INSTRUCTIONS

## Step 1: Run Database Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `opnjibjsddwyojrerbll`
3. Navigate to **SQL Editor** (left sidebar)
4. Create a new query
5. Copy the entire content from `supabase/migrations/001_initial_schema.sql`
6. Paste and click **Run**

This will create:
- ✅ User profiles table with roles
- ✅ Helper profiles table
- ✅ Row Level Security policies
- ✅ Automatic triggers for new users
- ✅ All necessary indexes

## Step 2: Configure Email Templates (Optional but Recommended)

1. Go to **Authentication** > **Email Templates**
2. Customize the confirmation email template
3. Make sure the confirmation URL is set to: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`

## Step 3: Enable Email Auth

1. Go to **Authentication** > **Providers**
2. Make sure **Email** provider is enabled
3. Disable email confirmations if you want to test without email verification (not recommended for production)

## Step 4: Test Authentication

After running the migration:
1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Get Started"
4. Register a new account
5. Check your email for verification link
6. Login with your credentials

---

**Migration Status**: ⏳ Pending - Run SQL manually in Supabase dashboard

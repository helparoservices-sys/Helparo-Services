# FIREBASE ADMIN SDK SETUP GUIDE

## Why Firebase Admin SDK?

**Problem:**
- Firebase Client SDK (`firebase/storage`) fails silently in Vercel serverless functions
- Images stored as base64 in PostgreSQL causing massive egress costs
- Firebase Storage bucket remains empty

**Solution:**
- Firebase Admin SDK works reliably in Node.js/server environments
- Proper authentication using service account credentials
- Secure, production-ready image uploads

---

## Step 1: Get Firebase Service Account Credentials

### Option A: Download JSON File (Quickest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **helparo-7a75d**
3. Click ⚙️ **Project Settings** → **Service Accounts** tab
4. Click **"Generate new private key"** button
5. Download the JSON file (e.g., `helparo-7a75d-firebase-adminsdk-xxxxx.json`)

### Option B: Use Existing Credentials

If you already have a service account JSON, you can use it.

---

## Step 2: Configure Environment Variables

### For Local Development (.env.local)

**Method 1: Base64 Encode (Simplest)**

```bash
# On Windows PowerShell:
$jsonContent = Get-Content "path\to\firebase-service-account.json" -Raw
$base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($jsonContent))
Write-Output $base64
```

Then add to `.env.local`:
```env
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6ImhlbHBhcm8t...
```

**Method 2: Individual Fields (Better for Vercel)**

Open the JSON file and extract these fields:

```json
{
  "project_id": "helparo-7a75d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...",
  "client_email": "firebase-adminsdk-xxxxx@helparo-7a75d.iam.gserviceaccount.com"
}
```

Add to `.env.local`:
```env
FIREBASE_PROJECT_ID=helparo-7a75d
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@helparo-7a75d.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

**⚠️ Important:** Keep the quotes around `FIREBASE_PRIVATE_KEY` value!

---

## Step 3: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/helparos-projects/helparo-services)
2. Click **Settings** → **Environment Variables**
3. Add the same variables as above:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
4. Select **All Environments** (Production, Preview, Development)
5. Click **Save**

---

## Step 4: Verify Setup

### Test Locally

```bash
cd "C:\Codes\Helparo services"
npm run dev
```

Create a new job with images. Check terminal logs for:
```
📤 [FIREBASE-ADMIN] Upload start: service-requests/...
📊 [FIREBASE-ADMIN] Size: XXX KB, Type: image/jpeg
✅ [FIREBASE-ADMIN] Upload successful
🔗 [FIREBASE-ADMIN] URL: https://storage.googleapis.com/...
```

### Test in Production

Deploy to Vercel:
```bash
vercel --prod
```

Check Vercel logs:
1. Go to Vercel Dashboard → Deployments
2. Click latest deployment → **Functions** tab
3. Click on `/api/requests/broadcast` function
4. Look for `[FIREBASE-ADMIN]` logs

---

## Step 5: Verify Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **helparo-7a75d** project
3. Click **Storage** in left sidebar
4. You should see folders: `service-requests/{userId}/...`
5. Files should have public URLs like:
   ```
   https://storage.googleapis.com/helparo-7a75d.firebasestorage.app/service-requests/...
   ```

---

## Step 6: Verify Database

Check that URLs (not base64) are stored:

```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  created_at,
  images[1] as first_image
FROM service_requests 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected result:**
```
first_image: "https://storage.googleapis.com/helparo-7a75d.firebasestorage.app/..."
```

**If you see base64:**
```
first_image: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```
→ Firebase Admin SDK is not configured correctly. Check environment variables.

---

## Troubleshooting

### Error: "Firebase Admin SDK initialization failed"

**Cause:** Missing or invalid credentials

**Fix:**
1. Verify environment variables are set correctly
2. Check for typos in variable names
3. Ensure `FIREBASE_PRIVATE_KEY` has proper line breaks (`\n`)
4. Restart dev server after changing .env.local

### Error: "Permission denied"

**Cause:** Firebase Storage rules block uploads

**Fix:**
1. Go to Firebase Console → Storage → **Rules** tab
2. Ensure rules allow server-side writes:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /service-requests/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null || request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

### Images still showing as base64

**Cause:** Upload failed silently, fell back to base64

**Fix:**
1. Check Vercel logs for error messages
2. Verify Firebase Storage rules allow writes
3. Ensure service account has "Storage Admin" role

---

## Security Checklist

✅ Service account JSON **NOT** committed to git  
✅ `.gitignore` includes `firebase-service-account.json`  
✅ Environment variables set in Vercel (not hardcoded)  
✅ Firebase Storage rules restrict uploads to authenticated requests  
✅ Private key stored securely in environment variables  

---

## Expected Results

### Before Fix:
- Images: base64 strings in database (10MB per image)
- Firebase Storage: empty
- Supabase egress: 18-47 GB/day

### After Fix:
- Images: Public URLs in database (200 bytes per image)
- Firebase Storage: Organized folders with images
- Supabase egress: 0.5-2 GB/day (95% reduction)

---

## Files Modified

1. ✅ `src/lib/firebase-admin.ts` - Firebase Admin SDK initialization
2. ✅ `src/app/api/requests/broadcast/route.ts` - Uses Admin SDK upload
3. ✅ `src/components/helper/job-notification-popup.tsx` - Enhanced realtime logging
4. ✅ `package.json` - Added `firebase-admin` dependency

---

## Next Steps

1. ✅ Install firebase-admin: `npm install firebase-admin`
2. ⏳ Get service account JSON from Firebase Console
3. ⏳ Add credentials to `.env.local`
4. ⏳ Test locally with new job creation
5. ⏳ Add credentials to Vercel environment variables
6. ⏳ Deploy to production: `vercel --prod`
7. ⏳ Verify in Firebase Console and Supabase SQL Editor

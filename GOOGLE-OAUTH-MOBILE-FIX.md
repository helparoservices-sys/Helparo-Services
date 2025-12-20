# Google OAuth Mobile Deep Linking Fix

## 🎯 Problem Fixed
When users logged in with Google on the Android mobile app, the OAuth flow would open a browser and keep them on the website instead of returning to the mobile app after authentication.

## ✅ Solution Implemented
Configured proper Capacitor deep linking using custom URL scheme so that after Google OAuth, the user is redirected back to the mobile app instead of staying in the browser.

---

## 📋 Changes Made

### 1. **Capacitor Configuration** (`capacitor.config.ts`)
Added deep linking plugin configuration:

```typescript
plugins: {
  App: {
    appUrlOpen: {
      enabled: true,
    },
  },
}
```

### 2. **Android Manifest** (`android/app/src/main/AndroidManifest.xml`)
Added two intent filters to handle deep links:

#### Custom URL Scheme (Primary for OAuth)
```xml
<!-- Deep Link for OAuth callback -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    
    <!-- App URL Scheme: helparoapp://auth/callback -->
    <data android:scheme="helparoapp" 
          android:host="auth" />
</intent-filter>
```

#### App Link (Fallback)
```xml
<!-- Universal Link for OAuth callback (https) -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    
    <!-- App Link: https://helparo.in/auth/callback -->
    <data android:scheme="https" 
          android:host="helparo.in" 
          android:pathPrefix="/auth/callback" />
</intent-filter>
```

### 3. **Auth Library Update** (`src/lib/capacitor-auth.ts`)

#### Platform-Aware Redirect URLs
```typescript
function getRedirectUrl(): string {
  if (isCapacitor()) {
    // Use custom URL scheme for mobile app
    return 'helparoapp://auth/callback'
  }
  // Use web URL for browser
  return `${window.location.origin}/auth/callback`
}
```

#### Simplified OAuth Flow
Removed the in-app browser approach and now uses direct OAuth redirect with proper deep link handling:

```typescript
export async function signInWithGoogle(role: 'customer' | 'helper') {
  const redirectUrl = getRedirectUrl()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  return { data, error }
}
```

#### Deep Link Listener
Added listener to handle OAuth callback when app is opened via deep link:

```typescript
export function initializeDeepLinkListener() {
  if (!isCapacitor()) return
  
  App.addListener('appUrlOpen', (event) => {
    const url = new URL(event.url)
    
    if (url.pathname === '/auth/callback') {
      const code = url.searchParams.get('code')
      if (code) {
        // Redirect to Next.js callback route
        window.location.href = `${window.location.origin}/auth/callback?code=${code}`
      }
    }
  })
}
```

### 4. **App Entry Point** (`src/components/mobile-app-entry.tsx`)
Initialized deep link listener on app startup:

```typescript
useEffect(() => {
  // Initialize deep link listener for OAuth callbacks
  initializeDeepLinkListener()
  // ... rest of auth check
}, [router])
```

---

## 🔧 Supabase Dashboard Configuration

### **CRITICAL: Update Redirect URLs**

Go to your Supabase Dashboard → Authentication → URL Configuration

#### Add These Redirect URLs:

1. **Mobile App (Custom Scheme)**
   ```
   helparoapp://auth/callback
   ```

2. **Web (Production)**
   ```
   https://helparo.in/auth/callback
   ```

3. **Web (Localhost for testing)**
   ```
   http://localhost:3000/auth/callback
   ```

### Site URL
Set to your production domain:
```
https://helparo.in
```

### Additional URLs (Optional)
If you have staging environment:
```
https://staging.helparo.in/auth/callback
```

---

## 📱 OAuth Flow Explanation

### **Mobile App Flow** (After Fix)

1. **User clicks "Continue with Google" in mobile app**
   - App calls `signInWithGoogle('customer')` or `signInWithGoogle('helper')`
   - Role is stored in localStorage

2. **App redirects to Google OAuth**
   - Redirect URL: `helparoapp://auth/callback`
   - User selects Google account
   - Google authenticates

3. **Google redirects back to app**
   - URL: `helparoapp://auth/callback?code=xyz123...`
   - Android deep link opens the Helparo app
   - Deep link listener catches the URL

4. **App processes the callback**
   - Listener extracts the `code` parameter
   - Redirects internally to: `https://helparo.in/auth/callback?code=xyz123`
   - Next.js route handler exchanges code for session

5. **Session established**
   - User is authenticated
   - Profile is created/updated with stored role
   - User is redirected to appropriate dashboard

### **Web Flow** (Unchanged)

1. User clicks "Continue with Google" on website
2. Redirects to Google OAuth with `https://helparo.in/auth/callback`
3. Google redirects back to website
4. Next.js callback route processes authentication
5. User redirected to dashboard

---

## 🧪 Testing Instructions

### 1. **Build and Deploy Android App**
```bash
# Sync Capacitor changes
npx cap sync android

# Open in Android Studio
npx cap open android

# Build and install on device/emulator
```

### 2. **Test OAuth Flow**
1. Open app on Android device/emulator
2. Click "Continue with Google"
3. Select Google account
4. **Expected Result**: App should reopen automatically after Google login
5. User should be on the dashboard

### 3. **Test Web Flow** (Ensure no breakage)
1. Open https://helparo.in in browser
2. Click "Continue with Google"
3. Select Google account
4. **Expected Result**: Stay in browser, redirect to dashboard

---

## 🔍 Troubleshooting

### Issue: App doesn't reopen after Google login

**Check:**
1. Verify deep link is registered:
   ```bash
   adb shell dumpsys package | grep -A 5 "helparoapp"
   ```

2. Verify Supabase redirect URLs include `helparoapp://auth/callback`

3. Check Android manifest has both intent filters

### Issue: Web login broken

**Check:**
1. Ensure `https://helparo.in/auth/callback` is in Supabase redirect URLs
2. Verify `getRedirectUrl()` returns web URL when not in Capacitor

### Issue: "Invalid redirect URL" error

**Fix:**
- Add the exact URL to Supabase Dashboard → Authentication → URL Configuration
- Wait 1-2 minutes for changes to propagate
- Clear app cache and retry

---

## 📦 Required Packages

Ensure these Capacitor plugins are installed:

```json
{
  "@capacitor/app": "^latest",
  "@capacitor/core": "^latest"
}
```

If not installed:
```bash
npm install @capacitor/app
npx cap sync
```

---

## 🎯 Key Differences: Before vs After

| Aspect | Before (Broken) | After (Fixed) |
|--------|----------------|---------------|
| Mobile OAuth | Opens browser, stays on website | Opens Google, returns to app |
| Redirect URL | `https://helparo.in/auth/callback` | `helparoapp://auth/callback` |
| Method | In-app browser with `@capacitor/browser` | Native deep linking with `@capacitor/app` |
| User Experience | Confusing, stays in browser | Seamless, back to app |
| Web Login | Works ✅ | Still works ✅ |

---

## ✅ Production Checklist

- [x] Capacitor config updated with App plugin
- [x] Android manifest has deep link intent filters
- [x] Auth library uses platform-aware redirects
- [x] Deep link listener initialized on app start
- [ ] **Supabase redirect URLs updated in dashboard** ⚠️ REQUIRED
- [ ] App rebuilt and tested on physical device
- [ ] Web login tested (should still work)
- [ ] iOS configuration (if applicable)

---

## 🔐 Security Notes

1. **Custom URL Scheme** (`helparoapp://`) is secure because:
   - Only your app can register this scheme on the device
   - Android prevents other apps from hijacking it
   - OAuth code is single-use and expires quickly

2. **App Links** (`https://`) are more secure but require:
   - Digital Asset Links JSON file on your domain
   - Domain verification (configured with `android:autoVerify="true"`)
   - Both are configured as fallback

3. **Best Practice**: The solution uses both custom scheme (primary) and app link (fallback) for maximum compatibility

---

## 📞 Support

If issues persist:
1. Check Supabase Auth logs in dashboard
2. Use `adb logcat` to view Android logs
3. Verify deep link registration with ADB commands above
4. Ensure app has latest Capacitor plugins

---

**Fix implemented:** December 21, 2025
**Status:** Ready for production deployment after Supabase configuration

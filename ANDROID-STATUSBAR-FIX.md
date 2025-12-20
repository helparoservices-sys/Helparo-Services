# Android Status Bar Fix - Implementation Guide

## Problem Solved
Fixed Android status bar overlapping app content across all screens. The system status bar was covering UI elements, making them inaccessible.

## Solution Overview
Implemented a multi-layer approach using Capacitor StatusBar plugin, Android theme configuration, and CSS safe-area handling.

## Changes Made

### 1. Capacitor Configuration (`capacitor.config.ts`)
Added StatusBar plugin configuration to prevent overlay:

```typescript
StatusBar: {
  style: 'light',              // Light text for dark status bar
  backgroundColor: '#00C3B4',   // Guardian Teal brand color
  overlaysWebView: false,       // Critical: prevents overlay
}
```

**Why it works**: `overlaysWebView: false` tells Android to push web content below the status bar.

### 2. Android Theme Configuration (`android/app/src/main/res/values/styles.xml`)
Updated app theme for edge-to-edge support:

```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="windowActionBar">false</item>
    <item name="windowNoTitle">true</item>
    <item name="android:background">@null</item>
    <item name="android:statusBarColor">@android:color/transparent</item>
    <item name="android:windowLayoutInDisplayCutoutMode" tools:targetApi="o_mr1">shortEdges</item>
    <item name="android:windowTranslucentStatus">false</item>
    <item name="android:windowTranslucentNavigation">false</item>
</style>
```

**Key attributes**:
- `statusBarColor`: Transparent for Capacitor to control
- `windowLayoutInDisplayCutoutMode`: Handles notched screens
- `windowTranslucentStatus`: false prevents translucent overlap

### 3. Android Manifest (`android/app/src/main/AndroidManifest.xml`)
Verified keyboard handling:

```xml
android:windowSoftInputMode="adjustResize"
```

**Why it works**: Ensures proper layout adjustment when keyboard appears.

### 4. Global Layout (`src/app/layout.tsx`)
Applied safe-area classes to body:

```tsx
<body className="antialiased pt-safe pb-safe">
```

**Why it works**: Adds padding for top status bar and bottom navigation gestures.

### 5. CSS Safe-Area Utilities (`src/app/globals.css`)
Enhanced safe-area variable handling:

```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 24px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 16px);
  --status-bar-height: 24px;
}

/* Android WebView fallback */
@supports not (padding-top: env(safe-area-inset-top)) {
  :root {
    --safe-area-inset-top: 28px;
    --status-bar-height: 28px;
  }
}

.pt-safe { padding-top: max(24px, var(--safe-area-inset-top)); }
.pb-safe { padding-bottom: max(16px, var(--safe-area-inset-bottom)); }
```

**Why it works**: Progressive enhancement with fallbacks for older Android WebView.

### 6. Runtime StatusBar Initialization (`src/components/capacitor-back-button.tsx`)
Updated StatusBar color to match brand:

```typescript
await StatusBar.setBackgroundColor({ color: '#00C3B4' })
await StatusBar.setOverlaysWebView({ overlay: false })
```

**Why it works**: Ensures settings are applied at runtime, even if config fails.

## Testing Checklist

### Android 12+
- [x] Status bar doesn't overlap content
- [x] Safe-area padding applied correctly
- [x] Works in portrait and landscape
- [x] No layout shift when keyboard opens
- [x] Works on devices with notches/punch-holes

### Specific Screens to Test
1. **Home/Landing Page**: Hero section shouldn't be covered
2. **Navigation Header**: Should be below status bar
3. **Forms**: Input fields adjust properly with keyboard
4. **Modals/Dialogs**: Content visible and accessible
5. **Chat/Messages**: Scrollable content respects boundaries

### Device Types
- Regular Android phones (Samsung, OnePlus, etc.)
- Notched displays (Pixel, OnePlus)
- Punch-hole cameras
- Tablets

## Build & Deploy

### Development Build
```bash
npm run build
npx cap sync android
npx cap open android
```

### Production Release
1. Update version in `package.json`
2. Build: `npm run build`
3. Sync: `npx cap sync android`
4. Open in Android Studio: `npx cap open android`
5. Build signed APK/AAB

## Verification Steps

1. **Install on physical device** (emulators may not show issue correctly)
2. **Open app and navigate to multiple screens**
3. **Check status bar area**: Should see Guardian Teal (#00C3B4)
4. **Verify content**: No text/buttons hidden under status bar
5. **Test keyboard**: Forms should adjust properly
6. **Rotate device**: Should work in both orientations

## Compatibility

- **Minimum Android**: 5.0 (API 21) - standard Capacitor requirement
- **Target Android**: 14 (API 34)
- **Tested on**: Android 12, 13, 14
- **Capacitor**: 6.x
- **StatusBar Plugin**: 6.x

## Technical Details

### How It Works (Layer by Layer)

1. **Android System Layer**: Theme sets status bar to transparent, allowing app control
2. **Capacitor Layer**: StatusBar plugin sets color and overlay mode
3. **WebView Layer**: Safe-area insets create space for system UI
4. **CSS Layer**: Safe-area utilities apply padding to body
5. **React Layer**: All pages inherit body padding automatically

### No Layout Shift
The combination of:
- Fixed status bar height in CSS variables
- Body padding applied at root
- `overlaysWebView: false` preventing dynamic changes

Ensures no layout shift when navigating between screens.

## Troubleshooting

### Status bar still overlaps
1. Verify StatusBar plugin installed: `npm list @capacitor/status-bar`
2. Check Capacitor sync: `npx cap sync android`
3. Clean build: `cd android && ./gradlew clean`
4. Rebuild app completely

### Wrong status bar color
- Check `capacitor-back-button.tsx` initialization
- Verify `capacitor.config.ts` backgroundColor value
- Ensure app has restarted (not just hot reload)

### Safe-area not working
- Check body element has `pt-safe pb-safe` classes
- Verify CSS variables in DevTools
- Test on physical device (emulator may not show correctly)

### Content still jumps
- Verify `windowSoftInputMode="adjustResize"` in AndroidManifest
- Check no fixed positioning conflicts
- Ensure keyboard handlers don't override padding

## No Breaking Changes
- ✅ No component structure changes
- ✅ No UI redesign
- ✅ Global fix affects all pages
- ✅ Backward compatible with existing code

## Future Improvements (Optional)

1. **Dark Mode Support**: Add `Style.Dark` based on theme
2. **Dynamic Color**: Match status bar to current page theme
3. **iOS Optimization**: Add similar safe-area for iOS notch
4. **Tablet Layout**: Add landscape-specific safe areas

## References

- [Capacitor StatusBar Docs](https://capacitorjs.com/docs/apis/status-bar)
- [Android Edge-to-Edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- [CSS Safe Area](https://developer.mozilla.org/en-US/docs/Web/CSS/env)

---

**Last Updated**: December 21, 2025
**Tested By**: Senior Android + Capacitor Engineer
**Status**: ✅ Production Ready

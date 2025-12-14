# Helparo Mobile App - Quick Start Guide

## ✅ Setup Complete!

Your Android app is now configured with:

- 📱 **Capacitor** - Native app wrapper
- 🎨 **Guardian Teal** - Branded colors & splash screen
- 📍 **Location** - For finding nearby helpers
- 📷 **Camera** - For taking photos
- 🔔 **Push Notifications** - For booking updates
- 📶 **Offline Detection** - Shows when no internet
- 🔄 **Auto-Update** - Website changes sync to app!

---

## 🚀 Building Your APK

### Quick Debug Build (for testing)

```bash
# Open Android Studio
npm run mobile:android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. Click "locate" when done

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Production Build (for Play Store)

See [ANDROID_BUILD_GUIDE.md](mobile/ANDROID_BUILD_GUIDE.md) for full instructions.

---

## 📱 Testing on Your Phone

### Option 1: Install Debug APK
1. Build debug APK (above)
2. Transfer to phone
3. Enable "Install from unknown sources"
4. Install the APK

### Option 2: USB Debugging
```bash
npm run mobile:run
```

### Option 3: Live Reload (Development)
```bash
npm run mobile:live
```
Changes update instantly!

---

## 🎨 App Icons

You need to create app icons. Use Android Studio:

1. Open project in Android Studio (`npm run mobile:android`)
2. Right-click `res` folder
3. Select **New > Image Asset**
4. Upload your 1024x1024 logo
5. It generates all sizes automatically

---

## 📤 Play Store Checklist

Before uploading to Play Store:

- [ ] Generate signed AAB (see build guide)
- [ ] Create 512x512 app icon
- [ ] Create 1024x500 feature graphic  
- [ ] Take 2+ phone screenshots (1080x1920)
- [ ] Write app description
- [ ] Set up privacy policy page
- [ ] Fill Data Safety form

---

## 🔄 How Updates Work

**Website updates → App automatically updated!**

Since your app loads from `https://helparo.in`:
- Any changes you deploy to Netlify
- Will instantly appear in the mobile app
- No need to republish to Play Store!

Only rebuild APK when:
- Adding new native features
- Changing app icon/splash screen
- Updating permissions

---

## 📁 New Files Created

```
capacitor.config.ts          # Capacitor configuration
src/lib/capacitor.ts         # Native plugin utilities
src/components/mobile/
├── index.ts                 # Barrel export
├── app-shell.tsx           # Main mobile wrapper
├── bottom-nav.tsx          # Bottom navigation bar
├── header.tsx              # Mobile header component
├── splash-screen.tsx       # App splash screen
├── offline-indicator.tsx   # No internet banner
└── pull-to-refresh.tsx     # Pull to refresh gesture

android/                     # Full Android project
├── app/src/main/res/
│   ├── values/colors.xml   # Guardian Teal colors
│   ├── values/strings.xml  # App strings
│   └── values/styles.xml   # Themed styles
└── ...
```

---

## 🆘 Need Help?

If you encounter issues:

1. **Gradle sync fails**: Open Android Studio, let it download dependencies
2. **Emulator won't start**: Use a physical device instead
3. **App crashes**: Check `npm run mobile:android` > Logcat for errors

Happy building! 🎉

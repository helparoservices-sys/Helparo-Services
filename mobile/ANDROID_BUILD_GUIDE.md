# Helparo Android App - Build Guide

## Prerequisites

1. **Node.js 18+** installed
2. **Android Studio** installed with:
   - Android SDK (API 33 or higher)
   - Android SDK Build-Tools
   - Android Emulator (optional, for testing)
3. **Java JDK 17** (included with Android Studio)

## Initial Setup (One-time)

### Step 1: Install Dependencies

```bash
cd "d:\Helparo Services"
npm install
```

### Step 2: Initialize Capacitor Android

```bash
npx cap add android
```

This creates the full Android project in `android/` folder.

### Step 3: Configure Android Studio

Open Android Studio and:
1. Go to **File > Settings > Appearance & Behavior > System Settings > Android SDK**
2. Install **Android SDK Platform 33** (or higher)
3. Install **Android SDK Build-Tools 33.0.0**

## Building the App

### Development Build (Debug APK)

```bash
# Build Next.js and sync with Capacitor
npm run mobile:build

# Open in Android Studio
npm run mobile:android
```

In Android Studio:
1. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Production Build (Release AAB for Play Store)

#### Step 1: Generate Signing Key (One-time)

```bash
keytool -genkey -v -keystore release.keystore -alias helparo -keyalg RSA -keysize 2048 -validity 10000
```

Keep this keystore file safe! You need it for all future updates.

#### Step 2: Configure Signing

Create `android/keystore.properties`:

```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=helparo
storeFile=../release.keystore
```

#### Step 3: Build Release AAB

```bash
cd android
./gradlew bundleRelease
```

Find AAB at: `android/app/build/outputs/bundle/release/app-release.aab`

## Testing

### On Emulator

```bash
npm run mobile:run
```

### On Physical Device

1. Enable **Developer Options** on your Android phone
2. Enable **USB Debugging**
3. Connect via USB
4. Run: `npm run mobile:run`

### Live Reload (Development)

```bash
npm run mobile:live
```

This enables live reload - changes update instantly!

## Play Store Deployment

### Required Assets

Create these images:

| Asset | Size | Format |
|-------|------|--------|
| App Icon | 512x512 | PNG |
| Feature Graphic | 1024x500 | PNG/JPG |
| Phone Screenshots | 1080x1920 (min 2) | PNG/JPG |
| Tablet Screenshots | 1200x1920 (optional) | PNG/JPG |

### Play Store Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Fill in:
   - App name: **Helparo**
   - Short description: Book trusted home service helpers
   - Full description: (see below)
   - Category: **House & Home**
   - Tags: home services, helper, plumber, electrician

### Suggested Full Description

```
Helparo - Your Trusted Home Service Partner

Book verified plumbers, electricians, cleaners, AC technicians, and more at your doorstep. Get instant help from trusted professionals.

✅ VERIFIED HELPERS - All helpers are background verified
✅ INSTANT BOOKING - Book a helper in seconds
✅ REAL-TIME TRACKING - Track your helper's arrival
✅ SECURE PAYMENTS - Cash & UPI accepted
✅ 24/7 SUPPORT - We're always here to help
✅ FAIR PRICING - No hidden charges

Services Available:
• Plumbing - Leak fixes, pipe repairs, installations
• Electrical - Wiring, repairs, installations
• Cleaning - Home cleaning, deep cleaning
• AC Service - Repair, servicing, installation
• Carpentry - Furniture repair, installations
• Appliance Repair - All home appliances

How it works:
1. Select your service
2. Choose date & time
3. Get matched with verified helpers
4. Track arrival in real-time
5. Pay after service completion

Download now and get help within minutes!
```

### Data Safety Declaration

In Play Console, declare:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Name | Yes | No | Account |
| Email | Yes | No | Account |
| Phone | Yes | No | Account, Service |
| Location | Yes | No | Service Delivery |
| Payment Info | Yes | No | Payments |

### Content Rating

Fill the questionnaire - your app should get **Everyone** rating.

## Troubleshooting

### Build Fails with SDK Error

```bash
# Update local.properties with SDK path
echo "sdk.dir=C:\\Users\\YOUR_USER\\AppData\\Local\\Android\\Sdk" > android/local.properties
```

### Capacitor Sync Issues

```bash
npx cap sync android --deployment
```

### Clear Build Cache

```bash
cd android
./gradlew clean
```

## App Updates

Since your app loads from `https://helparo.in`:

1. **Website updates** → App automatically gets new content
2. **Native changes** → Rebuild and upload new AAB to Play Store

## File Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/in/helparo/app/    # Native Java code
│   │   ├── res/
│   │   │   ├── drawable/           # Splash screen
│   │   │   ├── mipmap-*/           # App icons
│   │   │   ├── values/             # Colors, strings, styles
│   │   └── AndroidManifest.xml     # App permissions
│   └── build.gradle                # App build config
├── build.gradle                    # Project build config
└── capacitor.settings.gradle       # Capacitor config
```

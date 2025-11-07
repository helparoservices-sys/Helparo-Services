# Helparo Mobile Apps

This directory contains React Native Expo mobile applications for Helparo platform.

## Apps Structure

### 1. Customer App (`/customer-app`)
- Service browsing and booking
- Real-time helper tracking
- In-app payments (Cashfree, Razorpay)
- Rating and reviews
- Order history
- Video consultation
- Offline mode support
- Push notifications

### 2. Helper App (`/helper-app`)
- Job management dashboard
- Accept/reject bookings
- Real-time navigation to job location
- Time tracking and checkpoints
- Earnings and withdrawals
- Performance analytics
- Document verification
- Video consultation support

## Tech Stack

- **Framework**: React Native with Expo
- **State Management**: Zustand / Redux Toolkit
- **UI Components**: React Native Paper / NativeBase
- **Navigation**: React Navigation v6
- **Maps**: React Native Maps (Google Maps / Apple Maps)
- **Payments**: Cashfree SDK, Razorpay SDK
- **Video Calls**: Agora SDK / Twilio SDK
- **Push Notifications**: Expo Notifications
- **Offline Storage**: AsyncStorage / WatermelonDB
- **API Client**: Supabase JS Client
- **Authentication**: Supabase Auth

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (Mac only) or Expo Go app
- Android: Android Studio or Expo Go app

### Customer App

```bash
cd customer-app
npm install
npx expo start
```

### Helper App

```bash
cd helper-app
npm install
npx expo start
```

## Environment Variables

Create `.env` file in each app directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
EXPO_PUBLIC_CASHFREE_APP_ID=your_cashfree_id
EXPO_PUBLIC_AGORA_APP_ID=your_agora_id
```

## Features Implementation Status

### Customer App
- [ ] Authentication (Sign up, Login, OTP)
- [ ] Home screen with service categories
- [ ] Service search and filtering
- [ ] Service details and booking
- [ ] Helper selection with smart matching
- [ ] Real-time booking tracking
- [ ] In-app chat with helper
- [ ] Payment integration
- [ ] Order history
- [ ] Reviews and ratings
- [ ] Profile management
- [ ] Push notifications
- [ ] Video consultation
- [ ] Offline mode

### Helper App
- [ ] Helper authentication
- [ ] Dashboard with earnings overview
- [ ] Job requests list
- [ ] Accept/reject jobs
- [ ] Navigation to customer location
- [ ] Job checkpoints (arrived, started, completed)
- [ ] Time tracking
- [ ] Photo uploads (before/after)
- [ ] Earnings and withdrawal requests
- [ ] Performance metrics
- [ ] Document verification
- [ ] Push notifications
- [ ] Video consultation
- [ ] Offline job data sync

## Build Commands

### Development Build
```bash
# Customer app
cd customer-app
eas build --profile development --platform ios/android

# Helper app
cd helper-app
eas build --profile development --platform ios/android
```

### Production Build
```bash
# Customer app
cd customer-app
eas build --profile production --platform ios/android

# Helper app
cd helper-app
eas build --profile production --platform ios/android
```

## Testing

```bash
# Run tests
npm test

# E2E tests (Detox)
npm run test:e2e
```

## Deployment

Apps will be deployed to:
- **iOS**: Apple App Store
- **Android**: Google Play Store

Using Expo EAS Build and Submit for automated deployments.

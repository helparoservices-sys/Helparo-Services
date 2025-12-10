import { initializeApp, getApps } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)

// IMPORTANT: Firebase Phone Auth does NOT work on localhost with real phone numbers!
// For localhost testing, you MUST use fictional test phone numbers configured in Firebase Console.
// Go to: Firebase Console → Authentication → Sign-in method → Phone → Phone numbers for testing
// Add test numbers like: +91 9555512345 with code 123456
//
// The appVerificationDisabledForTesting flag only disables reCAPTCHA verification,
// but you still need test phone numbers for localhost.
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  auth.settings.appVerificationDisabledForTesting = true
  console.log('🔧 Firebase: Test mode enabled for localhost')
  console.log('📱 Use test phone numbers from Firebase Console for OTP testing')
}

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber }
export type { ConfirmationResult }

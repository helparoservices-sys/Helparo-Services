/**
 * FIREBASE ADMIN SDK - SERVER-SIDE ONLY
 * 
 * Purpose: Secure server-side Firebase operations (Storage uploads, etc.)
 * Why: Firebase Client SDK doesn't work in Vercel serverless functions
 * 
 * SETUP REQUIRED:
 * 1. Go to Firebase Console → Project Settings → Service Accounts
 * 2. Click "Generate new private key" → Download JSON file
 * 3. Either:
 *    A) Add to .env.local as base64:
 *       FIREBASE_SERVICE_ACCOUNT_BASE64=<base64 encoded JSON>
 *    B) Or use individual env vars (recommended for Vercel):
 *       FIREBASE_PROJECT_ID=helparo-7a75d
 *       FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@helparo-7a75d.iam.gserviceaccount.com
 *       FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...
 * 
 * SECURITY:
 * - Never commit service account JSON to git
 * - Add to .gitignore: firebase-service-account.json
 * - Use environment variables in production (Vercel)
 */

import * as admin from 'firebase-admin'

/**
 * Initialize Firebase Admin SDK (singleton pattern)
 * Safe to call multiple times - only initializes once
 */
function initializeFirebaseAdmin() {
  // Already initialized - return existing app
  if (admin.apps.length > 0) {
    return admin.apps[0]!
  }

  console.log('🔧 [FIREBASE-ADMIN] Initializing Firebase Admin SDK...')

  try {
    // Method 1: Base64-encoded service account (single env var)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const serviceAccountJson = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf-8')
      
      const serviceAccount = JSON.parse(serviceAccountJson)
      
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      })
    }
    
    // Method 2: Individual env vars (better for Vercel)
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle escaped newlines in private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      })
    }

    // Fallback: Try default credentials (works in Cloud Run, GCP environments)
    return admin.initializeApp({
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    })

  } catch (error: any) {
    console.error('❌ [FIREBASE-ADMIN] Initialization failed:', error.message)
    throw new Error(
      'Firebase Admin SDK initialization failed. ' +
      'Please set FIREBASE_SERVICE_ACCOUNT_BASE64 or individual credentials. ' +
      'See: https://firebase.google.com/docs/admin/setup'
    )
  }
}

/**
 * Upload base64 image to Firebase Storage using Admin SDK
 * Works reliably in Vercel serverless functions
 * 
 * @param base64String - Base64 encoded image (with or without data URI prefix)
 * @param path - Storage path (e.g., 'service-requests/userId/image.jpg')
 * @returns Public download URL
 */
export async function uploadBase64ToFirebaseAdmin(
  base64String: string,
  path: string
): Promise<string> {
  const startTime = Date.now()
  console.log(`📤 [FIREBASE-ADMIN] Upload start: ${path}`)

  try {
    // Initialize Admin SDK - THIS WILL THROW if misconfigured
    const app = initializeFirebaseAdmin()
    const bucket = admin.storage().bucket()
    
    // Log bucket configuration for debugging
    console.log(`🪣 [FIREBASE-ADMIN] Bucket: ${bucket.name}`)

    // Extract base64 data and content type
    let base64Data: string
    let contentType = 'image/jpeg'

    if (base64String.startsWith('data:')) {
      // Parse data URI: data:image/jpeg;base64,/9j/4AAQ...
      const match = base64String.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        contentType = match[1]
        base64Data = match[2]
      } else {
        base64Data = base64String.split(',')[1] || base64String
      }
    } else {
      base64Data = base64String
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')
    const sizeKB = (buffer.length / 1024).toFixed(1)
    console.log(`📊 [FIREBASE-ADMIN] Size: ${sizeKB} KB, Type: ${contentType}`)

    // Upload to Firebase Storage
    const file = bucket.file(path)
    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          uploadedAt: new Date().toISOString(),
          uploadSource: 'helparo-api',
          originalFormat: 'base64'
        }
      },
      public: true, // Make file publicly readable
      resumable: false // For small files, simple upload is faster
    })

    console.log(`✅ [FIREBASE-ADMIN] Upload successful`)

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`
    
    const duration = Date.now() - startTime
    console.log(`🔗 [FIREBASE-ADMIN] URL: ${publicUrl.substring(0, 80)}...`)
    console.log(`⏱️ [FIREBASE-ADMIN] Upload took ${duration}ms`)

    return publicUrl

  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`❌ [FIREBASE-ADMIN] Upload failed after ${duration}ms:`, error.message)
    throw new Error(`Firebase Admin upload failed: ${error.message}`)
  }
}

/**
 * Check if Firebase Admin SDK is properly configured
 * Use this for health checks or debugging
 */
export async function checkFirebaseAdminHealth(): Promise<{
  configured: boolean
  error?: string
}> {
  try {
    initializeFirebaseAdmin()
    const bucket = admin.storage().bucket()
    await bucket.exists()
    return { configured: true }
  } catch (error: any) {
    return { configured: false, error: error.message }
  }
}

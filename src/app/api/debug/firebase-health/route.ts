/**
 * FIREBASE ADMIN HEALTH CHECK ENDPOINT
 * 
 * Purpose: Verify Firebase Admin SDK is properly configured
 * Method: GET /api/debug/firebase-health
 * 
 * SECURITY: No authentication required (safe diagnostic endpoint)
 * Returns configuration status without exposing credentials
 */

import { NextResponse } from 'next/server'
import { checkFirebaseAdminHealth } from '@/lib/firebase-admin'

export async function GET() {
  console.log('🔍 [FIREBASE-HEALTH] Health check requested')
  
  try {
    const health = await checkFirebaseAdminHealth()
    
    const response = {
      timestamp: new Date().toISOString(),
      firebaseAdmin: health.configured ? 'CONFIGURED ✅' : 'NOT CONFIGURED ❌',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'MISSING',
      credentialsMethod: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 
        ? 'BASE64_ENCODED'
        : (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
        ? 'INDIVIDUAL_ENV_VARS'
        : 'NONE',
      status: health.configured ? 200 : 503,
      message: health.configured 
        ? 'Firebase Admin SDK is properly configured and ready'
        : `Firebase Admin SDK is NOT configured. Error: ${health.error}`,
      instructions: health.configured 
        ? null
        : {
          step1: 'Go to Firebase Console → Project Settings → Service Accounts',
          step2: 'Click "Generate new private key" and download JSON',
          step3: 'Add to Vercel environment variables:',
          required: [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_CLIENT_EMAIL', 
            'FIREBASE_PRIVATE_KEY'
          ],
          documentation: 'See FIREBASE-ADMIN-SETUP.md'
        }
    }
    
    console.log('🔍 [FIREBASE-HEALTH] Result:', response.firebaseAdmin)
    
    return NextResponse.json(response, { 
      status: health.configured ? 200 : 503 
    })
    
  } catch (error: any) {
    console.error('❌ [FIREBASE-HEALTH] Error:', error.message)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      firebaseAdmin: 'ERROR ❌',
      status: 500,
      error: error.message,
      message: 'Failed to check Firebase Admin SDK configuration'
    }, { status: 500 })
  }
}

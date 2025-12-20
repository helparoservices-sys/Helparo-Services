/**
 * DEBUG ENDPOINT: Firebase Storage Upload Test
 * 
 * Route: GET /api/debug/firebase-upload-test
 * Purpose: Verify Firebase Storage is configured correctly
 * Safety: Does NOT modify any production data
 * 
 * Usage:
 * - Browser: http://localhost:3000/api/debug/firebase-upload-test
 * - cURL: curl http://localhost:3000/api/debug/firebase-upload-test
 * 
 * Returns: JSON with test results and detailed logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { testFirebaseStorageUpload } from '@/lib/firebase-storage-test'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🧪 [DEBUG] Firebase Storage upload test initiated')
  
  try {
    // Run the isolated test
    const result = await testFirebaseStorageUpload()
    
    // Log to console
    console.log('\n' + '='.repeat(60))
    console.log('🧪 FIREBASE STORAGE TEST RESULTS')
    console.log('='.repeat(60))
    result.logs.forEach(log => console.log(log))
    console.log('='.repeat(60) + '\n')
    
    // Return structured response
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Firebase Storage upload test PASSED ✅',
        url: result.url,
        instructions: {
          next_steps: [
            '1. Verify the URL is accessible in your browser',
            '2. Confirm you see a 1x1 red pixel image',
            '3. Check Firebase Console > Storage to see the uploaded file',
            '4. If successful, proceed to Phase 1 (dual-write implementation)'
          ],
          cleanup: 'Test files are stored in /test-uploads/ folder in Firebase Storage'
        },
        logs: result.logs,
        timestamp: new Date().toISOString()
      }, { status: 200 })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Firebase Storage upload test FAILED ❌',
        error: result.error,
        troubleshooting: {
          common_issues: [
            'Check .env.local has all required Firebase config variables',
            'Verify Firebase Storage is enabled in Firebase Console',
            'Ensure Firebase Storage Rules allow writes (test mode or authenticated)',
            'Check Network tab for CORS or permission errors'
          ],
          required_env_vars: [
            'NEXT_PUBLIC_FIREBASE_API_KEY',
            'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
            'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
            'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
            'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
            'NEXT_PUBLIC_FIREBASE_APP_ID'
          ]
        },
        logs: result.logs,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('❌ [DEBUG] Unexpected error during Firebase test:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Firebase Storage test encountered an unexpected error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

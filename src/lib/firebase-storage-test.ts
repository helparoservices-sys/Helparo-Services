/**
 * PHASE 0: Firebase Storage Upload Test
 * 
 * Purpose: Verify Firebase Storage can upload images and return public URLs
 * Safety: Completely isolated, does NOT affect production job creation
 * Usage: Only called by /api/debug/firebase-upload-test endpoint
 */

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { app } from './firebase'

/**
 * Test Firebase Storage upload with a small test image
 * @returns Object with success status, URL, and logs
 */
export async function testFirebaseStorageUpload(): Promise<{
  success: boolean
  url?: string
  error?: string
  logs: string[]
}> {
  const logs: string[] = []
  
  try {
    logs.push('🔥 [TEST] Starting Firebase Storage upload test...')
    
    // Initialize Firebase Storage
    const storage = getStorage(app)
    logs.push('✅ [TEST] Firebase Storage initialized')
    
    // Create a small test image (1x1 red pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      'base64'
    )
    logs.push(`✅ [TEST] Test image buffer created (${testImageBuffer.length} bytes)`)
    
    // Create unique filename with timestamp
    const timestamp = Date.now()
    const filename = `test-uploads/firebase-test-${timestamp}.png`
    logs.push(`📝 [TEST] Upload path: ${filename}`)
    
    // Create storage reference
    const storageRef = ref(storage, filename)
    logs.push('✅ [TEST] Storage reference created')
    
    // Upload the test image
    const uploadResult = await uploadBytes(storageRef, testImageBuffer, {
      contentType: 'image/png',
      customMetadata: {
        uploadedBy: 'firebase-storage-test',
        purpose: 'phase-0-validation',
        timestamp: timestamp.toString()
      }
    })
    logs.push(`✅ [TEST] Upload successful: ${uploadResult.metadata.fullPath}`)
    
    // Get public download URL
    const downloadURL = await getDownloadURL(storageRef)
    logs.push(`✅ [TEST] Public URL obtained: ${downloadURL.substring(0, 80)}...`)
    
    // Verify URL format
    if (!downloadURL.startsWith('https://')) {
      throw new Error('Invalid URL format - does not start with https://')
    }
    logs.push('✅ [TEST] URL format validated')
    
    logs.push('🎉 [TEST] Firebase Storage test PASSED')
    
    return {
      success: true,
      url: downloadURL,
      logs
    }
    
  } catch (error: any) {
    logs.push(`❌ [TEST] Error: ${error.message}`)
    logs.push(`❌ [TEST] Stack: ${error.stack}`)
    
    return {
      success: false,
      error: error.message,
      logs
    }
  }
}

/**
 * Upload a base64 image to Firebase Storage (for future use)
 * @param base64String - Base64 encoded image with or without data URI prefix
 * @param path - Storage path (e.g., 'service-requests/job-123/image-1.jpg')
 * @returns Public download URL
 */
export async function uploadBase64ToFirebase(
  base64String: string,
  path: string
): Promise<string> {
  try {
    // Remove data URI prefix if present
    const base64Data = base64String.includes(',') 
      ? base64String.split(',')[1] 
      : base64String
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Detect content type from data URI or default to jpeg
    let contentType = 'image/jpeg'
    if (base64String.startsWith('data:')) {
      const match = base64String.match(/data:([^;]+);/)
      if (match) contentType = match[1]
    }
    
    // Initialize storage and create reference
    const storage = getStorage(app)
    const storageRef = ref(storage, path)
    
    // Upload with metadata
    const uploadResult = await uploadBytes(storageRef, buffer, {
      contentType,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalFormat: 'base64'
      }
    })
    
    // Get and return public URL
    const downloadURL = await getDownloadURL(storageRef)
    
    console.log('✅ Firebase upload success:', {
      path: uploadResult.metadata.fullPath,
      size: uploadResult.metadata.size,
      url: downloadURL.substring(0, 80) + '...'
    })
    
    return downloadURL
    
  } catch (error: any) {
    console.error('❌ Firebase upload failed:', error.message)
    throw new Error(`Firebase upload failed: ${error.message}`)
  }
}

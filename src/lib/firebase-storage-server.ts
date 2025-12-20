/**
 * FIREBASE STORAGE - SERVER-SIDE UPLOAD
 * 
 * Purpose: Upload images to Firebase Storage from Next.js API routes (server-side)
 * Why: Firebase Client SDK doesn't work reliably in server components
 * Solution: Use Firebase Storage REST API directly
 * 
 * IMPORTANT: This uses the Firebase Storage REST API which works in any environment
 */

const FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

/**
 * Upload a base64 image to Firebase Storage using REST API
 * Works reliably in Vercel/Next.js API routes (server-side)
 * 
 * @param base64String - Base64 encoded image (with or without data URI prefix)
 * @param path - Storage path (e.g., 'service-requests/userId/image.jpg')
 * @returns Public download URL
 */
export async function uploadBase64ToFirebaseServer(
  base64String: string,
  path: string
): Promise<string> {
  console.log(`📤 [FIREBASE-SERVER] Starting upload to: ${path}`)
  
  if (!FIREBASE_STORAGE_BUCKET) {
    throw new Error('FIREBASE_STORAGE_BUCKET is not configured')
  }

  try {
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
        // Fallback: just split by comma
        base64Data = base64String.split(',')[1] || base64String
      }
    } else {
      base64Data = base64String
    }

    // Convert base64 to binary buffer
    const binaryData = Buffer.from(base64Data, 'base64')
    console.log(`📊 [FIREBASE-SERVER] Image size: ${(binaryData.length / 1024).toFixed(1)} KB, type: ${contentType}`)

    // Firebase Storage REST API endpoint
    // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}
    const encodedPath = encodeURIComponent(path)
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedPath}`

    console.log(`⬆️ [FIREBASE-SERVER] Uploading to Firebase Storage...`)

    // Upload using REST API (public bucket - no auth required for uploads)
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      body: binaryData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error(`❌ [FIREBASE-SERVER] Upload failed:`, uploadResponse.status, errorText)
      throw new Error(`Firebase upload failed: ${uploadResponse.status} - ${errorText}`)
    }

    const uploadResult = await uploadResponse.json()
    console.log(`✅ [FIREBASE-SERVER] Upload successful, getting download URL...`)

    // Get the download token from response
    const downloadToken = uploadResult.downloadTokens

    // Construct public download URL
    // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`

    console.log(`🔗 [FIREBASE-SERVER] Download URL: ${downloadUrl.substring(0, 80)}...`)

    return downloadUrl

  } catch (error: any) {
    console.error(`❌ [FIREBASE-SERVER] Error:`, error.message)
    throw error
  }
}

/**
 * Check if a string is a valid Firebase Storage URL
 */
export function isFirebaseUrl(url: string): boolean {
  return url.startsWith('https://firebasestorage.googleapis.com/')
}

/**
 * Check if a string is a valid base64 image
 */
export function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/')
}

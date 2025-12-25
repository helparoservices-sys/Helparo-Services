/**
 * Firebase Storage Client-Side Upload
 * 
 * Uploads images directly from browser to Firebase Storage
 * Returns public URL to store in Supabase (instead of base64)
 * 
 * Benefits:
 * - Supabase stores ~100 bytes (URL) instead of ~200KB (base64)
 * - Faster database reads
 * - Lower Supabase egress costs
 * - Firebase CDN delivers images faster
 */

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const storage = getStorage(app)

/**
 * Compress image before uploading
 * Reduces file size significantly for faster uploads
 */
export async function compressImageForUpload(file: File, maxWidth = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        // Adaptive compression based on file size
        const fileSizeMB = file.size / (1024 * 1024)
        let targetMaxWidth = maxWidth
        let quality = 0.75
        
        if (fileSizeMB > 5) {
          targetMaxWidth = 600
          quality = 0.6
        } else if (fileSizeMB > 2) {
          targetMaxWidth = 700
          quality = 0.65
        }
        
        if (width > targetMaxWidth) {
          height = (height * targetMaxWidth) / width
          width = targetMaxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('Canvas context not available'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(objectUrl)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`📸 Compressed: ${fileSizeMB.toFixed(1)}MB → ${(blob.size / 1024).toFixed(0)}KB`)
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          'image/jpeg',
          quality
        )
      } catch (err) {
        URL.revokeObjectURL(objectUrl)
        reject(err)
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }
    
    img.src = objectUrl
  })
}

/**
 * Upload image to Firebase Storage
 * @param file - Image file from input
 * @param path - Storage path (e.g., 'service-requests/userId/image.jpg')
 * @returns Public download URL
 */
export async function uploadImageToFirebase(
  file: File | Blob,
  path: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        source: 'helparo-web'
      }
    })
    
    // Get public download URL
    const downloadUrl = await getDownloadURL(snapshot.ref)
    console.log(`✅ Uploaded to Firebase: ${path}`)
    
    return downloadUrl
  } catch (error: any) {
    console.error('Firebase upload error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }
}

/**
 * Compress and upload image in one step
 * Returns Firebase Storage URL
 */
export async function compressAndUploadImage(
  file: File,
  userId: string,
  index: number = 0
): Promise<string> {
  // Compress the image
  const compressedBlob = await compressImageForUpload(file)
  
  // Generate unique path
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const path = `service-requests/${userId}/${timestamp}-${randomId}-${index}.jpg`
  
  // Upload and return URL
  return uploadImageToFirebase(compressedBlob, path)
}

/**
 * Upload video thumbnail to Firebase Storage
 * For large videos, we only store a thumbnail
 */
export async function uploadVideoThumbnail(
  videoFile: File,
  userId: string,
  index: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadeddata = () => {
      video.currentTime = 0.5 // Get frame at 0.5 seconds
    }
    
    video.onseeked = async () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = Math.min(video.videoWidth, 600)
        canvas.height = (video.videoHeight / video.videoWidth) * canvas.width
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        URL.revokeObjectURL(video.src)
        
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Failed to create thumbnail'))
              return
            }
            
            try {
              const timestamp = Date.now()
              const randomId = Math.random().toString(36).substring(2, 9)
              const path = `service-requests/${userId}/video-thumb-${timestamp}-${randomId}-${index}.jpg`
              
              const url = await uploadImageToFirebase(blob, path)
              resolve(url)
            } catch (uploadErr) {
              reject(uploadErr)
            }
          },
          'image/jpeg',
          0.7
        )
      } catch (err) {
        URL.revokeObjectURL(video.src)
        reject(err)
      }
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video'))
    }
    
    video.src = URL.createObjectURL(videoFile)
  })
}

/**
 * Check if Firebase Storage is configured
 */
export function isFirebaseStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
}

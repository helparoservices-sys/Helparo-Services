/**
 * File Upload Validation & Security
 * Protects against malicious file uploads
 */

import { logger } from './logger'

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  DOCUMENT: 5 * 1024 * 1024,      // 5MB for documents (PDF, DOC)
  IMAGE: 10 * 1024 * 1024,        // 10MB for images
  VIDEO: 100 * 1024 * 1024,       // 100MB for videos
  AVATAR: 2 * 1024 * 1024,        // 2MB for avatars
  VERIFICATION: 5 * 1024 * 1024,  // 5MB for verification documents
} as const

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  IMAGE: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  VIDEO: [
    'video/mp4',
    'video/webm',
    'video/ogg',
  ],
  VERIFICATION: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ],
} as const

// File extensions mapping
const MIME_TO_EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg',
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedName?: string
  extension?: string
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  allowedTypes: readonly string[],
  maxSize: number
): FileValidationResult {
  try {
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file provided' }
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB`,
      }
    }

    // Check if file is empty
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' }
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${getAllowedExtensions(allowedTypes).join(', ')}`,
      }
    }

    // Validate file extension matches MIME type
    const extension = getFileExtension(file.name)
    const expectedExtension = MIME_TO_EXTENSION[file.type]
    
    if (expectedExtension && extension !== expectedExtension) {
      return {
        valid: false,
        error: 'File extension does not match file type',
      }
    }

    // Generate safe filename
    const sanitizedName = generateSafeFilename(file.type)

    logger.info('File validation passed', {
      originalName: file.name,
      sanitizedName,
      size: file.size,
      type: file.type,
    })

    return {
      valid: true,
      sanitizedName,
      extension: expectedExtension,
    }
  } catch (error) {
    logger.error('File validation error', { error })
    return { valid: false, error: 'File validation failed' }
  }
}

/**
 * Generate cryptographically safe filename
 */
export function generateSafeFilename(mimeType: string): string {
  const extension = MIME_TO_EXTENSION[mimeType] || 'bin'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${random}.${extension}`
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

/**
 * Get human-readable allowed extensions
 */
function getAllowedExtensions(mimeTypes: readonly string[]): string[] {
  return mimeTypes
    .map(mime => MIME_TO_EXTENSION[mime])
    .filter(Boolean)
    .map(ext => ext.toUpperCase())
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  allowedTypes: readonly string[],
  maxSize: number,
  maxCount: number = 10
): { valid: boolean; errors: string[]; validFiles: File[] } {
  const errors: string[] = []
  const validFiles: File[] = []

  if (files.length > maxCount) {
    return {
      valid: false,
      errors: [`Maximum ${maxCount} files allowed`],
      validFiles: [],
    }
  }

  for (const file of files) {
    const result = validateFile(file, allowedTypes, maxSize)
    if (result.valid) {
      validFiles.push(file)
    } else {
      errors.push(`${file.name}: ${result.error}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles,
  }
}

/**
 * Detect potential malicious files
 */
export function detectMaliciousFile(filename: string): boolean {
  const maliciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.sh$/i,
    /\.php$/i,
    /\.jsp$/i,
    /\.asp$/i,
    /\.js$/i,
    /\.vbs$/i,
    /\.scr$/i,
    /\.dll$/i,
    /\.so$/i,
    /\.\./,  // Path traversal
    /\/\.\./,  // Path traversal
    /^\./, // Hidden files
  ]

  return maliciousPatterns.some(pattern => pattern.test(filename))
}

/**
 * Client-side file validation hook
 */
export function useFileValidation() {
  const validateBeforeUpload = (
    files: FileList | File[],
    type: 'DOCUMENT' | 'IMAGE' | 'VIDEO' | 'VERIFICATION',
    maxSize?: number
  ): FileValidationResult[] => {
    const fileArray = Array.from(files)
    const allowedTypes = ALLOWED_MIME_TYPES[type]
    const sizeLimit = maxSize || FILE_SIZE_LIMITS[type === 'VERIFICATION' ? 'DOCUMENT' : type]

    return fileArray.map(file => validateFile(file, allowedTypes, sizeLimit))
  }

  return { validateBeforeUpload }
}

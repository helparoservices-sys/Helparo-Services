/**
 * XSS Protection Utilities
 * Sanitizes user input to prevent cross-site scripting attacks
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content (for rich text)
 * Allows basic formatting tags only
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return ''
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  })
}

/**
 * Sanitize plain text (strips all HTML)
 * Use for user-generated content that should not contain HTML
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return ''
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeURL(url: string): string {
  if (!url) return ''
  
  const cleaned = DOMPurify.sanitize(url)
  
  // Block javascript: and data: URIs
  if (cleaned.toLowerCase().startsWith('javascript:') || 
      cleaned.toLowerCase().startsWith('data:')) {
    return ''
  }
  
  return cleaned
}

/**
 * Escape special characters for safe display
 * Use when you need to display user input as-is without HTML
 */
export function escapeHTML(text: string): string {
  if (!text) return ''
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

/**
 * Sanitize object recursively
 * Use when dealing with complex objects from user input
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      )
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized as T
}

/**
 * Sanitize FormData entries
 * Use before processing form submissions
 */
export function sanitizeFormData(formData: FormData): FormData {
  const sanitized = new FormData()
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      sanitized.append(key, sanitizeText(value))
    } else {
      // Keep files as-is
      sanitized.append(key, value)
    }
  }
  
  return sanitized
}

/**
 * Sanitize review/comment content (allows some formatting)
 */
export function sanitizeReviewContent(content: string): string {
  if (!content) return ''
  
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: []
  })
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''
  
  // Remove any HTML
  const cleaned = sanitizeText(email).trim().toLowerCase()
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleaned)) {
    return ''
  }
  
  return cleaned
}

/**
 * Sanitize phone number (Indian format)
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Validate Indian phone number (10 digits starting with 6-9)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return cleaned
  }
  
  return ''
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return ''
  
  // Remove path separators and special characters
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim()
}

/**
 * Check if string contains potential XSS
 */
export function containsXSS(text: string): boolean {
  if (!text) return false
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onload, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i
  ]
  
  return xssPatterns.some(pattern => pattern.test(text))
}

/**
 * Sanitize SQL-like strings (additional layer of protection)
 */
export function sanitizeSQLLike(text: string): string {
  if (!text) return ''
  
  // Remove SQL comment indicators and common SQL injection patterns
  return text
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim()
}

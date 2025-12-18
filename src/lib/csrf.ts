/**
 * CSRF Token utilities for client-side forms
 */

export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf-token') {
      return decodeURIComponent(value)
    }
  }
  return null
}

export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken()
  if (!token) return headers
  
  return {
    ...headers,
    'x-csrf-token': token
  }
}

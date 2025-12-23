/**
 * Client-side OTP Rate Limiting
 * Prevents users from hitting Firebase's rate limit by tracking attempts locally
 */

const OTP_STORAGE_KEY = 'otp_rate_limit'
const MAX_ATTEMPTS = 3 // Max OTP requests before cooldown
const COOLDOWN_MINUTES = 15 // Cooldown period in minutes
const ATTEMPT_WINDOW_MINUTES = 10 // Time window to track attempts

interface OTPRateLimitData {
  attempts: number
  firstAttemptTime: number
  cooldownUntil: number | null
  lastAttemptTime: number
}

function getStorageData(): OTPRateLimitData {
  if (typeof window === 'undefined') {
    return { attempts: 0, firstAttemptTime: 0, cooldownUntil: null, lastAttemptTime: 0 }
  }
  
  try {
    const data = localStorage.getItem(OTP_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch {
    // Ignore parse errors
  }
  
  return { attempts: 0, firstAttemptTime: 0, cooldownUntil: null, lastAttemptTime: 0 }
}

function setStorageData(data: OTPRateLimitData): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if user can request OTP
 * Returns: { allowed: boolean, waitMinutes?: number, message?: string }
 */
export function canRequestOTP(): { allowed: boolean; waitMinutes?: number; message?: string } {
  const data = getStorageData()
  const now = Date.now()
  
  // Check if in cooldown period
  if (data.cooldownUntil && now < data.cooldownUntil) {
    const waitMinutes = Math.ceil((data.cooldownUntil - now) / (1000 * 60))
    return {
      allowed: false,
      waitMinutes,
      message: `Too many OTP requests. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again.`
    }
  }
  
  // Reset if cooldown has passed or window has expired
  const windowMs = ATTEMPT_WINDOW_MINUTES * 60 * 1000
  if (data.cooldownUntil && now >= data.cooldownUntil) {
    // Cooldown finished, reset everything
    setStorageData({ attempts: 0, firstAttemptTime: 0, cooldownUntil: null, lastAttemptTime: 0 })
    return { allowed: true }
  }
  
  if (data.firstAttemptTime && (now - data.firstAttemptTime) > windowMs) {
    // Window expired, reset
    setStorageData({ attempts: 0, firstAttemptTime: 0, cooldownUntil: null, lastAttemptTime: 0 })
    return { allowed: true }
  }
  
  // Check attempt count
  if (data.attempts >= MAX_ATTEMPTS) {
    // Set cooldown
    const cooldownUntil = now + (COOLDOWN_MINUTES * 60 * 1000)
    setStorageData({ ...data, cooldownUntil })
    return {
      allowed: false,
      waitMinutes: COOLDOWN_MINUTES,
      message: `Too many OTP requests. Please wait ${COOLDOWN_MINUTES} minutes before trying again.`
    }
  }
  
  return { allowed: true }
}

/**
 * Record an OTP request attempt
 */
export function recordOTPAttempt(): void {
  const data = getStorageData()
  const now = Date.now()
  
  const windowMs = ATTEMPT_WINDOW_MINUTES * 60 * 1000
  
  // If first attempt or window expired, start fresh
  if (!data.firstAttemptTime || (now - data.firstAttemptTime) > windowMs) {
    setStorageData({
      attempts: 1,
      firstAttemptTime: now,
      cooldownUntil: null,
      lastAttemptTime: now
    })
    return
  }
  
  // Increment attempts
  setStorageData({
    ...data,
    attempts: data.attempts + 1,
    lastAttemptTime: now
  })
}

/**
 * Handle Firebase rate limit error
 * Sets a longer cooldown when Firebase blocks us
 */
export function handleFirebaseRateLimit(): { waitMinutes: number; message: string } {
  const now = Date.now()
  const cooldownMinutes = 30 // Firebase typically blocks for ~30 minutes
  const cooldownUntil = now + (cooldownMinutes * 60 * 1000)
  
  setStorageData({
    attempts: MAX_ATTEMPTS,
    firstAttemptTime: now,
    cooldownUntil,
    lastAttemptTime: now
  })
  
  return {
    waitMinutes: cooldownMinutes,
    message: `Too many OTP requests. Please wait ${cooldownMinutes} minutes before trying again. This helps protect your account.`
  }
}

/**
 * Get remaining cooldown time in minutes (for display)
 */
export function getRemainingCooldown(): number {
  const data = getStorageData()
  const now = Date.now()
  
  if (data.cooldownUntil && now < data.cooldownUntil) {
    return Math.ceil((data.cooldownUntil - now) / (1000 * 60))
  }
  
  return 0
}

/**
 * Clear rate limit data (for testing or admin use)
 */
export function clearOTPRateLimit(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(OTP_STORAGE_KEY)
}

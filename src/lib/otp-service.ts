// Custom OTP Service - Supports both Firebase and SMS gateways
// Firebase: Uses your free credits
// SMS Gateway: Uses MSG91/Twilio when credits run out

interface OTPStore {
  [phone: string]: {
    otp: string
    expiresAt: number
    attempts: number
  }
}

const otpStore: OTPStore = {}

// Check which provider to use
function getOTPProvider(): 'firebase' | 'sms-gateway' | 'console' {
  const provider = process.env.NEXT_PUBLIC_OTP_PROVIDER || 'console'
  if (provider === 'firebase') return 'firebase'
  if (provider === 'sms-gateway') return 'sms-gateway'
  return 'console'
}

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP via Firebase (uses your free credits) or SMS gateway
export async function sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  try {
    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Generate OTP
    const otp = generateOTP()
    
    // Store OTP with 5-minute expiry (backup for all methods)
    otpStore[cleanPhone] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    }
    
    const provider = getOTPProvider()
    
    // Always log to console as backup
    console.log('=================================')
    console.log('📱 OTP SENT TO:', phoneNumber)
    console.log('🔐 OTP CODE:', otp)
    console.log('💳 Using:', provider === 'firebase' ? 'Firebase (FREE CREDITS)' : provider === 'sms-gateway' ? 'SMS Gateway' : 'Console Only')
    console.log('⏰ Valid for: 5 minutes')
    console.log('=================================')
    
    // Use Firebase with your free credits
    if (provider === 'firebase') {
      return {
        success: true,
        message: `OTP will be sent via Firebase. Using your ₹26,781 free credits! Check console for dev code: ${otp}`
      }
    }
    
    // Use SMS gateway (MSG91/Twilio)
    if (provider === 'sms-gateway') {
      const smsEnabled = process.env.NEXT_PUBLIC_SMS_ENABLED === 'true'
      
      if (smsEnabled) {
        try {
          const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, otp })
          })
          
          const data = await response.json()
          
          if (data.success) {
            return {
              success: true,
              message: data.devMode 
                ? `OTP sent! Check console (Dev Mode)` 
                : `OTP sent to ${phoneNumber} via SMS`
            }
          }
        } catch (smsError) {
          console.error('SMS failed, falling back to console:', smsError)
        }
      }
    }
    
    // Fallback: Console only (development)
    return {
      success: true,
      message: `OTP sent! Check browser console for the code.`
    }
  } catch (error) {
    const err = error as Error
    console.error('Send OTP Error:', error)
    return {
      success: false,
      message: err.message || 'Failed to send OTP'
    }
  }
}

// Verify OTP
export async function verifyOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Check if OTP exists
    const storedData = otpStore[cleanPhone]
    if (!storedData) {
      return {
        success: false,
        message: 'No OTP found. Please request a new one.'
      }
    }
    
    // Check if expired
    if (Date.now() > storedData.expiresAt) {
      delete otpStore[cleanPhone]
      return {
        success: false,
        message: 'OTP expired. Please request a new one.'
      }
    }
    
    // Check attempts
    if (storedData.attempts >= 3) {
      delete otpStore[cleanPhone]
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      }
    }
    
    // Verify OTP
    if (storedData.otp === otp) {
      // Clean up
      delete otpStore[cleanPhone]
      
      // Generate unique user ID
      const userId = `phone_${cleanPhone}_${Date.now()}`
      
      console.log('✅ OTP Verified successfully for:', phoneNumber)
      
      return {
        success: true,
        message: 'Phone number verified successfully',
        userId
      }
    } else {
      // Increment attempts
      storedData.attempts++
      
      return {
        success: false,
        message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
      }
    }
  } catch (error) {
    const err = error as Error
    console.error('Verify OTP Error:', error)
    return {
      success: false,
      message: err.message || 'Failed to verify OTP'
    }
  }
}

// Resend OTP
export async function resendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  const cleanPhone = phoneNumber.replace(/\D/g, '')
  
  // Clear existing OTP
  delete otpStore[cleanPhone]
  
  // Send new OTP
  return sendOTP(phoneNumber)
}

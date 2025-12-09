'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Phone, AlertCircle, CheckCircle, ArrowRight, RefreshCw, Shield } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase'

// Invalid phone patterns to block
const INVALID_PHONE_PATTERNS = [
  /^(.)\1{9}$/, // All same digits: 1111111111, 9999999999
  /^0{10}$/, // All zeros
  /^1234567890$/, // Sequential
  /^0123456789$/, // Sequential with 0
  /^9876543210$/, // Reverse sequential
  /^1234512345$/, // Repeated pattern
  /^0000000000$/, // All zeros
  /^12345678(9|0)?0?$/, // Common test numbers
]

// Validate phone number
function validatePhone(phone: string): { valid: boolean; error?: string } {
  const cleanPhone = phone.replace(/[\s-]/g, '')
  
  if (cleanPhone.length !== 10) {
    return { valid: false, error: 'Phone number must be exactly 10 digits' }
  }
  
  if (!/^\d{10}$/.test(cleanPhone)) {
    return { valid: false, error: 'Phone number must contain only digits' }
  }
  
  for (const pattern of INVALID_PHONE_PATTERNS) {
    if (pattern.test(cleanPhone)) {
      return { valid: false, error: 'Please enter a valid phone number' }
    }
  }
  
  if (!/^[6-9]/.test(cleanPhone)) {
    return { valid: false, error: 'Indian phone numbers must start with 6, 7, 8, or 9' }
  }
  
  return { valid: true }
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [countryCode] = useState('+91')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [role, setRole] = useState('customer')
  const [countdown, setCountdown] = useState(0)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)

  // Initialize reCAPTCHA
  const initializeRecaptcha = useCallback(() => {
    if (typeof window === 'undefined' || recaptchaVerifier) return
    
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.')
          setRecaptchaVerifier(null)
        }
      })
      setRecaptchaVerifier(verifier)
    } catch (err) {
      console.error('Failed to initialize reCAPTCHA:', err)
    }
  }, [recaptchaVerifier])

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        setUser(user)

        const { data: profile } = await supabase
          .from('profiles')
          .select('phone, role, phone_verified')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.phone && profile?.phone_verified) {
          router.push(`/${profile.role || 'customer'}/dashboard`)
          return
        }

        setRole(profile?.role || 'customer')
        setChecking(false)
        
        // Initialize reCAPTCHA after checking profile
        setTimeout(initializeRecaptcha, 500)
      } catch (err) {
        console.error('Error checking profile:', err)
        setChecking(false)
      }
    }

    checkProfile()
  }, [router, initializeRecaptcha])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Validate phone as user types
  useEffect(() => {
    if (phone) {
      const validation = validatePhone(phone)
      setPhoneError(validation.valid ? '' : validation.error || '')
    } else {
      setPhoneError('')
    }
  }, [phone])

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''))
      otpInputRefs.current[5]?.focus()
    }
  }

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  // Send OTP using Firebase
  const handleSendOtp = async () => {
    if (!user) return
    
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const validation = validatePhone(phone)
      if (!validation.valid) {
        setError(validation.error || 'Invalid phone number')
        setLoading(false)
        return
      }

      // First check with our API if phone exists
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, countryCode })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP')
        setLoading(false)
        return
      }

      // Initialize reCAPTCHA if needed
      if (!recaptchaVerifier) {
        initializeRecaptcha()
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (!recaptchaVerifier) {
        setError('Please wait while we initialize verification...')
        setLoading(false)
        setTimeout(initializeRecaptcha, 100)
        return
      }

      const cleanPhone = phone.replace(/[\s-]/g, '')
      const fullPhone = `${countryCode}${cleanPhone}`
      
      // Send OTP via Firebase
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier)
      setConfirmationResult(result)

      setMaskedPhone(data.phone || phone.slice(-4).padStart(10, '*'))
      setStep('otp')
      setCountdown(60)
      setSuccess('OTP sent successfully!')
      setTimeout(() => setSuccess(''), 3000)
      
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
      
    } catch (err: any) {
      console.error('Send OTP error:', err)
      
      // Handle specific Firebase errors
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('Verification failed. Please refresh and try again.')
        setRecaptchaVerifier(null)
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.')
      }
      
      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear()
        } catch (e) {
          // Ignore
        }
        setRecaptchaVerifier(null)
        setTimeout(initializeRecaptcha, 500)
      }
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP using Firebase
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.')
      setStep('phone')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Verify OTP with Firebase
      await confirmationResult.confirm(otpCode)
      
      // OTP verified! Now update Supabase profile
      const cleanPhone = phone.replace(/[\s-]/g, '')
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: cleanPhone,
          country_code: countryCode,
          phone_verified: true,
          phone_verified_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        setError('Failed to update profile. Please try again.')
        setLoading(false)
        return
      }

      setSuccess('Phone verified successfully! Redirecting...')
      
      setTimeout(() => {
        router.push(`/${role}/dashboard`)
      }, 1500)

    } catch (err: any) {
      console.error('Verify OTP error:', err)
      
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.')
      } else if (err.code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new one.')
        setStep('phone')
      } else {
        setError('Verification failed. Please try again.')
      }
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return
    setOtp(['', '', '', '', '', ''])
    setConfirmationResult(null)
    
    // Reset reCAPTCHA for resend
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear()
      } catch (e) {
        // Ignore
      }
      setRecaptchaVerifier(null)
    }
    setTimeout(() => {
      initializeRecaptcha()
      setTimeout(handleSendOtp, 500)
    }, 100)
  }

  // Go back to phone input
  const handleChangePhone = () => {
    setStep('phone')
    setOtp(['', '', '', '', '', ''])
    setError('')
    setSuccess('')
    setConfirmationResult(null)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-teal-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-teal-50 p-4 relative overflow-hidden">
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
      
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-2xl border-2 border-purple-100 shadow-2xl rounded-3xl p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4 group">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl p-0.5 group-hover:scale-110 transition-transform duration-300">
                <div className="h-full w-full bg-white rounded-2xl flex items-center justify-center p-2">
                  <Image src="/logo.jpg" alt="Helparo" width={40} height={40} className="object-contain" />
                </div>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Helparo</span>
            </Link>
            
            <div className="flex justify-center mb-3">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl ${
                step === 'otp' ? 'bg-gradient-to-br from-teal-500 to-emerald-500' : 'bg-gradient-to-br from-purple-600 to-teal-500'
              } text-white`}>
                {step === 'otp' ? <Shield className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {step === 'phone' ? 'Verify Your Phone' : 'Enter OTP'}
            </h1>
            <p className="text-gray-600 text-sm">
              {step === 'phone' 
                ? 'We\'ll send you a verification code' 
                : `Enter the 6-digit code sent to ${countryCode} ${maskedPhone}`
              }
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-3 h-3 rounded-full ${step === 'phone' ? 'bg-purple-600' : 'bg-green-500'}`}></div>
            <div className={`w-12 h-1 rounded ${step === 'otp' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            <div className={`w-3 h-3 rounded-full ${step === 'otp' ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
          </div>

          {/* Phone Input Step */}
          {step === 'phone' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-semibold">Phone Number</Label>
                <div className="flex gap-2">
                  <select
                    className="flex h-12 w-24 rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300"
                    value={countryCode}
                    disabled
                  >
                    <option value="+91">+91 🇮🇳</option>
                  </select>
                  <div className="relative flex-1">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      className={`h-12 bg-white border-2 ${phoneError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'} focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300 text-lg`}
                    />
                    {phone && !phoneError && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
                
                {phoneError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {phoneError}
                  </div>
                )}
                
                {phone && !phoneError && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Valid phone number
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleSendOtp}
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold text-lg py-6 rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300" 
                disabled={loading || !!phoneError || !phone || phone.length !== 10}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* OTP Input Step */}
          {step === 'otp' && (
            <div className="space-y-5">
              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300"
                  />
                ))}
              </div>

              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleVerifyOtp}
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold text-lg py-6 rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300" 
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Verify OTP
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={handleChangePhone}
                  className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                  Change Number
                </button>
                
                <button
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                  className={`flex items-center gap-1 font-medium transition-colors ${
                    countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:text-purple-800'
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${loading && countdown === 0 ? 'animate-spin' : ''}`} />
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-500 mt-6">
            {step === 'phone' 
              ? 'Standard SMS rates may apply. We\'ll send a 6-digit code to verify your number.'
              : 'Didn\'t receive the code? Check your SMS inbox or request a new code.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

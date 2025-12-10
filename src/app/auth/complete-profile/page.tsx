'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Phone, AlertCircle, CheckCircle, ArrowRight, RefreshCw, Shield, Smartphone, Lock, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase'

// Invalid phone patterns to block
const INVALID_PHONE_PATTERNS = [
  /^(.)\1{9}$/,
  /^0{10}$/,
  /^1234567890$/,
  /^0123456789$/,
  /^9876543210$/,
  /^1234512345$/,
  /^0000000000$/,
  /^12345678(9|0)?0?$/,
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
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)

  // Initialize reCAPTCHA - only once
  const initializeRecaptcha = useCallback(() => {
    if (typeof window === 'undefined') return
    if (recaptchaInitialized) return
    if (recaptchaVerifier) return
    
    setRecaptchaInitialized(true)
    
    try {
      console.log('Initializing reCAPTCHA...')
      
      const existingContainer = document.getElementById('recaptcha-container')
      if (existingContainer) {
        existingContainer.innerHTML = ''
      }
      
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved')
          setRecaptchaReady(true)
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired')
          setRecaptchaVerifier(null)
          setRecaptchaReady(false)
          setRecaptchaInitialized(false)
        }
      })
      
      setRecaptchaVerifier(verifier)
      setRecaptchaReady(true)
      console.log('reCAPTCHA initialized successfully')
    } catch (err) {
      console.error('Failed to initialize reCAPTCHA:', err)
      setRecaptchaInitialized(false)
    }
  }, [recaptchaVerifier, recaptchaInitialized])

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

      if (!recaptchaVerifier || !recaptchaReady) {
        initializeRecaptcha()
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (!recaptchaVerifier) {
        setError('Verification not ready. Please try again.')
        setLoading(false)
        return
      }

      const cleanPhone = phone.replace(/[\s-]/g, '')
      const fullPhone = `${countryCode}${cleanPhone}`
      
      console.log('Sending OTP to:', fullPhone)
      
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier)
      setConfirmationResult(result)

      setMaskedPhone(data.phone || phone.slice(-4).padStart(10, '*'))
      setStep('otp')
      setCountdown(60)
      setSuccess('OTP sent successfully!')
      setTimeout(() => setSuccess(''), 3000)
      
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
      
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      console.error('Send OTP error:', err)
      
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      
      if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else if (error.code === 'auth/captcha-check-failed' || error.code === 'auth/argument-error' || (error.message && error.message.includes('reCAPTCHA'))) {
        if (isLocalhost) {
          setError('⚠️ Firebase Phone Auth does not work with real numbers on localhost. Please use a test phone number (+919555512345) or test on helparo.in')
        } else {
          setError('Verification failed. Please refresh the page and try again.')
        }
        setRecaptchaVerifier(null)
        setRecaptchaReady(false)
        setRecaptchaInitialized(false)
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.')
      } else {
        if (isLocalhost && error.code) {
          setError(`${error.message || 'Failed to send OTP'} (localhost: use test number +919555512345)`)
        } else {
          setError(error.message || 'Failed to send OTP. Please try again.')
        }
      }
      
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear()
        } catch (e) {
          // Ignore
        }
        setRecaptchaVerifier(null)
        setRecaptchaReady(false)
        setRecaptchaInitialized(false)
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
      await confirmationResult.confirm(otpCode)
      
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

    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      console.error('Verify OTP error:', err)
      
      if (error.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.')
      } else if (error.code === 'auth/code-expired') {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
      
      {/* Left Panel - Info Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-300 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
              <Image src="/logo.svg" alt="Helparo" width={36} height={36} className="object-contain" />
            </div>
            <span className="text-3xl font-black text-white tracking-tight">Helparo</span>
          </Link>

          {/* Main Content */}
          <div className="mb-12">
            <h1 className="text-4xl xl:text-5xl font-black text-white mb-6 leading-tight">
              {step === 'phone' ? 'Almost There!' : 'Verify Your Identity'}
            </h1>
            <p className="text-xl text-emerald-100 leading-relaxed max-w-md">
              {step === 'phone' 
                ? 'Just one more step to unlock your Helparo experience. Verify your phone for secure access.'
                : 'Enter the 6-digit code we just sent to your phone. This keeps your account safe.'
              }
            </p>
          </div>

          {/* Trust Features */}
          <div className="space-y-5">
            <div className="flex items-center gap-4 text-white/90 group">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Bank-Level Security</h3>
                <p className="text-emerald-100 text-sm">Your data is encrypted and protected</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-white/90 group">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Instant Verification</h3>
                <p className="text-emerald-100 text-sm">OTP delivered in seconds</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-white/90 group">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Privacy First</h3>
                <p className="text-emerald-100 text-sm">We never share your phone number</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-black text-white">50K+</div>
                <div className="text-emerald-100 text-sm">Verified Users</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div>
                <div className="text-3xl font-black text-white">99.9%</div>
                <div className="text-emerald-100 text-sm">Delivery Rate</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div>
                <div className="text-3xl font-black text-white">&lt;5s</div>
                <div className="text-emerald-100 text-sm">OTP Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Image src="/logo.svg" alt="Helparo" width={28} height={28} className="object-contain" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Helparo</span>
            </Link>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-lg ${
                step === 'otp' 
                  ? 'bg-gradient-to-br from-teal-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}>
                {step === 'otp' ? (
                  <Shield className="h-8 w-8 text-white" />
                ) : (
                  <Smartphone className="h-8 w-8 text-white" />
                )}
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {step === 'phone' ? 'Verify Your Phone' : 'Enter Verification Code'}
              </h1>
              <p className="text-gray-500">
                {step === 'phone' 
                  ? "We'll send you a 6-digit verification code" 
                  : `Code sent to ${countryCode} ${maskedPhone}`
                }
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'phone' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {step === 'otp' ? <CheckCircle className="h-5 w-5" /> : '1'}
              </div>
              <div className={`w-16 h-1 rounded-full transition-all ${step === 'otp' ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'otp' 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                2
              </div>
            </div>

            {/* Phone Input Step */}
            {step === 'phone' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm">
                    Phone Number
                  </Label>
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-20 h-14 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold">
                      +91 🇮🇳
                    </div>
                    <div className="relative flex-1">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        className={`h-14 text-lg font-medium bg-white border-2 ${
                          phoneError 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                            : phone && !phoneError
                              ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100'
                              : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100'
                        } rounded-xl focus:ring-4 transition-all duration-300`}
                      />
                      {phone && !phoneError && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CheckCircle className="h-6 w-6 text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {phoneError && (
                    <div className="flex items-center gap-2 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {phoneError}
                    </div>
                  )}
                  
                  {phone && !phoneError && phone.length === 10 && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Valid phone number
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button 
                  onClick={handleSendOtp}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300" 
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

                <p className="text-center text-xs text-gray-400">
                  Standard SMS rates may apply. We'll send a 6-digit code to verify your number.
                </p>
              </div>
            )}

            {/* OTP Input Step */}
            {step === 'otp' && (
              <div className="space-y-6">
                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
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
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 rounded-xl transition-all duration-300 ${
                        digit 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      } focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none`}
                    />
                  ))}
                </div>

                {success && (
                  <div className="p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    {success}
                  </div>
                )}

                {error && (
                  <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button 
                  onClick={handleVerifyOtp}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300" 
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
                      Verify & Continue
                    </>
                  )}
                </Button>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleChangePhone}
                    className="text-sm text-gray-600 hover:text-emerald-600 font-medium transition-colors flex items-center gap-1"
                  >
                    ← Change Number
                  </button>
                  
                  <button
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    className={`flex items-center gap-2 text-sm font-medium transition-all ${
                      countdown > 0 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading && countdown === 0 ? 'animate-spin' : ''}`} />
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400">
                  Didn't receive the code? Check your SMS inbox or request a new code.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Having trouble?{' '}
              <a href="mailto:support@helparo.in" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

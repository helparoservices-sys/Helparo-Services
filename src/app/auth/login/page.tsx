'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, ArrowRight, Shield, Star, Sparkles, Phone, RefreshCw, AlertCircle, Clock } from 'lucide-react'
import { logger } from '@/lib/logger'
import { createBrowserClient } from '@supabase/ssr'
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase'
import { signInWithGoogle } from '@/lib/capacitor-auth'
import { useStatusBar } from '@/lib/use-status-bar'
import { canRequestOTP, recordOTPAttempt, handleFirebaseRateLimit, getRemainingCooldown } from '@/lib/otp-rate-limit'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  
  // CLEARLY VISIBLE gray status bar - testing dynamic color
  useStatusBar('#9CA3AF', 'dark')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false)

  const [loading, setLoading] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0) // Minutes remaining for rate limit

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const countryCode = '+91'

  const goBackOrHome = () => {
    if (typeof window === 'undefined') return

    const referrer = document.referrer || ''
    const cameFromAuth = referrer.includes('/auth/')

    if (window.history.length > 1 && !cameFromAuth) {
      router.back()
    } else {
      router.replace('/')
    }
  }

  const initializeRecaptcha = useCallback(() => {
    if (typeof window === 'undefined' || recaptchaInitialized || recaptchaVerifier) return
    setRecaptchaInitialized(true)
    try {
      const existingContainer = document.getElementById('recaptcha-container')
      if (existingContainer) existingContainer.innerHTML = ''
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => setRecaptchaReady(true),
        'expired-callback': () => {
          setRecaptchaVerifier(null)
          setRecaptchaReady(false)
          setRecaptchaInitialized(false)
        }
      })
      setRecaptchaVerifier(verifier)
      setRecaptchaReady(true)
    } catch (err) {
      console.error('Failed to initialize reCAPTCHA:', err)
      setRecaptchaInitialized(false)
    }
  }, [recaptchaVerifier, recaptchaInitialized])

  useEffect(() => {
    if (step === 'phone') {
      initializeRecaptcha()
    }
  }, [step, initializeRecaptcha])

  // Check for existing rate limit on mount
  useEffect(() => {
    const remaining = getRemainingCooldown()
    if (remaining > 0) {
      setRateLimitCooldown(remaining)
      setError(`Too many OTP requests. Please wait ${remaining} minute${remaining > 1 ? 's' : ''} before trying again.`)
    }
  }, [])

  // Rate limit cooldown timer
  useEffect(() => {
    if (rateLimitCooldown > 0) {
      const timer = setTimeout(() => {
        const remaining = getRemainingCooldown()
        setRateLimitCooldown(remaining)
        if (remaining === 0) {
          setError('')
        }
      }, 60000) // Update every minute
      return () => clearTimeout(timer)
    }
  }, [rateLimitCooldown])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handlePhoneLogin = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    // Check client-side rate limit first
    const rateLimitCheck = canRequestOTP()
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.message || 'Too many requests. Please try again later.')
      setRateLimitCooldown(rateLimitCheck.waitMinutes || 15)
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if phone exists
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle()

      if (!profile) {
        setError('Phone number not registered. Please sign up first.')
        setLoading(false)
        return
      }

      if (!recaptchaVerifier || !recaptchaReady) {
        initializeRecaptcha()
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      if (!recaptchaVerifier) {
        setError('Verification not ready. Please try again.')
        setLoading(false)
        return
      }

      // Record the OTP attempt before making the request
      recordOTPAttempt()

      const fullPhone = `${countryCode}${phone}`
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier)
      setConfirmationResult(result)
      setMaskedPhone(`${countryCode} ${phone}`)
      setStep('otp')
      setCountdown(60)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      logger.error('Phone login error', { error: err })
      if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format')
      } else if (error.code === 'auth/too-many-requests') {
        // Firebase rate limit hit - set a longer cooldown
        const rateLimitInfo = handleFirebaseRateLimit()
        setError(rateLimitInfo.message)
        setRateLimitCooldown(rateLimitInfo.waitMinutes)
      } else {
        setError(error.message || 'Failed to send OTP')
      }
      
      if (recaptchaVerifier) {
        try { recaptchaVerifier.clear() } catch { /* ignore */ }
        setRecaptchaVerifier(null)
        setRecaptchaReady(false)
        setRecaptchaInitialized(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }
    if (!confirmationResult) {
      setError('Session expired. Please try again.')
      setStep('phone')
      return
    }

    setLoading(true)
    setError('')

    try {
      await confirmationResult.confirm(otpCode)
      
      // Get Firebase user
      const firebaseUser = auth.currentUser
      if (!firebaseUser) throw new Error('Authentication failed')

      // Find user in Supabase
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const cleanPhone = phone.replace(/[\s-]/g, '')
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, phone, role')
        .eq('phone', cleanPhone)
        .maybeSingle()

      if (!profile) {
        setError('User not found. Please sign up first.')
        setLoading(false)
        return
      }

      // Create a server-side Supabase session using the phone number
      // This calls our API route which has admin privileges to create sessions
      const response = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': document.cookie.split(';').find(c => c.trim().startsWith('csrf-token='))?.split('=')[1] || ''
        },
        body: JSON.stringify({ phone: cleanPhone })
      })

      const result = await response.json()
      
      if (!response.ok || result.error) {
        logger.error('Failed to create Supabase session', { error: result.error })
        setError(result.error || 'Login failed. Please try again.')
        setLoading(false)
        return
      }

      // Session created successfully, redirect to dashboard
      setNavigating(true)
      router.push(`/${profile.role}/dashboard`)
      // Don't set loading false - keep showing loading state during navigation
      return
      
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      logger.error('OTP verification error', { error: err })
      if (error.code === 'auth/invalid-verification-code') setError('Invalid OTP. Please try again.')
      else if (error.code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new one.')
        setStep('phone')
      } else setError('Verification failed. Please try again.')
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setOtp(['', '', '', '', '', ''])
    setConfirmationResult(null)
    setError('')
    setLoading(true)
    
    if (recaptchaVerifier) {
      try { recaptchaVerifier.clear() } catch { /* ignore */ }
      setRecaptchaVerifier(null)
    }
    setRecaptchaInitialized(false)
    
    try {
      initializeRecaptcha()
      await new Promise(resolve => setTimeout(resolve, 200))

      if (!recaptchaVerifier) {
        setError('Verification not ready. Please try again.')
        setLoading(false)
        return
      }

      const fullPhone = `${countryCode}${phone}`
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier)
      setConfirmationResult(result)
      setCountdown(60)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      logger.error('Resend OTP error', { error: err })
      setError(error.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpInputRefs.current[index - 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''))
      otpInputRefs.current[5]?.focus()
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    
    try {
      // Use capacitor-auth helper which handles in-app browser for Capacitor
      const { error } = await signInWithGoogle('customer')
      
      if (error) {
        logger.error('Google login error', { error })
        setError(error.message)
        setGoogleLoading(false)
      }
    } catch (err: unknown) {
      logger.error('Google login error', { error: err })
      setError('Failed to sign in with Google')
      setGoogleLoading(false)
    }
  }

  // const handlePasswordLogin = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setError('')
  //   setLoading(true)

  //   try {
  //     const formDataObj = new FormData()
  //     formDataObj.append('email', formData.email)
  //     formDataObj.append('password', formData.password)
      
  //     const result = await loginAction(formDataObj)
      
  //     if (result?.error) {
  //       setError(result.error)
  //       setLoading(false)
  //     }
  //   } catch (err: unknown) {
  //     const errorMessage = err instanceof Error ? err.message : 'Invalid email or password'
  //     logger.error('Login error', { error: err })
  //     setError(errorMessage)
  //     setLoading(false)
  //   }
  // }

  return (
    <div className="min-h-screen bg-white lg:bg-gradient-to-br lg:from-gray-50 lg:via-white lg:to-emerald-50/30 flex">
      <div id="recaptcha-container"></div>
      
      {/* Left Side - Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div>
              <span className="text-2xl font-black text-white font-heading block tracking-tight">helparo</span>
              <span className="text-xs font-semibold text-emerald-200 tracking-wider uppercase">Home Services</span>
            </div>
          </Link>

          {/* Main Content */}
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
              Welcome back to
              <span className="block text-emerald-200">quality home services</span>
            </h1>
            <p className="text-lg text-white/80 mb-10">
              Join 50,000+ families who trust Helparo for their home service needs. Professional help is just a click away.
            </p>

            {/* Feature Cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Verified Professionals</h3>
                  <p className="text-sm text-white/70">All helpers are background-verified</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">4.9★ Rated Service</h3>
                  <p className="text-sm text-white/70">Trusted by thousands of customers</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI-Powered Matching</h3>
                  <p className="text-sm text-white/70">Find the perfect helper instantly</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="flex items-center gap-8">
            <div>
              <div className="text-3xl font-black text-white">50K+</div>
              <div className="text-sm text-white/60">Happy Customers</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <div className="text-3xl font-black text-white">10K+</div>
              <div className="text-sm text-white/60">Verified Helpers</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <div className="text-3xl font-black text-white">4.9</div>
              <div className="text-sm text-white/60">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header - Fixed with safe area padding for status bar */}
        <div className="lg:hidden flex items-center justify-center p-4 pt-safe border-b border-gray-100 bg-white">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-gray-900 font-heading tracking-tight">helparo</span>
          </Link>
        </div>

        {/* Desktop Back Button */}
        <div className="hidden lg:flex items-center p-6">
          <button type="button" onClick={goBackOrHome} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-medium">Back to home</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-5 py-6 sm:p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="hidden lg:flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl font-black text-gray-900 font-heading tracking-tight">helparo</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
              <p className="text-sm text-gray-500">
                Sign in to book trusted home services
              </p>
            </div>

            {/* Clean Card */}
            <div className="space-y-5">
                {step === 'phone' ? (
                  <div className="space-y-4">
                    {/* Phone Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-500">
                          <Phone className="w-5 h-5" />
                          <span className="text-sm font-medium">+91</span>
                          <div className="w-px h-5 bg-gray-300" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9876543210"
                          className="w-full h-14 pl-24 pr-4 bg-white border border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">We&apos;ll send you a 6-digit verification code</p>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={handlePhoneLogin}
                      disabled={phone.length !== 10 || loading}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="hidden lg:block">
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">or</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 transition-colors disabled:opacity-50"
                      >
                        {googleLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                        ) : (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>Continue with Google</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-7 h-7 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Enter verification code</h2>
                      <p className="text-sm text-gray-500">
                        Sent to <span className="font-medium text-gray-700">{maskedPhone}</span>
                      </p>
                    </div>

                    <div className="flex justify-center gap-2 sm:gap-3">
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
                          onPaste={handleOtpPaste}
                          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-sm"
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      {countdown > 0 ? (
                        <p className="text-sm text-gray-500">
                          Resend in <span className="font-medium text-emerald-600">{countdown}s</span>
                        </p>
                      ) : (
                        <button
                          onClick={handleResendOtp}
                          disabled={loading}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 mx-auto"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Resend OTP</span>
                        </button>
                      )}
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={handleVerifyOtp}
                      disabled={otp.join('').length !== 6 || loading || navigating}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {(loading || navigating) ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{navigating ? 'Redirecting...' : 'Verifying...'}</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Login</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setStep('phone')
                        setOtp(['', '', '', '', '', ''])
                        setError('')
                      }}
                      className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Change phone number</span>
                    </button>
                  </div>
                )}
            </div>

            {/* Sign Up */}
            <p className="text-center text-sm text-gray-500 mt-6 lg:mt-8">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Badge - hidden on mobile */}
        <div className="hidden lg:flex items-center justify-center gap-2 p-4 border-t border-gray-100 text-gray-400 text-sm">
          <Shield className="w-4 h-4" />
          <span>Secured with 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  )
}

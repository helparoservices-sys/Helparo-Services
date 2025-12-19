'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowLeft, ArrowRight, Phone, RefreshCw, AlertCircle, User, Briefcase } from 'lucide-react'
import { LegalModal } from '@/components/legal/legal-modal'
import { logger } from '@/lib/logger'
import { createBrowserClient } from '@supabase/ssr'
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase'
import { signInWithGoogle } from '@/lib/capacitor-auth'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')

  const [role, setRole] = useState<'customer' | 'helper' | null>(
    roleParam === 'customer' || roleParam === 'helper' ? roleParam : null
  )
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const countryCode = '+91'

  const goBackOrHome = () => {
    if (typeof window === 'undefined') return
    if (window.history.length > 1) router.back()
    else router.push('/')
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
      setTimeout(() => initializeRecaptcha(), 500)
    }
  }, [step, initializeRecaptcha])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOtp = async () => {
    if (!role) {
      setError('Please select whether you want to Get Help or Provide Help')
      return
    }
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    if (!agreedToTerms) {
      setError('Please agree to Terms & Privacy Policy first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle()

      if (existingProfile) {
        setError('This phone number is already registered. Please login instead.')
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

      const fullPhone = `${countryCode}${phone}`
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier)
      setConfirmationResult(result)
      setMaskedPhone(`${countryCode}${phone}`)
      setStep('otp')
      setCountdown(60)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      logger.error('Phone signup error', { error: err })
      if (error.code === 'auth/invalid-phone-number') setError('Invalid phone number format')
      else if (error.code === 'auth/too-many-requests') setError('Too many requests. Please try again later.')
      else setError(error.message || 'Failed to send OTP')
      
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
      
      const firebaseUser = auth.currentUser
      if (!firebaseUser) throw new Error('Authentication failed')

      const response = await fetch('/api/auth/phone-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role })
      })

      const result = await response.json()
      
      if (!response.ok || result.error) {
        logger.error('Failed to create account', { error: result.error })
        setError(result.error || 'Signup failed. Please try again.')
        setLoading(false)
        return
      }

      router.push(`/${role}/dashboard`)
      
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      logger.error('OTP verification error', { error: err })
      if (error.code === 'auth/invalid-verification-code') setError('Invalid OTP. Please try again.')
      else if (error.code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new one.')
        setStep('phone')
      } else setError('Verification failed. Please try again.')
    } finally {
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
      await new Promise(resolve => setTimeout(resolve, 100))
      initializeRecaptcha()
      await new Promise(resolve => setTimeout(resolve, 500))

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

  const handleGoogleSignUp = async () => {
    if (!role) {
      setError('Please select whether you want to Get Help or Provide Help')
      return
    }
    if (!agreedToTerms) {
      setError('Please agree to Terms & Privacy Policy first')
      return
    }
    
    setGoogleLoading(true)
    setError('')

    try {
      localStorage.setItem('pendingSignupRole', role)
      localStorage.setItem('roleSelected', 'true')
      
      // Use capacitor-auth helper which handles in-app browser for Capacitor
      const { error } = await signInWithGoogle(`${window.location.origin}/auth/callback`)
      
      if (error) {
        logger.error('Google signup error', { error })
        setError(error.message)
        setGoogleLoading(false)
      }
    } catch (err: unknown) {
      logger.error('Google signup error', { error: err })
      setError('Failed to sign up with Google')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex flex-col">
      <div id="recaptcha-container"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button type="button" onClick={goBackOrHome} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black text-gray-900 font-heading tracking-tight">helparo</span>
        </Link>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create account</h1>
            <p className="text-sm text-gray-500">Join 50K+ users on Helparo</p>
          </div>

          <div className="space-y-5">
            {step === 'phone' ? (
              <>
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        role === 'customer'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                        role === 'customer' ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        <User className={`w-5 h-5 ${role === 'customer' ? 'text-emerald-600' : 'text-gray-500'}`} />
                      </div>
                      <p className={`font-semibold text-sm ${role === 'customer' ? 'text-emerald-700' : 'text-gray-700'}`}>
                        Get Help
                      </p>
                      <p className="text-xs text-gray-500">Book services</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('helper')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        role === 'helper'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                        role === 'helper' ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        <Briefcase className={`w-5 h-5 ${role === 'helper' ? 'text-emerald-600' : 'text-gray-500'}`} />
                      </div>
                      <p className={`font-semibold text-sm ${role === 'helper' ? 'text-emerald-700' : 'text-gray-700'}`}>
                        Provide Help
                      </p>
                      <p className="text-xs text-gray-500">Earn money</p>
                    </button>
                  </div>
                  {!role && (
                    <p className="text-xs text-amber-600 mt-2">Please select an option</p>
                  )}
                </div>

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

                {/* Terms Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{' '}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-emerald-600 hover:underline">
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button type="button" onClick={() => setShowPrivacy(true)} className="text-emerald-600 hover:underline">
                      Privacy Policy
                    </button>
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
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

                {/* Google Sign Up - Only show for customers, not helpers */}
                {role !== 'helper' && (
                  <>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignUp}
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
                  </>
                )}
              </>
            ) : (
              /* OTP Step - Enhanced Design */
              <div className="space-y-6">
                {/* Animated Header */}
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    {/* Outer ring animation */}
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-ping opacity-30" />
                    {/* Middle ring */}
                    <div className="absolute inset-2 rounded-full border-2 border-emerald-300 animate-pulse" />
                    {/* Inner circle with icon */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your number</h2>
                  <p className="text-sm text-gray-500">
                    We sent a 6-digit code to
                  </p>
                  <p className="text-base font-semibold text-emerald-600 mt-1">{maskedPhone}</p>
                </div>

                {/* OTP Input with enhanced styling */}
                <div className="relative">
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
                        className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                          digit 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                        }`}
                      />
                    ))}
                  </div>
                  {/* Progress indicator */}
                  <div className="flex justify-center gap-1.5 mt-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        className={`h-1 w-6 rounded-full transition-all duration-300 ${
                          otp[i] ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Timer/Resend with better styling */}
                <div className="text-center py-2">
                  {countdown > 0 ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                      <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      <span className="text-sm text-gray-600">
                        Resend code in <span className="font-bold text-emerald-600">{countdown}s</span>
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-full text-emerald-600 font-medium transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Resend code</span>
                    </button>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Verify Button with gradient */}
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.join('').length !== 6 || loading}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating your account...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Create Account</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Change number link */}
                <button
                  onClick={() => {
                    setStep('phone')
                    setOtp(['', '', '', '', '', ''])
                    setError('')
                  }}
                  className="w-full text-sm text-gray-500 hover:text-emerald-600 flex items-center justify-center gap-1.5 py-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Change phone number</span>
                </button>
              </div>
            )}

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <LegalModal type="terms" audience={role || undefined} open={showTerms} onOpenChange={setShowTerms} />
          <LegalModal type="privacy" audience={role || undefined} open={showPrivacy} onOpenChange={setShowPrivacy} />
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}

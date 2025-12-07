'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Phone, ArrowRight, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { LegalModal } from '@/components/legal/legal-modal'
import { toast } from 'sonner'
import { sendOTP, verifyOTP, resendOTP } from '@/lib/otp-service'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'customer'
  
  // Multi-step form state: 'details' -> 'phone' -> 'otp' -> 'success'
  const [currentStep, setCurrentStep] = useState<'details' | 'phone' | 'otp' | 'success'>('details')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    countryCode: '+91',
    role: defaultRole as 'customer' | 'helper' | 'admin',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [legalConsent, setLegalConsent] = useState(false)

  // OTP related state
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [firebaseUserId, setFirebaseUserId] = useState<string>('')

  // Password strength validation
  const passwordStrength = {
    hasLength: formData.password.length >= 12,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[!@#$%^&*]/.test(formData.password),
  }

  const passwordMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ''

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // No reCAPTCHA needed with custom OTP service

  // Format phone number with country code
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `${formData.countryCode}${cleaned}`
    }
    return `${formData.countryCode}${cleaned}`
  }

  // Validate details form before proceeding to OTP
  const validateDetails = () => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name')
      return false
    }
    if (!formData.email.trim()) {
      setError('Please enter your email')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return false
    }
    if (!Object.values(passwordStrength).every(Boolean)) {
      setError('Password does not meet strength requirements')
      return false
    }
    if (!passwordMatch) {
      setError('Passwords do not match')
      return false
    }
    if (!legalConsent) {
      setError('Please accept the Terms & Conditions and Privacy Policy')
      return false
    }
    return true
  }

  // Proceed to phone verification step
  const handleProceedToPhone = async () => {
    if (!validateDetails()) return
    setError('')
    setCurrentStep('phone')
  }

  // Send OTP to phone number using custom OTP service
  const handleSendOTP = async () => {
    try {
      setLoading(true)
      setError('')
      
      const formattedPhone = formatPhoneNumber(formData.phone)
      console.log('Sending OTP to:', formattedPhone)
      
      // Use custom OTP service (no Firebase, no reCAPTCHA needed)
      const result = await sendOTP(formattedPhone)
      
      if (result.success) {
        setCurrentStep('otp')
        setCountdown(60)
        toast.success(result.message)
      } else {
        throw new Error(result.message)
      }
      
    } catch (err: any) {
      console.error('Send OTP Error:', err)
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP and create account
  const handleVerifyOTP = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP')
      }

      const formattedPhone = formatPhoneNumber(formData.phone)
      console.log('Verifying OTP for:', formattedPhone)
      
      // Verify OTP using custom service
      const result = await verifyOTP(formattedPhone, otp)
      
      if (result.success && result.userId) {
        setPhoneVerified(true)
        setFirebaseUserId(result.userId)
        toast.success('Phone verified successfully!')
        
        // Create user account in Supabase
        await createUserAccount(result.userId)
      } else {
        throw new Error(result.message)
      }
      
    } catch (err: any) {
      console.error('Verify OTP Error:', err)
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    setOtp('')
    setError('')
    
    try {
      setLoading(true)
      const formattedPhone = formatPhoneNumber(formData.phone)
      const result = await resendOTP(formattedPhone)
      
      if (result.success) {
        setCountdown(60)
        toast.success(result.message)
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  // Create user account in Supabase after phone verification
  const createUserAccount = async (firebaseUid: string) => {
    try {
      setLoading(true)
      setError('')

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            country_code: formData.countryCode,
            role: formData.role,
            firebase_uid: firebaseUid,
            phone_verified: true,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })
      
      if (signUpError) throw signUpError

      if (data.user) {
        setCurrentStep('success')
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      console.error('Signup error:', err)
      setError(error?.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  // Success Screen
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
        {/* Logo Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/logo.jpg" 
            alt="Helparo" 
            className="h-96 w-96 object-contain opacity-[0.03] dark:opacity-[0.02]"
          />
        </div>

        {/* Success Card */}
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-teal-500 text-white shadow-2xl shadow-purple-500/50 animate-bounce">
                  <CheckCircle className="h-10 w-10" />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent mb-2">Check Your Email</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We've sent a verification link to <strong className="text-slate-900 dark:text-white">{formData.email}</strong>
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">
                  Phone verified: {formData.countryCode} {formData.phone}
                </span>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please check your email and click the verification link to activate your account.
              </p>

              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105 transition-all duration-300" 
                onClick={() => router.push('/auth/login')}
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-teal-50 p-4 relative overflow-hidden">
      {/* Signup Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-2xl border-2 border-purple-100 shadow-2xl rounded-3xl p-8 hover:shadow-purple-500/20 transition-all duration-500">
          {/* Header with Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4 group">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl p-0.5 group-hover:scale-110 transition-transform duration-300">
                <div className="h-full w-full bg-white rounded-2xl flex items-center justify-center p-2">
                  <Image src="/logo.jpg" alt="Helparo" width={48} height={48} className="object-contain" />
                </div>
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Helparo</span>
            </Link>
            
            <h1 className="text-2xl font-black text-gray-900 mb-2">
              {currentStep === 'details' && 'Create Your Account'}
              {currentStep === 'phone' && 'Verify Your Phone'}
              {currentStep === 'otp' && 'Enter OTP'}
            </h1>
            <p className="text-sm text-gray-600 font-medium">
              {currentStep === 'details' && 'Join thousands of customers and helpers 🚀'}
              {currentStep === 'phone' && "We'll send you a 6-digit verification code"}
              {currentStep === 'otp' && `Enter the code sent to ${formData.countryCode} ${formData.phone}`}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-10 h-1 rounded-full transition-colors ${currentStep === 'details' ? 'bg-purple-600' : 'bg-purple-200'}`}></div>
            <div className={`w-10 h-1 rounded-full transition-colors ${currentStep === 'phone' ? 'bg-purple-600' : currentStep === 'otp' ? 'bg-purple-200' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-1 rounded-full transition-colors ${currentStep === 'otp' ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-fade-in mb-4">
              {error}
            </div>
          )}

          {/* Step 1: User Details */}
          {currentStep === 'details' && (
            <form onSubmit={(e) => { e.preventDefault(); handleProceedToPhone(); }} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-gray-900 font-bold">I want to</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={formData.role === 'customer' ? 'default' : 'outline'}
                  className={formData.role === 'customer' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold shadow-lg shadow-purple-500/30 border-0'
                    : 'border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 font-semibold transition-all duration-300'
                  }
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                >
                  Find Services
                </Button>
                <Button
                  type="button"
                  variant={formData.role === 'helper' ? 'default' : 'outline'}
                  className={formData.role === 'helper' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold shadow-lg shadow-purple-500/30 border-0'
                    : 'border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 font-semibold transition-all duration-300'
                  }
                  onClick={() => setFormData({ ...formData, role: 'helper' })}
                >
                  Offer Services
                </Button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-700 font-semibold">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="bg-white border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-white border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300"
              />
            </div>

            {/* Phone with Country Code */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-semibold">Phone Number</Label>
              <div className="flex gap-2">
                <select
                  className="flex h-10 w-24 rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                >
                  <option value="+91">+91 (IN)</option>
                </select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  required
                  maxLength={10}
                  className="bg-white border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300"
                />
              </div>
              <p className="text-xs text-gray-500">We&apos;ll send an OTP to verify this number</p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-white border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicators */}
              {formData.password && (
                <div className="space-y-1 text-xs">
                  <PasswordRequirement met={passwordStrength.hasLength} text="At least 12 characters" />
                  <PasswordRequirement met={passwordStrength.hasUpper} text="One uppercase letter" />
                  <PasswordRequirement met={passwordStrength.hasLower} text="One lowercase letter" />
                  <PasswordRequirement met={passwordStrength.hasNumber} text="One number" />
                  <PasswordRequirement met={passwordStrength.hasSpecial} text="One special character (!@#$%^&*)" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="bg-white border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <PasswordRequirement met={passwordMatch} text="Passwords match" />
              )}
            </div>

            {/* Legal consent */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="legalConsent"
                checked={legalConsent}
                onChange={(e) => setLegalConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 focus:ring-2 focus:ring-primary/50"
              />
              <Label htmlFor="legalConsent" className="text-xs leading-tight text-slate-600">
                I have read and agree to the{' '}
                <button type="button" onClick={() => setShowTerms(true)} className="text-primary hover:underline">Terms & Conditions</button>{' '}and{' '}
                <button type="button" onClick={() => setShowPrivacy(true)} className="text-primary hover:underline">Privacy Policy</button>. I understand I may be asked to re-accept if they update.
              </Label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold text-lg py-6 rounded-xl shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105 transition-all duration-300" 
              size="lg" 
              disabled={loading}
            >
              Continue to Phone Verification
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 font-medium">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-purple-600 font-bold hover:text-teal-600 hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </form>
          )}

          {/* Step 2: Send OTP */}
          {currentStep === 'phone' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Sending OTP to</p>
                <p className="text-xl font-bold text-gray-900">{formData.countryCode} {formData.phone}</p>
              </div>

              <Button 
                onClick={handleSendOTP} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <button
                onClick={() => {
                  setCurrentStep('details')
                  setError('')
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to details
              </button>
            </div>
          )}

          {/* Step 3: Verify OTP */}
          {currentStep === 'otp' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Enter 6-digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono bg-white border-2 border-gray-200 focus:border-purple-500"
                />
              </div>

              <Button 
                onClick={handleVerifyOTP} 
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend OTP in <span className="font-medium text-purple-600">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-purple-600 hover:underline font-medium"
                  >
                    Didn&apos;t receive OTP? Resend
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setCurrentStep('phone')
                  setOtp('')
                  setError('')
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Change phone number
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        <LegalModal type="terms" open={showTerms} onOpenChange={setShowTerms} />
        <LegalModal type="privacy" open={showPrivacy} onOpenChange={setShowPrivacy} />
      </div>
    </div>
  )
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
      ) : (
        <XCircle className="h-3 w-3 text-slate-400 dark:text-slate-500" />
      )}
      <span className={met ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>{text}</span>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}

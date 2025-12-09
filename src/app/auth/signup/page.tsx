'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { LegalModal } from '@/components/legal/legal-modal'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'customer'
  
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
  const [success, setSuccess] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  // Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    setError('')
    setLoading(true)

    try {
      // DON'T set pendingSignupRole - let complete-signup page show role selection
      // This gives users a chance to choose their role after Google OAuth
      // Clear any existing role selection
      localStorage.removeItem('pendingSignupRole')
      localStorage.removeItem('roleSelected')
      
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      })

      if (googleError) throw googleError
      
    } catch (err: unknown) {
      const error = err as { message?: string }
      console.error('Google signup error:', err)
      setError(error?.message || 'Failed to sign up with Google')
      setLoading(false)
    }
  }

  // Password strength validation
  const passwordStrength = {
    hasLength: formData.password.length >= 12,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[!@#$%^&*]/.test(formData.password),
  }

  const passwordMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate password
      if (!Object.values(passwordStrength).every(Boolean)) {
        throw new Error('Password does not meet strength requirements')
      }

      if (!passwordMatch) {
        throw new Error('Passwords do not match')
      }

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
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })
      
      if (signUpError) throw signUpError

      if (data.user) {
        setSuccess(true)
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      console.error('Signup error:', err)
      setError(error?.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
                  We&apos;ve sent a verification link to <strong className="text-slate-900 dark:text-white">{formData.email}</strong>
                </p>
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
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-md relative z-10 animate-float">
        <div className="bg-white/90 backdrop-blur-2xl border-2 border-purple-100 shadow-2xl rounded-3xl p-8 hover:shadow-purple-500/20 transition-all duration-500">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6 group">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl p-0.5 group-hover:scale-110 transition-transform duration-300">
                <div className="h-full w-full bg-white rounded-2xl flex items-center justify-center p-2">
                  <Image src="/logo.jpg" alt="Helparo" width={48} height={48} className="object-contain" />
                </div>
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Helparo</span>
            </Link>
            
            <h1 className="text-3xl font-black text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-sm text-gray-600 font-medium">
              Join thousands of customers and helpers 🚀
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="bg-white border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 hover:border-purple-300"
                />
              </div>
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
                required
                className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary/50"
              />
              <Label htmlFor="legalConsent" className="text-xs leading-tight text-slate-600 dark:text-slate-400">
                I have read and agree to the{' '}
                <Link href="/legal/terms" onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-primary hover:underline">Terms & Conditions</Link>{' '}and{' '}
                <Link href="/legal/privacy" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} className="text-primary hover:underline">Privacy Policy</Link>. I understand I may be asked to re-accept if they update.
              </Label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold text-lg py-6 rounded-xl shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105 transition-all duration-300" 
              size="lg" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google Sign Up Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 font-semibold py-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 font-medium">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-purple-600 font-bold hover:text-teal-600 hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </form>
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

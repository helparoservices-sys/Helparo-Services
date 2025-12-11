'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, CheckCircle, Loader2, ArrowLeft, Mail, Lock, User, Phone, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { LegalModal } from '@/components/legal/legal-modal'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'customer'
  const serviceParam = searchParams.get('service')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: defaultRole as 'customer' | 'helper',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSignUp = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      // Save the selected role to localStorage so complete-signup can use it
      localStorage.setItem('pendingSignupRole', formData.role)
      localStorage.setItem('roleSelected', 'true')
      
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (googleError) throw googleError
      
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error?.message || 'Failed to sign up with Google')
      setGoogleLoading(false)
    }
  }

  // Password validation
  const passwordChecks = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  }
  const passwordValid = Object.values(passwordChecks).every(Boolean)
  const passwordMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!passwordValid) {
        throw new Error('Password does not meet requirements')
      }
      if (!passwordMatch) {
        throw new Error('Passwords do not match')
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: formData.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })
      
      if (signUpError) throw signUpError
      if (data.user) setSuccess(true)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error?.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent a verification link to <strong>{formData.email}</strong>
          </p>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-12 px-8"
            onClick={() => router.push('/auth/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Helparo</span>
            </Link>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen flex">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-md">
            {/* Welcome Text */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create your account
              </h1>
              <p className="text-gray-600">
                {serviceParam 
                  ? `Book ${serviceParam} service in minutes`
                  : 'Join thousands of happy customers'}
              </p>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'customer' })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.role === 'customer'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Find Services</p>
                <p className="text-sm text-gray-500">I need help</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'helper' })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.role === 'helper'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Offer Services</p>
                <p className="text-sm text-gray-500">I want to earn</p>
              </button>
            </div>

            {/* Google Sign Up */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl font-medium transition-all"
              onClick={handleGoogleSignUp}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or sign up with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="h-12 pl-12 pr-4 border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-xl text-base"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12 pl-12 pr-4 border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-xl text-base"
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-12 pl-12 pr-4 border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-xl text-base"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12 pl-12 pr-12 border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-xl text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1 ${passwordChecks.length ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {passwordChecks.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    8+ characters
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.upper ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {passwordChecks.upper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Uppercase
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.lower ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {passwordChecks.lower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Lowercase
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.number ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {passwordChecks.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Number
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className={`h-12 pl-12 pr-12 border-2 focus:ring-0 rounded-xl text-base ${
                    formData.confirmPassword 
                      ? passwordMatch 
                        ? 'border-emerald-500 focus:border-emerald-500' 
                        : 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-emerald-500'
                  }`}
                />
                {formData.confirmPassword && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {passwordMatch ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors" 
                disabled={loading || !passwordValid || !passwordMatch}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-gray-600 mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-emerald-600 font-semibold hover:text-emerald-700">
                Sign in
              </Link>
            </p>

            {/* Legal */}
            <p className="text-center text-xs text-gray-500 mt-4">
              By creating an account, you agree to our{' '}
              <button onClick={() => setShowTerms(true)} className="text-emerald-600 hover:underline">
                Terms
              </button>
              {' '}and{' '}
              <button onClick={() => setShowPrivacy(true)} className="text-emerald-600 hover:underline">
                Privacy Policy
              </button>
            </p>

            <LegalModal type="terms" open={showTerms} onOpenChange={setShowTerms} />
            <LegalModal type="privacy" open={showPrivacy} onOpenChange={setShowPrivacy} />
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center p-12">
          <div className="max-w-md text-white">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
              <span className="text-4xl font-bold">H</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Get things done, the right way.
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Verified professionals, transparent pricing, and hassle-free booking. Your home deserves the best.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span>Background verified helpers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span>Transparent upfront pricing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span>100% satisfaction guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}

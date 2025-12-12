'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, CheckCircle, Loader2, ArrowLeft, Mail, Lock, User, Phone, Check, X, Shield, Sparkles, Star, Zap } from 'lucide-react'
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="max-w-md w-full text-center relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">Check your email! 📧</h1>
          <p className="text-gray-600 mb-8">
            We&apos;ve sent a verification link to <strong className="text-emerald-600">{formData.email}</strong>
          </p>
          <Button 
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl h-14 px-10 shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all"
            onClick={() => router.push('/auth/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,0.05),transparent_70%)]" />
      </div>

      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold hidden sm:block">Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg">H</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-extrabold text-gray-900">helparo</span>
                <span className="text-[9px] font-semibold text-emerald-600 tracking-[0.15em] uppercase -mt-1">Home Services</span>
              </div>
            </Link>
            <div className="w-20 sm:w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen flex relative">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 lg:py-8">
          <div className="w-full max-w-md">
            {/* Welcome Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Join 50,000+ Happy Customers
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
                Create your account
              </h1>
              <p className="text-gray-500 text-lg">
                {serviceParam 
                  ? `Book ${serviceParam} service in minutes`
                  : 'Get verified home services at your doorstep'}
              </p>
            </div>

            {/* Role Selection - Commented out: Role is now selected on complete-signup page
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
            */}

            {/* Google Sign Up */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-2xl font-semibold transition-all shadow-sm hover:shadow-md"
              onClick={handleGoogleSignUp}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
                  <span className="text-gray-600">Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-gray-700">Continue with Google</span>
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-medium">or sign up with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="h-14 pl-12 pr-4 border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-2xl text-base transition-all hover:border-gray-300"
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-14 pl-12 pr-4 border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-2xl text-base transition-all hover:border-gray-300"
                />
              </div>

              {/* Phone */}
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-14 pl-12 pr-4 border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-2xl text-base transition-all hover:border-gray-300"
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-14 pl-12 pr-12 border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-2xl text-base transition-all hover:border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Password must include:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-2 p-1.5 rounded-lg ${passwordChecks.length ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
                      {passwordChecks.length ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span className="font-medium">8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-2 p-1.5 rounded-lg ${passwordChecks.upper ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
                      {passwordChecks.upper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span className="font-medium">Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-2 p-1.5 rounded-lg ${passwordChecks.lower ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
                      {passwordChecks.lower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span className="font-medium">Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-2 p-1.5 rounded-lg ${passwordChecks.number ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
                      {passwordChecks.number ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span className="font-medium">Number</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className={`h-14 pl-12 pr-12 border-2 focus:ring-0 rounded-2xl text-base transition-all ${
                    formData.confirmPassword 
                      ? passwordMatch 
                        ? 'border-emerald-500 focus:border-emerald-500 bg-emerald-50/30' 
                        : 'border-red-300 focus:border-red-500 bg-red-50/30'
                      : 'border-gray-200 focus:border-emerald-500 hover:border-gray-300'
                  }`}
                />
                {formData.confirmPassword && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {passwordMatch ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100" 
                disabled={loading || !passwordValid || !passwordMatch}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <Sparkles className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-gray-600 mt-8">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors">
                Sign in
              </Link>
            </p>

            {/* Legal */}
            <p className="text-center text-xs text-gray-400 mt-6">
              By creating an account, you agree to our{' '}
              <button onClick={() => setShowTerms(true)} className="text-emerald-600 font-medium hover:underline">
                Terms
              </button>
              {' '}and{' '}
              <button onClick={() => setShowPrivacy(true)} className="text-emerald-600 font-medium hover:underline">
                Privacy Policy
              </button>
            </p>

            <LegalModal type="terms" open={showTerms} onOpenChange={setShowTerms} />
            <LegalModal type="privacy" open={showPrivacy} onOpenChange={setShowPrivacy} />
          </div>
        </div>

        {/* Right Side - Premium Branding */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 items-center justify-center p-12 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="max-w-md text-white relative z-10">
            {/* Logo */}
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 shadow-2xl">
              <span className="text-5xl font-black">H</span>
            </div>
            
            <h2 className="text-4xl font-black mb-4 leading-tight">
              Get things done,<br />the right way.
            </h2>
            <p className="text-lg text-white/80 mb-10 leading-relaxed">
              Verified professionals, transparent pricing, and hassle-free booking. Your home deserves the best.
            </p>
            
            {/* Features */}
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/15 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">Background verified helpers</p>
                  <p className="text-sm text-white/70">100% verified & trusted</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/15 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">Transparent upfront pricing</p>
                  <p className="text-sm text-white/70">No hidden charges ever</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/15 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">100% satisfaction guarantee</p>
                  <p className="text-sm text-white/70">Or your money back</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-10 pt-8 border-t border-white/20">
              <div>
                <p className="text-3xl font-black">50K+</p>
                <p className="text-sm text-white/70">Happy Customers</p>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div>
                <p className="text-3xl font-black">10K+</p>
                <p className="text-sm text-white/70">Verified Pros</p>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div>
                <p className="text-3xl font-black">4.9★</p>
                <p className="text-sm text-white/70">Rating</p>
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

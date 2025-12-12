'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, Loader2, ArrowLeft, Mail, Lock, User, Phone, Check, X, ArrowRight } from 'lucide-react'
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
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleGoogleSignUp = async () => {
    setError('')
    setGoogleLoading(true)

    try {
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Check your email! 📧</h1>
          <p className="text-gray-400 text-lg mb-10">
            We&apos;ve sent a verification link to <strong className="text-emerald-400">{formData.email}</strong>
          </p>
          <button 
            className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:scale-105"
            onClick={() => router.push('/auth/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/30 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-[80px] animate-pulse-slow animation-delay-4000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Back Button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium hidden sm:block">Back</span>
      </Link>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70" />
        
        <div className="relative bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <span className="text-xl font-black text-white">H</span>
              </div>
              <div className="text-left">
                <span className="text-xl font-bold text-white block">helparo</span>
                <span className="text-[9px] font-semibold text-emerald-400 tracking-[0.2em] uppercase">Home Services</span>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
            <p className="text-gray-400 text-sm">Get started with your free account</p>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full h-11 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 rounded-xl font-semibold text-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20 text-sm"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div className="relative">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'name' ? 'text-emerald-400' : 'text-gray-500'}`}>
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                required
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:bg-white/10 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'email' ? 'text-emerald-400' : 'text-gray-500'}`}>
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:bg-white/10 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'phone' ? 'text-emerald-400' : 'text-gray-500'}`}>
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                required
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:bg-white/10 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'password' ? 'text-emerald-400' : 'text-gray-500'}`}>
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                className="w-full h-11 pl-10 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:bg-white/10 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className={`flex items-center gap-1.5 p-1.5 rounded-lg ${passwordChecks.length ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500'}`}>
                  {passwordChecks.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>8+ chars</span>
                </div>
                <div className={`flex items-center gap-1.5 p-1.5 rounded-lg ${passwordChecks.upper ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500'}`}>
                  {passwordChecks.upper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Uppercase</span>
                </div>
                <div className={`flex items-center gap-1.5 p-1.5 rounded-lg ${passwordChecks.lower ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500'}`}>
                  {passwordChecks.lower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Lowercase</span>
                </div>
                <div className={`flex items-center gap-1.5 p-1.5 rounded-lg ${passwordChecks.number ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500'}`}>
                  {passwordChecks.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Number</span>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focusedField === 'confirm' ? 'text-emerald-400' : 'text-gray-500'}`}>
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                required
                className={`w-full h-11 pl-10 pr-10 border rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none transition-all duration-200 ${
                  formData.confirmPassword 
                    ? passwordMatch 
                      ? 'border-emerald-500/50 bg-emerald-500/10 focus:ring-2 focus:ring-emerald-500/20' 
                      : 'border-red-500/50 bg-red-500/10 focus:ring-2 focus:ring-red-500/20'
                    : 'bg-white/5 border-white/10 focus:bg-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              {formData.confirmPassword && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {passwordMatch ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <X className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !passwordValid || !passwordMatch}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In */}
          <p className="text-center text-gray-400 text-sm mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign in
            </Link>
          </p>

          {/* Legal */}
          <p className="text-center text-xs text-gray-600 mt-3">
            By creating an account, you agree to our{' '}
            <button onClick={() => setShowTerms(true)} className="text-gray-500 hover:text-white transition-colors">Terms</button>
            {' '}and{' '}
            <button onClick={() => setShowPrivacy(true)} className="text-gray-500 hover:text-white transition-colors">Privacy Policy</button>
          </p>

          <LegalModal type="terms" open={showTerms} onOpenChange={setShowTerms} />
          <LegalModal type="privacy" open={showPrivacy} onOpenChange={setShowPrivacy} />
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}

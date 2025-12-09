'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock } from 'lucide-react'
import { loginAction } from '@/app/actions/auth'
import { LegalModal } from '@/components/legal/legal-modal'
import { logger } from '@/lib/logger'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('email', formData.email)
      formDataObj.append('password', formData.password)
      
      const result = await loginAction(formDataObj)
      
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid email or password'
      logger.error('Login error', { error: err })
      setError(errorMessage)
      setLoading(false)
    }
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back
              </h1>
              <p className="text-gray-600">
                Sign in to continue booking services
              </p>
            </div>

            {/* Google Login - Primary Option */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl font-medium transition-all"
              onClick={handleGoogleLogin}
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
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
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
              </div>

              <div>
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-gray-600 mt-8">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-emerald-600 font-semibold hover:text-emerald-700">
                Sign up
              </Link>
            </p>

            {/* Legal */}
            <p className="text-center text-xs text-gray-500 mt-6">
              By continuing, you agree to our{' '}
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

        {/* Right Side - Branding (Desktop Only) */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center p-12">
          <div className="max-w-md text-white">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
              <span className="text-4xl font-bold">H</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Home services, simplified.
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Book verified professionals for all your home needs. Trusted by thousands across India.
            </p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-bold">10K+</p>
                <p className="text-sm text-white/80">Verified Helpers</p>
              </div>
              <div className="w-px h-12 bg-white/30"></div>
              <div>
                <p className="text-3xl font-bold">50K+</p>
                <p className="text-sm text-white/80">Happy Customers</p>
              </div>
              <div className="w-px h-12 bg-white/30"></div>
              <div>
                <p className="text-3xl font-bold">4.8★</p>
                <p className="text-sm text-white/80">Rating</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

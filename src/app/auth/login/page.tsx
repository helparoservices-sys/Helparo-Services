'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { loginAction /*, sendMagicLinkAction*/ } from '@/app/actions/auth'
import { LegalModal } from '@/components/legal/legal-modal'
import { logger } from '@/lib/logger'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  // Magic Link temporarily disabled. Keep code commented for future re-enable.
  const [loginMethod, setLoginMethod] = useState<'password'>('password')
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
  // const [magicLinkSent, setMagicLinkSent] = useState(false)

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
    } catch (err: any) {
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
      // Success - loginAction handles the redirect server-side
      // No need to do anything here, just keep loading state
    } catch (err: any) {
      logger.error('Login error', { error: err })
      setError(err.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  // const handleMagicLink = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setError('')
  //   setLoading(true)
  //   try {
  //     const formDataObj = new FormData()
  //     formDataObj.append('email', formData.email)
  //     const result = await sendMagicLinkAction(formDataObj)
  //     if (result?.error) {
  //       setError(result.error)
  //     } else if ('success' in result && result.success) {
  //       setMagicLinkSent(true)
  //     }
  //   } catch (err: any) {
  //     logger.error('Magic link error', { error: err })
  //     setError(err.message || 'Failed to send magic link')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // if (magicLinkSent) {
  //   return (/* Magic link confirmation UI disabled temporarily */ null)
  // }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-teal-50 p-4 relative overflow-hidden">
      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
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
            
            <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-sm text-gray-600 font-medium">
              Sign in to your account 👋
            </p>
          </div>

          {/* Password Login Form */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-purple-600 hover:text-teal-600 hover:underline font-semibold transition-colors">
                    Forgot password?
                  </Link>
                </div>
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
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold text-lg py-6 rounded-xl shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105 transition-all duration-300" 
                size="lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 py-6 rounded-xl transition-all duration-300"
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
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* Magic Link Form disabled temporarily */}

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600 font-medium mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-purple-600 font-bold hover:text-teal-600 hover:underline transition-colors">
              Sign Up
            </Link>
          </p>

          {/* Legal links as modal */}
          <div className="text-center text-xs text-gray-500 mt-3">
            By signing in, you agree to our{' '}
            <a href="/legal/terms" onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-purple-600 hover:underline font-semibold">Terms</a>
            {' '}and{' '}
            <a href="/legal/privacy" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} className="text-purple-600 hover:underline font-semibold">Privacy Policy</a>.
          </div>

          <LegalModal type="terms" open={showTerms} onOpenChange={setShowTerms} />
          <LegalModal type="privacy" open={showPrivacy} onOpenChange={setShowPrivacy} />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { loginAction /*, sendMagicLinkAction*/ } from '@/app/actions/auth'
import { LegalModal } from '@/components/legal/legal-modal'
import { logger } from '@/lib/logger'

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
  // const [magicLinkSent, setMagicLinkSent] = useState(false)

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
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
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

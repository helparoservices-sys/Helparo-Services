'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Eye, EyeOff, Mail, Loader2 } from 'lucide-react'
import { loginAction, sendMagicLinkAction } from '@/app/actions/auth'
import { logger } from '@/lib/logger'

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

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
      } else {
        // Login successful - refresh the page to ensure auth state is updated
        window.location.reload()
      }
      // If successful, loginAction handles the redirect after refresh
    } catch (err: any) {
      logger.error('Login error', { error: err })
      setError(err.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('email', formData.email)
      
      const result = await sendMagicLinkAction(formDataObj)
      
      if (result?.error) {
        setError(result.error)
      } else if ('success' in result && result.success) {
        setMagicLinkSent(true)
      }
    } catch (err: any) {
      logger.error('Magic link error', { error: err })
      setError(err.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 animate-fade-in relative overflow-hidden">
        {/* Logo Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="/logo.jpg" 
            alt="Helparo" 
            className="h-96 w-96 object-contain opacity-[0.03] dark:opacity-[0.02] animate-pulse"
          />
        </div>

        {/* Success Card */}
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                  <Mail className="h-8 w-8" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check Your Email</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We've sent a magic link to <strong className="text-slate-900 dark:text-white">{formData.email}</strong>
                </p>
              </div>

              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  Click the link in the email to sign in. The email is sent from <strong className="text-slate-900 dark:text-white">helparonotifications@gmail.com</strong>
                </p>
                <p className="text-xs">
                  Don't see it? Check your spam folder.
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300" 
                onClick={() => setMagicLinkSent(false)}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 animate-fade-in relative overflow-hidden">
      {/* Logo Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img 
          src="/logo.jpg" 
          alt="Helparo" 
          className="h-96 w-96 object-contain opacity-[0.03] dark:opacity-[0.02] animate-pulse"
        />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl p-8">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 group">
              <div className="relative">
                <img
                  src="/logo.jpg"
                  alt="Helparo"
                  className="h-12 w-12 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    img.style.display = 'none'
                    const fallback = document.getElementById('logo-fallback')
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div id="logo-fallback" style={{ display: 'none' }} className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg">
                  <Sparkles className="h-7 w-7" />
                </div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Helparo</span>
            </Link>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sign in to your account
            </p>
          </div>

          {/* Login Method Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              type="button"
              variant={loginMethod === 'password' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLoginMethod('password')}
              className={loginMethod === 'password' ? 'shadow-lg' : 'bg-white/50 dark:bg-slate-700/50'}
            >
              Password
            </Button>
            <Button
              type="button"
              variant={loginMethod === 'magic-link' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLoginMethod('magic-link')}
              className={loginMethod === 'magic-link' ? 'shadow-lg' : 'bg-white/50 dark:bg-slate-700/50'}
            >
              Magic Link
            </Button>
          </div>

          {/* Password Login Form */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">
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
                    className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
                className="w-full shadow-lg hover:shadow-xl transition-all duration-300" 
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

          {/* Magic Link Form */}
          {loginMethod === 'magic-link' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-magic" className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  id="email-magic"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full shadow-lg hover:shadow-xl transition-all duration-300" 
                size="lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  'Send Magic Link'
                )}
              </Button>
            </form>
          )}

          {/* Sign Up Link */}
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary font-medium hover:underline transition-colors">
              Sign Up
            </Link>
          </p>

          {/* Test Credentials - Development Only */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg backdrop-blur-sm">
              <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-2">🧪 Development Test Accounts</p>
              <div className="space-y-1 text-xs text-yellow-700 dark:text-yellow-400">
                <p><strong>Admin:</strong> admin@helparo.com / Admin@123</p>
                <p><strong>Helper:</strong> helper@helparo.com / Helper@123</p>
                <p><strong>Customer:</strong> customer@helparo.com / Customer@123</p>
              </div>
              <p className="text-[10px] text-yellow-600 dark:text-yellow-500 mt-2">These test accounts are hidden in production</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

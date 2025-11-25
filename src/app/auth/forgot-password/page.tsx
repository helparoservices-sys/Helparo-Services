'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Mail, Loader2, ArrowLeft } from 'lucide-react'
import { logger } from '@/lib/logger'
import { requestPasswordResetAction } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const fd = new FormData()
      fd.append('email', email)
      const result = await requestPasswordResetAction(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setMessage('If the email exists, we sent a reset link.')
      }
    } catch (err: any) {
      logger.error('Forgot password error', { error: err })
      setError('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Logo Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="/logo.jpg"
          alt="Helparo"
          className="h-96 w-96 object-contain opacity-[0.03] dark:opacity-[0.02]"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Forgot Password Card */}
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
                  loading="lazy"
                  decoding="async"
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

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enter your email to reset your password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
                {message}
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
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
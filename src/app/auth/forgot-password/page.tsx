'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Loader2, ArrowLeft, CheckCircle, Sparkles, X } from 'lucide-react'
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
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.1),transparent)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,0.06),transparent_70%)]" />
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-emerald-400/30 rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-teal-400/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/auth/login" className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold hidden sm:block">Back to login</span>
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
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-4 pt-20 relative z-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-3xl p-8 lg:p-10">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
              <Mail className="w-8 h-8 text-white" />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2">
                Forgot Password?
              </h1>
              <p className="text-gray-500">
                No worries! Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 pl-12 pr-4 border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-2xl text-base transition-all hover:border-gray-300"
                />
              </div>

              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  {error}
                </div>
              )}

              {message && (
                <div className="p-4 text-sm text-emerald-600 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <Sparkles className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <p className="text-center text-gray-600 mt-8">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
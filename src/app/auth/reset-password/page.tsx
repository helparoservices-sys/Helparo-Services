'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { updatePasswordAction } from '@/app/actions/auth'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Ensure Supabase processes the recovery token from URL hash
    // supabase client is configured with detectSessionInUrl, so nothing needed here.
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('password', password)
      const result = await updatePasswordAction(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/logo.jpg" alt="Helparo" width={384} height={384} className="opacity-[0.03] dark:opacity-[0.02] object-contain" />
        </div>
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl p-8 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg mx-auto">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Password Updated</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">You can now sign in with your new password.</p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Go to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Image src="/logo.jpg" alt="Helparo" width={384} height={384} className="opacity-[0.03] dark:opacity-[0.02] object-contain" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="relative">
                <Image src="/logo.jpg" alt="Helparo" width={48} height={48} className="rounded-xl object-cover shadow-lg" />
                <div id="reset-logo-fallback" style={{ display: 'none' }} className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg">
                  <Sparkles className="h-7 w-7" />
                </div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Helparo</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Your Password</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Enter a new password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-slate-700 dark:text-slate-300">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Updating...</>) : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ShieldCheck, Sparkles, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import Image from 'next/image'
import { updatePasswordAction } from '@/app/actions/auth'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenProcessed, setTokenProcessed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Password strength validation
  const passwordStrength = {
    hasLength: password.length >= 12,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password),
  }

  const passwordMatch = password === confirm && confirm !== ''

  useEffect(() => {
    // Process the recovery token from URL hash
    const processToken = async () => {
      const hash = window.location.hash
      if (!hash) {
        setError('No recovery token found. Please use the link from your email.')
        return
      }

      // Parse hash parameters
      const params = new URLSearchParams(hash.substring(1))
      const token_hash = params.get('token_hash')
      const type = params.get('type')

      if (!token_hash || type !== 'recovery') {
        setError('Invalid recovery link. Please request a new password reset.')
        return
      }

      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // Verify the recovery token and establish session
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery',
        })

        if (verifyError) {
          setError('Invalid or expired recovery link. Please request a new password reset.')
          console.error('Token verification error:', verifyError)
        } else {
          setTokenProcessed(true)
        }
      } catch (err) {
        setError('Failed to process recovery token. Please try again.')
        console.error('Token processing error:', err)
      }
    }

    processToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate password strength
    if (!Object.values(passwordStrength).every(Boolean)) {
      setError('Password does not meet all requirements')
      return
    }
    
    if (!passwordMatch) {
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
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={!tokenProcessed}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  disabled={!tokenProcessed}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Requirements */}
              {password && (
                <div className="space-y-1 text-xs mt-2">
                  <PasswordRequirement met={passwordStrength.hasLength} text="At least 12 characters" />
                  <PasswordRequirement met={passwordStrength.hasUpper} text="One uppercase letter" />
                  <PasswordRequirement met={passwordStrength.hasLower} text="One lowercase letter" />
                  <PasswordRequirement met={passwordStrength.hasNumber} text="One number" />
                  <PasswordRequirement met={passwordStrength.hasSpecial} text="One special character (!@#$%^&*)" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-slate-700 dark:text-slate-300">Confirm Password</Label>
              <div className="relative">
                <Input 
                  id="confirm" 
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm} 
                  onChange={(e) => setConfirm(e.target.value)} 
                  required 
                  disabled={!tokenProcessed}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  disabled={!tokenProcessed}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirm && (
                <div className="text-xs mt-1">
                  <PasswordRequirement met={passwordMatch} text="Passwords match" />
                </div>
              )}
            </div>
            
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !tokenProcessed}>
              {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Updating...</>) : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
      ) : (
        <XCircle className="h-3 w-3 text-slate-400 dark:text-slate-500" />
      )}
      <span className={met ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>{text}</span>
    </div>
  )
}

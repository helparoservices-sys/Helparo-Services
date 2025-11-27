'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (!token_hash || type !== 'email') {
          setStatus('error')
          setMessage('Invalid confirmation link. Please check your email and try again.')
          return
        }

        const supabase = createClient()
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        })

        if (error) {
          console.error('Email confirmation error:', error)
          setStatus('error')
          
          // Provide specific error messages
          if (error.message.includes('expired')) {
            setMessage('This confirmation link has expired. Please request a new confirmation email.')
          } else if (error.message.includes('already')) {
            setMessage('This email has already been verified. Please log in to continue.')
          } else {
            setMessage('Unable to verify your email. The link may be invalid or expired.')
          }
        } else {
          setStatus('success')
          setMessage('Your email has been successfully verified! You can now log in to access all features.')
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again or contact support.')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-primary/10">
              <img
                src="/logo.jpg"
                alt="Helparo"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-2xl font-bold">Helparo</span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg border p-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-primary-50 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Verifying Your Email
              </h1>
              <p className="text-gray-600">
                Please wait while we confirm your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Email Verified! 🎉
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href="/auth/login">
                    Continue to Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-sm text-gray-500">
                  Redirecting automatically in 3 seconds...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg" variant="outline">
                  <Link href="/auth/signup">
                    <Mail className="mr-2 h-4 w-4" />
                    Request New Confirmation Email
                  </Link>
                </Button>
                <Button asChild className="w-full" size="lg">
                  <Link href="/auth/login">
                    Try Logging In
                  </Link>
                </Button>
              </div>

              {/* Support Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Still having trouble?{' '}
                  <Link href="/support" className="text-primary font-medium hover:underline">
                    Contact Support
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 Helparo. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

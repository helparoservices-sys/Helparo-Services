'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function CompleteSignupPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [message, setMessage] = useState('Setting up your account...')

  useEffect(() => {
    const completeOAuthSignup = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          throw new Error('No authenticated user found')
        }

        // Get the pending role from localStorage (set before Google OAuth redirect)
        const pendingRole = localStorage.getItem('pendingSignupRole') || 'customer'
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (existingProfile) {
          // Profile exists - check if it needs role update (for new OAuth users)
          // Only update if this is a new OAuth signup (role might be default 'customer')
          if (!existingProfile.full_name && user.user_metadata?.full_name) {
            // Update with Google data
            await supabase
              .from('profiles')
              .update({
                full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                role: pendingRole,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              })
              .eq('id', user.id)
          } else if (pendingRole && pendingRole !== existingProfile.role) {
            // New OAuth signup - update the role
            await supabase
              .from('profiles')
              .update({ role: pendingRole })
              .eq('id', user.id)
          }
        } else {
          // Profile doesn't exist (trigger may not have fired) - create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              role: pendingRole,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            })

          if (insertError) {
            console.error('Profile insert error:', insertError)
            // Profile might already exist due to race condition, that's okay
          }
        }

        // Clear the pending role from localStorage
        localStorage.removeItem('pendingSignupRole')

        setStatus('success')
        setMessage('Account setup complete! Redirecting...')

        // Get final profile role for redirect
        const { data: finalProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const role = finalProfile?.role || pendingRole || 'customer'

        // Small delay to show success message
        setTimeout(() => {
          router.push(`/${role}/dashboard`)
        }, 1000)

      } catch (error) {
        console.error('Complete signup error:', error)
        setStatus('error')
        setMessage('Something went wrong. Please try logging in again.')
        
        // Redirect to login after error
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    }

    completeOAuthSignup()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-teal-50 p-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-2xl border-2 border-purple-100 shadow-2xl rounded-3xl p-8 text-center">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-8 group">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl p-0.5 group-hover:scale-110 transition-transform duration-300">
              <div className="h-full w-full bg-white rounded-2xl flex items-center justify-center p-2">
                <Image src="/logo.jpg" alt="Helparo" width={48} height={48} className="object-contain" />
              </div>
            </div>
            <span className="text-3xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Helparo</span>
          </Link>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === 'loading' && (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-teal-500 text-white shadow-2xl shadow-purple-500/50">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-2xl shadow-green-500/50 animate-bounce">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-2xl shadow-red-500/50">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Setting Up Your Account'}
            {status === 'success' && 'Welcome to Helparo!'}
            {status === 'error' && 'Oops!'}
          </h1>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  )
}

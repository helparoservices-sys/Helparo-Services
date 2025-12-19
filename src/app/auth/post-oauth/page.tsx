'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2 } from 'lucide-react'

export default function PostOAuthPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Setting up your account...')

  useEffect(() => {
    const setupAccount = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error('No user found:', userError)
          router.push('/auth/login')
          return
        }

        // Read role from localStorage (saved during signup)
        const pendingRole = localStorage.getItem('pendingSignupRole')
        
        // Only customers can use Google OAuth (helpers are blocked on signup page)
        // Default to customer if no role found
        const role = pendingRole === 'customer' ? 'customer' : 'customer'

        // Update profile with role
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', user.id)

        if (updateError) {
          console.error('Failed to update role:', updateError)
          // Still try to redirect
        }

        // Clear localStorage
        localStorage.removeItem('pendingSignupRole')
        localStorage.removeItem('roleSelected')

        // Redirect to customer dashboard
        setMessage('Welcome! Redirecting to your dashboard...')
        router.push('/customer/dashboard')
      } catch (err) {
        console.error('Setup error:', err)
        router.push('/customer/dashboard')
      }
    }

    setupAccount()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{message}</h2>
        <p className="text-gray-500">Please wait a moment...</p>
      </div>
    </div>
  )
}

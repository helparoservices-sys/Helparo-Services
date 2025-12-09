'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle, FileText } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function CompleteSignupPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [message, setMessage] = useState('Setting up your account...')
  const [step, setStep] = useState<'profile' | 'legal' | 'done'>('profile')

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
        
        // Step 1: Set up profile
        setStep('profile')
        setMessage('Setting up your profile...')

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role, full_name, phone')
          .eq('id', user.id)
          .maybeSingle()

        if (existingProfile) {
          // Profile exists - update with Google data if needed
          if (!existingProfile.full_name && user.user_metadata?.full_name) {
            await supabase
              .from('profiles')
              .update({
                full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                role: pendingRole,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              })
              .eq('id', user.id)
          } else if (pendingRole && pendingRole !== existingProfile.role) {
            await supabase
              .from('profiles')
              .update({ role: pendingRole })
              .eq('id', user.id)
          }
        } else {
          // Profile doesn't exist - create it
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
          }
        }

        // Step 2: Auto-accept legal terms (since user clicked "Continue with Google" after seeing terms notice)
        setStep('legal')
        setMessage('Accepting terms & conditions...')

        // Get latest legal document versions
        const { data: terms } = await supabase
          .from('legal_documents')
          .select('version')
          .eq('type', 'terms')
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { data: privacy } = await supabase
          .from('legal_documents')
          .select('version')
          .eq('type', 'privacy')
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Accept terms if exists
        if (terms?.version) {
          const { data: existingTerms } = await supabase
            .from('legal_acceptances')
            .select('id')
            .eq('user_id', user.id)
            .eq('document_type', 'terms')
            .eq('document_version', terms.version)
            .maybeSingle()

          if (!existingTerms) {
            await supabase
              .from('legal_acceptances')
              .insert({
                user_id: user.id,
                document_type: 'terms',
                document_version: terms.version,
              })
          }
        }

        // Accept privacy if exists
        if (privacy?.version) {
          const { data: existingPrivacy } = await supabase
            .from('legal_acceptances')
            .select('id')
            .eq('user_id', user.id)
            .eq('document_type', 'privacy')
            .eq('document_version', privacy.version)
            .maybeSingle()

          if (!existingPrivacy) {
            await supabase
              .from('legal_acceptances')
              .insert({
                user_id: user.id,
                document_type: 'privacy',
                document_version: privacy.version,
              })
          }
        }

        // Clear the pending role from localStorage
        localStorage.removeItem('pendingSignupRole')

        setStep('done')
        setStatus('success')
        setMessage('Account setup complete!')

        // Get final profile to check for phone
        const { data: finalProfile } = await supabase
          .from('profiles')
          .select('role, phone')
          .eq('id', user.id)
          .maybeSingle()

        const role = finalProfile?.role || pendingRole || 'customer'

        // Small delay to show success message
        setTimeout(() => {
          // If phone is missing, redirect to complete-profile page
          if (!finalProfile?.phone) {
            router.push('/auth/complete-profile')
          } else {
            router.push(`/${role}/dashboard`)
          }
        }, 1500)

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
                <CheckCircle className="h-10 w-10" />
              </div>
            )}
            {status === 'error' && (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-2xl shadow-red-500/50">
                <XCircle className="h-10 w-10" />
              </div>
            )}
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Setting Up Your Account'}
            {status === 'success' && 'Welcome to Helparo!'}
            {status === 'error' && 'Oops!'}
          </h1>
          <p className="text-gray-600 mb-6">{message}</p>

          {/* Progress Steps */}
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className={`flex items-center gap-1 ${step === 'profile' ? 'text-purple-600 font-semibold' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${step === 'profile' ? 'bg-purple-600 animate-pulse' : step === 'legal' || step === 'done' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                Profile
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className={`flex items-center gap-1 ${step === 'legal' ? 'text-purple-600 font-semibold' : step === 'done' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${step === 'legal' ? 'bg-purple-600 animate-pulse' : step === 'done' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                Legal
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className={`flex items-center gap-1 ${step === 'done' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${step === 'done' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                Done
              </div>
            </div>
          )}

          {/* Legal Notice for Google Users */}
          {status === 'loading' && step === 'legal' && (
            <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 text-purple-700 text-sm">
                <FileText className="h-4 w-4" />
                <span>By continuing, you agree to our Terms & Privacy Policy</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

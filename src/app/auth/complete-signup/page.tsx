'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle, FileText, Users, Wrench, Shield, X, Scale } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface LegalDoc {
  title: string
  content_md: string
  version: number
  type: string
}

export default function CompleteSignupPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'selectRole' | 'acceptTerms' | 'processing' | 'error' | 'success'>('loading')
  const [message, setMessage] = useState('Checking your account...')
  const [step, setStep] = useState<'profile' | 'legal' | 'done'>('profile')
  const [selectedRole, setSelectedRole] = useState<'customer' | 'helper' | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [pendingRoleForTerms, setPendingRoleForTerms] = useState<string | null>(null)
  
  // Legal document modal state
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')
  const [terms, setTerms] = useState<LegalDoc | null>(null)
  const [privacy, setPrivacy] = useState<LegalDoc | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => {
    const checkAndSetup = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          throw new Error('No authenticated user found')
        }

        // Get the pending role from localStorage (set before Google OAuth redirect on signup page)
        const pendingRole = localStorage.getItem('pendingSignupRole')
        
        // Check if user already completed role selection (flag set after explicit selection)
        const roleSelected = localStorage.getItem('roleSelected')

        // If pendingRole exists (from signup page) OR roleSelected flag is set, show terms
        if (pendingRole || roleSelected) {
          setPendingRoleForTerms(pendingRole || 'customer')
          setStatus('acceptTerms')
          setMessage('Please review and accept our terms')
        } else {
          // No pendingRole and no roleSelected flag = user came from Login page with Google
          // Show role selection UI
          setStatus('selectRole')
          setMessage('Please select how you want to use Helparo')
        }
      } catch (error) {
        console.error('Check error:', error)
        setStatus('error')
        setMessage('Something went wrong. Please try logging in again.')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    checkAndSetup()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRoleSelect = async (role: 'customer' | 'helper') => {
    setSelectedRole(role)
    // Set flag to indicate user explicitly selected a role
    localStorage.setItem('roleSelected', 'true')
    localStorage.setItem('pendingSignupRole', role)
    // Show terms acceptance UI instead of directly proceeding
    setPendingRoleForTerms(role)
    setStatus('acceptTerms')
    setMessage('Please review and accept our terms')
  }

  // Load legal documents when opening modal
  const openLegalModal = async (tab: 'terms' | 'privacy') => {
    setActiveTab(tab)
    setShowLegalModal(true)
    
    // Only load if not already loaded
    if (!terms || !privacy) {
      setLoadingDocs(true)
      try {
        const { data: termsData } = await supabase
          .from('legal_documents')
          .select('title, content_md, version, type')
          .eq('type', 'terms')
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { data: privacyData } = await supabase
          .from('legal_documents')
          .select('title, content_md, version, type')
          .eq('type', 'privacy')
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        setTerms(termsData)
        setPrivacy(privacyData)
      } catch (err) {
        console.error('Error loading legal docs:', err)
      }
      setLoadingDocs(false)
    }
  }

  const handleTermsAccepted = async () => {
    if (!termsAccepted || !privacyAccepted) return
    await completeOAuthSignup(pendingRoleForTerms || 'customer')
  }

  const completeOAuthSignup = async (role: string) => {
    setStatus('processing')
    setMessage('Setting up your account...')
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('No authenticated user found')
      }

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
        // Profile exists - update with Google data and role
        await supabase
          .from('profiles')
          .update({
            full_name: existingProfile.full_name || user.user_metadata?.full_name || user.user_metadata?.name,
            role: role,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          })
          .eq('id', user.id)
      } else {
        // Profile doesn't exist - create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            role: role,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          })

        if (insertError) {
          console.error('Profile insert error:', insertError)
        }
      }

      // Step 2: Auto-accept legal terms
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

      // Clear the pending role and roleSelected flag from localStorage
      localStorage.removeItem('pendingSignupRole')
      localStorage.removeItem('roleSelected')

      setStep('done')
      setStatus('success')
      setMessage('Account setup complete!')

      // Get final profile to check for phone
      const { data: finalProfile } = await supabase
        .from('profiles')
        .select('role, phone, phone_verified')
        .eq('id', user.id)
        .maybeSingle()

      const finalRole = finalProfile?.role || role

      // Small delay to show success message
      setTimeout(() => {
        // If phone is missing or not verified, redirect to complete-profile page
        if (!finalProfile?.phone || !finalProfile?.phone_verified) {
          router.push('/auth/complete-profile')
        } else {
          router.push(`/${finalRole}/dashboard`)
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

          {/* Role Selection */}
          {status === 'selectRole' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Helparo!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => handleRoleSelect('customer')}
                  disabled={selectedRole !== null}
                  className={`w-full py-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${
                    selectedRole === 'customer' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                  variant="outline"
                >
                  <Users className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-bold">I need help</div>
                    <div className="text-xs opacity-70">Find helpers for your tasks</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleRoleSelect('helper')}
                  disabled={selectedRole !== null}
                  className={`w-full py-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${
                    selectedRole === 'helper' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-teal-400 hover:bg-teal-50'
                  }`}
                  variant="outline"
                >
                  <Wrench className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-bold">I want to help</div>
                    <div className="text-xs opacity-70">Offer your services & earn</div>
                  </div>
                </Button>
              </div>
            </>
          )}

          {/* Terms Acceptance */}
          {status === 'acceptTerms' && (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">Almost There!</h1>
              </div>
              <p className="text-gray-600 mb-6">Please review and accept our terms to continue</p>
              
              <div className="space-y-3 text-left">
                {/* Terms Button */}
                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  termsAccepted 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-purple-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-gray-700">I agree to the </span>
                        <span className="text-purple-600 font-semibold">Terms of Service</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLegalModal('terms')}
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      <FileText className="h-4 w-4" />
                      Read
                    </button>
                  </div>
                </div>

                {/* Privacy Button */}
                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  privacyAccepted 
                    ? 'border-teal-500 bg-teal-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-teal-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <span className="text-gray-700">I agree to the </span>
                        <span className="text-teal-600 font-semibold">Privacy Policy</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLegalModal('privacy')}
                      className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 font-medium"
                    >
                      <Shield className="h-4 w-4" />
                      Read
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleTermsAccepted}
                disabled={!termsAccepted || !privacyAccepted}
                className="w-full mt-6 py-6 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold text-lg hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Accept & Continue
              </Button>

              <button
                onClick={() => {
                  setStatus('selectRole')
                  setTermsAccepted(false)
                  setPrivacyAccepted(false)
                  setSelectedRole(null)
                }}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700"
              >
                ← Go back to role selection
              </button>
            </>
          )}

          {/* Loading/Processing Status */}
          {(status === 'loading' || status === 'processing') && (
            <>
              <div className="flex justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-teal-500 text-white shadow-2xl shadow-purple-500/50">
                  <Loader2 className="h-10 w-10 animate-spin" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Setting Up Your Account</h1>
              <p className="text-gray-600 mb-6">{message}</p>

              {/* Progress Steps */}
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

              {/* Legal Notice */}
              {step === 'legal' && (
                <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 text-purple-700 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>By continuing, you agree to our Terms & Privacy Policy</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Success Status */}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-2xl shadow-green-500/50 animate-bounce">
                  <CheckCircle className="h-10 w-10" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Helparo!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
            </>
          )}

          {/* Error Status */}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-2xl shadow-red-500/50">
                  <XCircle className="h-10 w-10" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
            </>
          )}
        </div>
      </div>

      {/* Legal Document Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-teal-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6" />
                <h2 className="text-xl font-bold">Legal Agreement</h2>
              </div>
              <button
                onClick={() => setShowLegalModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b bg-gray-50">
              <button
                onClick={() => setActiveTab('terms')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'terms'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                Terms & Conditions
                {termsAccepted && <CheckCircle className="h-4 w-4 text-green-300" />}
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Shield className="h-4 w-4" />
                Privacy Policy
                {privacyAccepted && <CheckCircle className="h-4 w-4 text-green-300" />}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  {activeTab === 'terms' && terms && (
                    <div className="prose prose-slate max-w-none">
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <h3 className="text-xl font-bold text-gray-900 m-0">{terms.title}</h3>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">v{terms.version}</span>
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {terms.content_md}
                      </ReactMarkdown>
                    </div>
                  )}
                  {activeTab === 'privacy' && privacy && (
                    <div className="prose prose-slate max-w-none">
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                        <Shield className="h-5 w-5 text-teal-600" />
                        <h3 className="text-xl font-bold text-gray-900 m-0">{privacy.title}</h3>
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">v{privacy.version}</span>
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {privacy.content_md}
                      </ReactMarkdown>
                    </div>
                  )}
                  {!terms && !privacy && (
                    <p className="text-gray-500 text-center py-8">No legal documents available.</p>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeTab === 'terms' ? termsAccepted : privacyAccepted}
                  onChange={(e) => {
                    if (activeTab === 'terms') {
                      setTermsAccepted(e.target.checked)
                    } else {
                      setPrivacyAccepted(e.target.checked)
                    }
                  }}
                  className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  I have read and agree to the {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </span>
              </label>
              <Button
                onClick={() => setShowLegalModal(false)}
                className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

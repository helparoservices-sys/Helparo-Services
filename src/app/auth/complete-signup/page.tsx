'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, CheckCircle, FileText, Users, Briefcase, Shield, X, ArrowRight, Sparkles, Star, Clock, BadgeCheck } from 'lucide-react'
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
  const [hoveredRole, setHoveredRole] = useState<'customer' | 'helper' | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [pendingRoleForTerms, setPendingRoleForTerms] = useState<string | null>(null)
  
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')
  const [terms, setTerms] = useState<LegalDoc | null>(null)
  const [privacy, setPrivacy] = useState<LegalDoc | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => {
    const checkAndSetup = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('No authenticated user found')

        const pendingRole = localStorage.getItem('pendingSignupRole')
        const roleSelected = localStorage.getItem('roleSelected')

        if (pendingRole || roleSelected) {
          setPendingRoleForTerms(pendingRole || 'customer')
          setStatus('acceptTerms')
        } else {
          setStatus('selectRole')
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
    localStorage.setItem('roleSelected', 'true')
    localStorage.setItem('pendingSignupRole', role)
    setPendingRoleForTerms(role)
    setStatus('acceptTerms')
  }

  const openLegalModal = async (tab: 'terms' | 'privacy') => {
    setActiveTab(tab)
    setShowLegalModal(true)
    if (!terms || !privacy) {
      setLoadingDocs(true)
      try {
        const { data: termsData } = await supabase.from('legal_documents').select('title, content_md, version, type').eq('type', 'terms').eq('is_active', true).order('version', { ascending: false }).limit(1).maybeSingle()
        const { data: privacyData } = await supabase.from('legal_documents').select('title, content_md, version, type').eq('type', 'privacy').eq('is_active', true).order('version', { ascending: false }).limit(1).maybeSingle()
        setTerms(termsData)
        setPrivacy(privacyData)
      } catch (err) { console.error('Error loading legal docs:', err) }
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
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('No authenticated user found')

      setStep('profile')
      const { data: existingProfile } = await supabase.from('profiles').select('id, role, full_name, phone').eq('id', user.id).maybeSingle()

      if (existingProfile) {
        await supabase.from('profiles').update({ full_name: existingProfile.full_name || user.user_metadata?.full_name || user.user_metadata?.name, role: role, avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture }).eq('id', user.id)
      } else {
        await supabase.from('profiles').insert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name || user.user_metadata?.name, role: role, avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture })
      }

      setStep('legal')
      const { data: termsDoc } = await supabase.from('legal_documents').select('version').eq('type', 'terms').eq('is_active', true).order('version', { ascending: false }).limit(1).maybeSingle()
      const { data: privacyDoc } = await supabase.from('legal_documents').select('version').eq('type', 'privacy').eq('is_active', true).order('version', { ascending: false }).limit(1).maybeSingle()

      if (termsDoc?.version) {
        const { data: existing } = await supabase.from('legal_acceptances').select('id').eq('user_id', user.id).eq('document_type', 'terms').eq('document_version', termsDoc.version).maybeSingle()
        if (!existing) await supabase.from('legal_acceptances').insert({ user_id: user.id, document_type: 'terms', document_version: termsDoc.version })
      }
      if (privacyDoc?.version) {
        const { data: existing } = await supabase.from('legal_acceptances').select('id').eq('user_id', user.id).eq('document_type', 'privacy').eq('document_version', privacyDoc.version).maybeSingle()
        if (!existing) await supabase.from('legal_acceptances').insert({ user_id: user.id, document_type: 'privacy', document_version: privacyDoc.version })
      }

      localStorage.removeItem('pendingSignupRole')
      localStorage.removeItem('roleSelected')
      setStep('done')
      setStatus('success')
      setMessage('Account setup complete!')

      const { data: finalProfile } = await supabase.from('profiles').select('role, phone, phone_verified').eq('id', user.id).maybeSingle()
      const finalRole = finalProfile?.role || role

      setTimeout(() => {
        if (!finalProfile?.phone || !finalProfile?.phone_verified) router.push('/auth/complete-profile')
        else router.push(`/${finalRole}/dashboard`)
      }, 1500)
    } catch (error) {
      console.error('Complete signup error:', error)
      setStatus('error')
      setMessage('Something went wrong. Please try logging in again.')
      setTimeout(() => router.push('/auth/login'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <span className="text-3xl font-bold text-white">Helparo</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            One step away from<br /><span className="text-emerald-200">amazing services</span>
          </h1>
          <p className="text-xl text-emerald-100 mb-12 max-w-md">Join thousands of users who trust Helparo for reliable, verified home services.</p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><BadgeCheck className="w-6 h-6 text-white" /></div>
              <div><p className="text-white font-semibold">Verified Professionals</p><p className="text-emerald-200 text-sm">Background checked & ID verified</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Clock className="w-6 h-6 text-white" /></div>
              <div><p className="text-white font-semibold">Quick Response</p><p className="text-emerald-200 text-sm">Get help within 30 minutes</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div>
              <div><p className="text-white font-semibold">100% Secure</p><p className="text-emerald-200 text-sm">Your data is always protected</p></div>
            </div>
          </div>

          <div className="mt-16 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1,2,3,4].map((i) => (<div key={i} className="w-10 h-10 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center text-white text-sm font-bold">{String.fromCharCode(64+i)}</div>))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-yellow-300">{[1,2,3,4,5].map((i) => (<Star key={i} className="w-4 h-4 fill-current" />))}</div>
              <p className="text-emerald-100 text-sm">Loved by 50,000+ users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><span className="text-white font-bold text-xl">H</span></div>
              <span className="text-2xl font-bold text-gray-900">Helparo</span>
            </Link>
          </div>

          {/* Role Selection */}
          {status === 'selectRole' && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mb-4"><Sparkles className="w-4 h-4" />Almost there!</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Helparo!</h1>
                <p className="text-gray-500">How would you like to use our platform?</p>
              </div>

              <div className="space-y-4">
                <button onClick={() => handleRoleSelect('customer')} onMouseEnter={() => setHoveredRole('customer')} onMouseLeave={() => setHoveredRole(null)} className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${hoveredRole === 'customer' ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-gray-200 bg-white hover:border-emerald-300'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${hoveredRole === 'customer' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}><Users className="w-7 h-7" /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">I need help</h3>
                        <ArrowRight className={`w-5 h-5 transition-all duration-300 ${hoveredRole === 'customer' ? 'text-emerald-500 translate-x-1' : 'text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1'}`} />
                      </div>
                      <p className="text-gray-500 text-sm mt-1">Find verified professionals for your home services</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Instant booking</span>
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Verified helpers</span>
                      </div>
                    </div>
                  </div>
                </button>

                <button onClick={() => handleRoleSelect('helper')} onMouseEnter={() => setHoveredRole('helper')} onMouseLeave={() => setHoveredRole(null)} className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${hoveredRole === 'helper' ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${hoveredRole === 'helper' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white'}`}><Briefcase className="w-7 h-7" /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">I want to help</h3>
                        <ArrowRight className={`w-5 h-5 transition-all duration-300 ${hoveredRole === 'helper' ? 'text-blue-500 translate-x-1' : 'text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1'}`} />
                      </div>
                      <p className="text-gray-500 text-sm mt-1">Offer your services and earn money</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-blue-500" />Flexible hours</span>
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-blue-500" />Great earnings</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">You can always change your role later in settings</p>
            </div>
          )}

          {/* Terms Acceptance */}
          {status === 'acceptTerms' && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mb-4"><Shield className="w-4 h-4" />One last step</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Our Terms</h1>
                <p className="text-gray-500">Please accept to continue</p>
              </div>

              <div className="space-y-4">
                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${termsAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${termsAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>{termsAccepted && <CheckCircle className="w-4 h-4 text-white" />}</div>
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="sr-only" />
                  <div className="flex-1"><p className="font-medium text-gray-900">Terms of Service</p><p className="text-sm text-gray-500">I agree to the terms and conditions</p></div>
                  <button type="button" onClick={(e) => { e.preventDefault(); openLegalModal('terms'); }} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"><FileText className="w-4 h-4" />Read</button>
                </label>

                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${privacyAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${privacyAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>{privacyAccepted && <CheckCircle className="w-4 h-4 text-white" />}</div>
                  <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="sr-only" />
                  <div className="flex-1"><p className="font-medium text-gray-900">Privacy Policy</p><p className="text-sm text-gray-500">I agree to the privacy policy</p></div>
                  <button type="button" onClick={(e) => { e.preventDefault(); openLegalModal('privacy'); }} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"><Shield className="w-4 h-4" />Read</button>
                </label>
              </div>

              <Button onClick={handleTermsAccepted} disabled={!termsAccepted || !privacyAccepted} className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-lg shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all duration-300">Continue<ArrowRight className="ml-2 w-5 h-5" /></Button>
              <button onClick={() => { setStatus('selectRole'); setTermsAccepted(false); setPrivacyAccepted(false); setSelectedRole(null); }} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors">← Back to role selection</button>
            </div>
          )}

          {/* Loading */}
          {(status === 'loading' || status === 'processing') && (
            <div className="text-center space-y-6">
              <div className="relative inline-flex">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200"><Loader2 className="w-10 h-10 text-white animate-spin" /></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 animate-ping opacity-20" />
              </div>
              <div><h2 className="text-2xl font-bold text-gray-900 mb-2">Setting Up Your Account</h2><p className="text-gray-500">{message}</p></div>
              <div className="flex items-center justify-center gap-3 pt-4">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${step === 'profile' || step === 'legal' || step === 'done' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <div className={`w-8 h-0.5 transition-all duration-300 ${step === 'legal' || step === 'done' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${step === 'legal' || step === 'done' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <div className={`w-8 h-0.5 transition-all duration-300 ${step === 'done' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${step === 'done' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200"><CheckCircle className="w-10 h-10 text-white" /></div>
              <div><h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h2><p className="text-gray-500">Redirecting you to the next step...</p></div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center"><X className="w-10 h-10 text-red-500" /></div>
              <div><h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2><p className="text-gray-500">{message}</p></div>
            </div>
          )}
        </div>
      </div>

      {/* Legal Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('terms')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'terms' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'}`}>Terms of Service</button>
                <button onClick={() => setActiveTab('privacy')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'privacy' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'}`}>Privacy Policy</button>
              </div>
              <button onClick={() => setShowLegalModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {loadingDocs ? (<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>) : (
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeTab === 'terms' ? (terms?.content_md || 'Terms of Service content not available.') : (privacy?.content_md || 'Privacy Policy content not available.')}</ReactMarkdown>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50">
              <Button onClick={() => setShowLegalModal(false)} className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium">I understand</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

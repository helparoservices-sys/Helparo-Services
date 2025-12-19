'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, FileText, Shield, Scale } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface LegalDoc {
  title: string
  content_md: string
  version: number
  type: string
}

type LegalAudience = 'all' | 'customer' | 'helper'

export default function ConsentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [terms, setTerms] = useState<LegalDoc | null>(null)
  const [privacy, setPrivacy] = useState<LegalDoc | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [role, setRole] = useState('customer')
  const [hasPhone, setHasPhone] = useState(false)
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        setUser(user)

        // Get user's role and phone
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, phone, phone_verified')
          .eq('id', user.id)
          .maybeSingle()

        setRole(profile?.role || 'customer')
        setHasPhone(!!(profile?.phone && profile?.phone_verified))

        const audience: LegalAudience = (profile?.role === 'helper' ? 'helper' : 'customer')

        // Fetch latest legal documents
        const fetchLatestDoc = async (type: 'terms' | 'privacy') => {
          // Role-specific first (new schema)
          const primary = await supabase
            .from('legal_documents')
            .select('title, content_md, version, type')
            .eq('type', type)
            .eq('audience', audience)
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!primary.error && primary.data) return primary.data

          // Fallback to 'all' (new schema)
          const fallback = await supabase
            .from('legal_documents')
            .select('title, content_md, version, type')
            .eq('type', type)
            .eq('audience', 'all')
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!fallback.error) return fallback.data

          // Legacy schema fallback (no `audience` column)
          const legacy = await supabase
            .from('legal_documents')
            .select('title, content_md, version, type')
            .eq('type', type)
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()
          return legacy.data
        }

        const termsData = await fetchLatestDoc('terms')
        const privacyData = await fetchLatestDoc('privacy')

        setTerms(termsData)
        setPrivacy(privacyData)

        // Check if user already accepted
        if (termsData?.version) {
          const attempt = await supabase
            .from('legal_acceptances')
            .select('id')
            .eq('user_id', user.id)
            .eq('document_type', 'terms')
            .eq('document_audience', audience)
            .eq('document_version', termsData.version)
            .maybeSingle()

          if (!attempt.error && attempt.data) setTermsAccepted(true)

          if (attempt.error) {
            // Legacy schema fallback (no `document_audience` column)
            const legacy = await supabase
              .from('legal_acceptances')
              .select('id')
              .eq('user_id', user.id)
              .eq('document_type', 'terms')
              .eq('document_version', termsData.version)
              .maybeSingle()
            if (legacy.data) setTermsAccepted(true)
          }
        }

        if (privacyData?.version) {
          const attempt = await supabase
            .from('legal_acceptances')
            .select('id')
            .eq('user_id', user.id)
            .eq('document_type', 'privacy')
            .eq('document_audience', audience)
            .eq('document_version', privacyData.version)
            .maybeSingle()

          if (!attempt.error && attempt.data) setPrivacyAccepted(true)

          if (attempt.error) {
            const legacy = await supabase
              .from('legal_acceptances')
              .select('id')
              .eq('user_id', user.id)
              .eq('document_type', 'privacy')
              .eq('document_version', privacyData.version)
              .maybeSingle()
            if (legacy.data) setPrivacyAccepted(true)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading data:', err)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // If already accepted both, redirect (check phone first)
  useEffect(() => {
    if (!loading && termsAccepted && privacyAccepted) {
      if (!hasPhone) {
        router.push('/auth/complete-signup')
      } else {
        router.push(`/${role}/dashboard`)
      }
    }
  }, [loading, termsAccepted, privacyAccepted, role, hasPhone, router])

  const handleAccept = async () => {
    if (!user) return
    
    setAccepting(true)
    setError('')

    try {
      const audience: LegalAudience = role === 'helper' ? 'helper' : 'customer'

      // Accept terms
      if (terms?.version && !termsAccepted) {
        const attempt = await supabase
          .from('legal_acceptances')
          .insert({
            user_id: user.id,
            document_type: 'terms',
            document_audience: audience,
            document_version: terms.version,
          })

        if (attempt.error) {
          // Legacy schema fallback (no `document_audience` column)
          const legacy = await supabase
            .from('legal_acceptances')
            .insert({
              user_id: user.id,
              document_type: 'terms',
              document_version: terms.version,
            })

          const err = legacy.error ?? attempt.error
          if (err && !err.message.includes('duplicate')) {
            throw err
          }
        }
      }

      // Accept privacy
      if (privacy?.version && !privacyAccepted) {
        const attempt = await supabase
          .from('legal_acceptances')
          .insert({
            user_id: user.id,
            document_type: 'privacy',
            document_audience: audience,
            document_version: privacy.version,
          })

        if (attempt.error) {
          const legacy = await supabase
            .from('legal_acceptances')
            .insert({
              user_id: user.id,
              document_type: 'privacy',
              document_version: privacy.version,
            })

          const err = legacy.error ?? attempt.error
          if (err && !err.message.includes('duplicate')) {
            throw err
          }
        }
      }

      // Check if phone is missing - redirect to complete profile
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('phone, phone_verified')
        .eq('id', user.id)
        .maybeSingle()

      if (!updatedProfile?.phone || !updatedProfile?.phone_verified) {
        router.push('/auth/complete-signup')
      } else {
        router.push(`/${role}/dashboard`)
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      console.error('Error accepting:', err)
      setError(error?.message || 'Failed to accept. Please try again.')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-gray-400 text-sm">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-900/95 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.svg" 
                alt="Helparo" 
                width={36} 
                height={36} 
                className="rounded-lg"
                priority
              />
              <h2 className="text-lg font-bold text-white">Helparo</h2>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 py-10 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">Legal Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Review & Accept Legal Documents</h1>
          <p className="text-white/80 text-sm sm:text-base">Please review and accept to continue using Helparo</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tabs */}
        <div className="bg-gray-800/50 p-1.5 rounded-2xl flex gap-1.5 mb-6 border border-gray-700/50">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'terms'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Terms & Conditions</span>
            {termsAccepted && <CheckCircle className="h-4 w-4 text-emerald-300" />}
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'privacy'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Privacy Policy</span>
            {privacyAccepted && <CheckCircle className="h-4 w-4 text-emerald-300" />}
          </button>
        </div>

        {/* Document Content */}
        <div className="bg-gray-800/40 rounded-2xl border border-gray-700/50 mb-6 overflow-hidden">
          <div className="max-h-[55vh] overflow-y-auto p-5 sm:p-6">
            {activeTab === 'terms' && terms && (
              <div>
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-700/50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">{terms.title}</h2>
                    <span className="text-xs text-emerald-400 font-medium">Version {terms.version}</span>
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none 
                  prose-headings:text-white prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                  prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                  prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-white prose-strong:font-semibold
                  prose-ul:text-gray-300 prose-ol:text-gray-300
                  prose-li:my-1.5 prose-li:marker:text-emerald-400
                  prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {terms.content_md}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {activeTab === 'privacy' && privacy && (
              <div>
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-700/50">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">{privacy.title}</h2>
                    <span className="text-xs text-cyan-400 font-medium">Version {privacy.version}</span>
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none 
                  prose-headings:text-white prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                  prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                  prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-white prose-strong:font-semibold
                  prose-ul:text-gray-300 prose-ol:text-gray-300
                  prose-li:my-1.5 prose-li:marker:text-cyan-400
                  prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {privacy.content_md}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {!terms && !privacy && (
              <p className="text-gray-400 text-center py-12">No legal documents available.</p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Accept Section */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-2xl border border-gray-700/50 p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="mt-0.5">
              <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              I have read and agree to the <strong className="text-white">Terms & Conditions</strong> and{' '}
              <strong className="text-white">Privacy Policy</strong>. I understand that by clicking 
              &quot;Accept &amp; Continue&quot;, I am entering into a legally binding agreement with Helparo Services.
            </p>
          </div>

          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold text-base py-4 rounded-xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 border-0"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Accept & Continue
              </>
            )}
          </Button>

          <p className="text-center text-xs text-gray-500 mt-4">
            You can review these documents anytime from your account settings.
          </p>
        </div>
      </div>
    </div>
  )
}

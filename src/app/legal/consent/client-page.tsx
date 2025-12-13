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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.svg" 
                alt="Helparo" 
                width={40} 
                height={40} 
                className="rounded-lg shadow-md"
                priority
              />
              <div>
                <h2 className="text-xl font-bold text-emerald-700">Helparo</h2>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm uppercase tracking-wider text-white/80 font-medium">Legal Agreement</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Review & Accept Legal Documents</h1>
          <p className="text-white/90">Please review and accept to continue using Helparo</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'terms'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
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
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Shield className="h-4 w-4" />
            Privacy Policy
            {privacyAccepted && <CheckCircle className="h-4 w-4 text-green-300" />}
          </button>
        </div>

        {/* Document Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 md:p-8 mb-6 max-h-[50vh] overflow-y-auto">
          {activeTab === 'terms' && terms && (
            <div className="prose prose-slate max-w-none">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900 m-0">{terms.title}</h2>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">v{terms.version}</span>
              </div>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {terms.content_md}
              </ReactMarkdown>
            </div>
          )}
          {activeTab === 'privacy' && privacy && (
            <div className="prose prose-slate max-w-none">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <Shield className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900 m-0">{privacy.title}</h2>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">v{privacy.version}</span>
              </div>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {privacy.content_md}
              </ReactMarkdown>
            </div>
          )}
          {!terms && !privacy && (
            <p className="text-gray-500 text-center py-8">No legal documents available.</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Accept Section */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6">
          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              id="acceptAll"
              checked={true}
              readOnly
              className="mt-1 h-5 w-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="acceptAll" className="text-sm text-gray-700">
              I have read and agree to the <strong>Terms & Conditions</strong> and <strong>Privacy Policy</strong>. 
              I understand that by clicking &quot;Accept &amp; Continue&quot;, I am entering into a legally binding agreement with Helparo Services.
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold text-lg py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
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

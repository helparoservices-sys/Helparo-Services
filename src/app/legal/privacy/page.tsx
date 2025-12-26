// Static generate with periodic revalidation for faster first load
export const revalidate = 3600 // 1 hour
export const dynamic = 'force-static'

import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Scale, Home, ArrowLeft, FileText, Calendar, Shield, Users, Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Helparo',
  description: 'Learn how Helparo protects your privacy and handles your personal data for both customers and helpers.',
  robots: 'index, follow',
}

type LegalDocRow = { title: string; content_md: string; version: number | string; updated_at?: string }

const getCustomerPrivacy = unstable_cache(
  async (): Promise<LegalDocRow | null> => {
    const supabase = await createClient()
    const result = await supabase
      .from('legal_documents')
      .select('title, content_md, version, updated_at')
      .eq('type', 'privacy')
      .eq('audience', 'customer')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (result.error) return null
    return result.data as unknown as LegalDocRow
  },
  ['legal-privacy-customer-combined'],
  { tags: ['legal-docs'], revalidate: 3600 }
)

const getHelperPrivacy = unstable_cache(
  async (): Promise<LegalDocRow | null> => {
    const supabase = await createClient()
    const result = await supabase
      .from('legal_documents')
      .select('title, content_md, version, updated_at')
      .eq('type', 'privacy')
      .eq('audience', 'helper')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (result.error) return null
    return result.data as unknown as LegalDocRow
  },
  ['legal-privacy-helper-combined'],
  { tags: ['legal-docs'], revalidate: 3600 }
)

export default async function PrivacyPage() {
  const [customerDoc, helperDoc] = await Promise.all([
    getCustomerPrivacy(),
    getHelperPrivacy(),
  ])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-teal-950 dark:to-emerald-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.svg" 
                alt="Helparo" 
                width={40} 
                height={40} 
                className="rounded-lg shadow-md"
                priority
                quality={90}
              />
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Helparo</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Services Platform</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link 
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm uppercase tracking-wider text-white/80 font-medium">Legal Document</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-white/90 max-w-2xl mb-4">
            Learn how Helparo protects your privacy and handles your personal data. This page contains privacy policies for both Customers and Helpers.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <Shield className="h-4 w-4" />
              Legally Binding
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <Users className="h-4 w-4" />
              For Customers & Helpers
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Jump to:</span>
            <div className="flex flex-wrap items-center gap-3">
              <a 
                href="#customer-privacy" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <Users className="h-4 w-4" />
                Customer Privacy Policy
              </a>
              <a 
                href="#helper-privacy" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Briefcase className="h-4 w-4" />
                Helper Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
        
        {/* Customer Privacy Policy Section */}
        <section id="customer-privacy" className="scroll-mt-24">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{customerDoc?.title ?? 'Customer Privacy Policy'}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 mt-1">
                    {customerDoc?.version && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Version {String(customerDoc.version)}
                      </span>
                    )}
                    {formatDate(customerDoc?.updated_at) && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Updated: {formatDate(customerDoc?.updated_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section Content */}
            <div className="p-6 md:p-10">
              <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-700 prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-white prose-a:text-emerald-700 dark:prose-a:text-emerald-300">
                {customerDoc?.content_md ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {customerDoc.content_md}
                  </ReactMarkdown>
                ) : (
                  <p className="text-slate-500 italic">No customer privacy policy available.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4 py-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Additional Policy</span>
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
        </div>

        {/* Helper Privacy Policy Section */}
        <section id="helper-privacy" className="scroll-mt-24">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{helperDoc?.title ?? 'Helper Privacy Policy'}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 mt-1">
                    {helperDoc?.version && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Version {String(helperDoc.version)}
                      </span>
                    )}
                    {formatDate(helperDoc?.updated_at) && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Updated: {formatDate(helperDoc?.updated_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section Content */}
            <div className="p-6 md:p-10">
              <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-700 prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-white prose-a:text-emerald-700 dark:prose-a:text-emerald-300">
                {helperDoc?.content_md ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {helperDoc.content_md}
                  </ReactMarkdown>
                ) : (
                  <p className="text-slate-500 italic">No helper privacy policy available.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.svg" 
                alt="Helparo" 
                width={36} 
                height={36} 
                className="rounded-lg shadow-md"
                loading="lazy"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Helparo Services</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your trusted service platform</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <Link href="/legal/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Terms
              </Link>
              <Link href="/legal/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Privacy
              </Link>
              <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Home
              </Link>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              © {currentYear} Helparo. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

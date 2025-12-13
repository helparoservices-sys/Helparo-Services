// Static generate with periodic revalidation for faster first load
export const revalidate = 3600 // 1 hour
export const dynamic = 'force-static'

import { createClient } from '@/lib/supabase/server'
import LegalDoc from '@/components/legal/legal-doc'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Customer Terms & Conditions | Helparo',
  description: 'Terms and conditions for customers using Helparo.',
  robots: 'index, follow',
}

type LegalDocRow = { title: string; content_md: string; version: number | string; updated_at?: string }

const getLatestCustomerTerms = unstable_cache(
  async (): Promise<LegalDocRow | null> => {
    const supabase = await createClient()

    const fetchLegacy = async (): Promise<LegalDocRow | null> => {
      const legacy = await supabase
        .from('legal_documents')
        .select('title, content_md, version, updated_at')
        .eq('type', 'terms')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (legacy.error) return null
      return legacy.data ? (legacy.data as unknown as LegalDocRow) : null
    }

    // Role-specific first
    const primary = await supabase
      .from('legal_documents')
      .select('title, content_md, version, updated_at')
      .eq('type', 'terms')
      .eq('audience', 'customer')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (primary.error) {
      // Backward compatible: DB may not have `audience` column yet.
      const legacy = await fetchLegacy()
      if (legacy) return legacy
      throw primary.error
    }
    if (primary.data) return primary.data as unknown as LegalDocRow

    // Fallback to all
    const fallback = await supabase
      .from('legal_documents')
      .select('title, content_md, version, updated_at')
      .eq('type', 'terms')
      .eq('audience', 'all')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fallback.error) {
      const legacy = await fetchLegacy()
      if (legacy) return legacy
      throw fallback.error
    }
    return (fallback.data ? (fallback.data as unknown as LegalDocRow) : null)
  },
  ['legal-terms-customer'],
  { tags: ['legal-docs'], revalidate: 3600 }
)

export default async function CustomerTermsPage() {
  const doc = await getLatestCustomerTerms()

  return (
    <LegalDoc
      title={doc?.title ?? 'Customer Terms & Conditions'}
      contentMd={doc?.content_md ?? 'No terms available.'}
      version={doc?.version}
      updatedAt={doc?.updated_at}
      backHref="/auth/login"
    />
  )
}

// Static generate with periodic revalidation for faster first load
export const revalidate = 3600 // 1 hour
export const dynamic = 'force-static'

import { createClient } from '@/lib/supabase/server'
import LegalDoc from '@/components/legal/legal-doc'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Helper Terms & Conditions | Helparo',
  description: 'Terms and conditions for helpers using Helparo.',
  robots: 'index, follow',
}

type LegalDocRow = { title: string; content_md: string; version: number | string; updated_at?: string }

const getLatestHelperTerms = unstable_cache(
  async (): Promise<LegalDocRow | null> => {
    const supabase = await createClient()

    const primary = await supabase
      .from('legal_documents')
      .select('title, content_md, version, updated_at')
      .eq('type', 'terms')
      .eq('audience', 'helper')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (primary.error) throw primary.error
    if (primary.data) return primary.data as unknown as LegalDocRow

    const fallback = await supabase
      .from('legal_documents')
      .select('title, content_md, version, updated_at')
      .eq('type', 'terms')
      .eq('audience', 'all')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (fallback.error) throw fallback.error
    return (fallback.data ? (fallback.data as unknown as LegalDocRow) : null)
  },
  ['legal-terms-helper'],
  { tags: ['legal-docs'], revalidate: 3600 }
)

export default async function HelperTermsPage() {
  const doc = await getLatestHelperTerms()

  return (
    <LegalDoc
      title={doc?.title ?? 'Helper Terms & Conditions'}
      contentMd={doc?.content_md ?? 'No terms available.'}
      version={doc?.version}
      updatedAt={doc?.updated_at}
      backHref="/auth/login"
    />
  )
}

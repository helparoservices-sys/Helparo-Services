// Static generate with periodic revalidation for faster first load
export const revalidate = 3600 // 1 hour
export const dynamic = 'force-static'

import { createClient } from '@/lib/supabase/server'
import LegalDoc from '@/components/legal/legal-doc'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Customer Privacy Policy | Helparo',
  description: 'Privacy policy for customers using Helparo.',
  robots: 'index, follow',
}

type LegalDocRow = { title: string; content_md: string; version: number | string; updated_at?: string }

const getLatestCustomerPrivacy = unstable_cache(
  async (): Promise<LegalDocRow | null> => {
    const supabase = await createClient()

    const primary = await supabase
      .from('legal_documents')
      .select('title, content_md, version, updated_at')
      .eq('type', 'privacy')
      .eq('audience', 'customer')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (primary.error) throw primary.error
    if (primary.data) return primary.data as unknown as LegalDocRow

    const fallback = await supabase
      .from('legal_documents')
      .select('title, content_md, version, updated_at')
      .eq('type', 'privacy')
      .eq('audience', 'all')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (fallback.error) throw fallback.error
    return (fallback.data ? (fallback.data as unknown as LegalDocRow) : null)
  },
  ['legal-privacy-customer'],
  { tags: ['legal-docs'], revalidate: 3600 }
)

export default async function CustomerPrivacyPage() {
  const doc = await getLatestCustomerPrivacy()

  return (
    <LegalDoc
      title={doc?.title ?? 'Customer Privacy Policy'}
      contentMd={doc?.content_md ?? 'No privacy policy available.'}
      version={doc?.version}
      updatedAt={doc?.updated_at}
      backHref="/auth/login"
    />
  )
}

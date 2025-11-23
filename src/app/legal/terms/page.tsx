// Static generate with periodic revalidation for faster first load
export const revalidate = 3600 // 1 hour
export const dynamic = 'force-static'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'
import LegalDoc from '@/components/legal/legal-doc'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Helparo',
  description: 'Read the terms and conditions for using Helparo services platform.',
  robots: 'index, follow',
}

type LegalDocRow = Pick<Database['public']['Tables']['legal_documents']['Row'], 'title' | 'content_md' | 'version' | 'type' | 'is_active' | 'updated_at'>

const getLatestTerms = unstable_cache(
  async (): Promise<LegalDocRow | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('legal_documents')
      .select('title, content_md, version, type, is_active, updated_at')
      .eq('type', 'terms')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return (data ? (data as LegalDocRow) : null)
  },
  ['legal-terms'],
  { tags: ['legal-docs'], revalidate: 3600 }
)

export default async function TermsPage() {
  const doc = await getLatestTerms()

  return (
    <LegalDoc
      title={doc?.title ?? 'Terms & Conditions'}
      contentMd={doc?.content_md ?? 'No terms available.'}
      version={doc?.version}
      updatedAt={doc?.updated_at}
      backHref="/auth/signup"
    />
  )
}

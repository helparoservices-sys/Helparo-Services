// Static generate with periodic revalidation
export const revalidate = 3600 // 1 hour
export const dynamic = 'force-static'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'
import LegalDoc from '@/components/legal/legal-doc'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Documents | Helparo',
  description: 'Review and accept Helparo terms of service and privacy policy.',
  robots: 'noindex, nofollow',
}

type LegalDocRow = Pick<Database['public']['Tables']['legal_documents']['Row'], 'title' | 'content_md' | 'version' | 'type' | 'is_active' | 'updated_at'>

const getLatestConsent = unstable_cache(
  async (): Promise<{ terms: LegalDocRow | null; privacy: LegalDocRow | null }> => {
    const supabase = await createClient()

    const { data: terms } = await supabase
      .from('legal_documents')
      .select('title, content_md, version, type, is_active, updated_at')
      .eq('type', 'terms')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: privacy } = await supabase
      .from('legal_documents')
      .select('title, content_md, version, type, is_active, updated_at')
      .eq('type', 'privacy')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    return {
      terms: terms ? (terms as LegalDocRow) : null,
      privacy: privacy ? (privacy as LegalDocRow) : null,
    }
  },
  ['legal-consent'],
  { tags: ['legal-docs'], revalidate: 3600 }
)

export default async function ConsentPage() {
  const { terms, privacy } = await getLatestConsent()

  // For consent page, we'll show both documents with a combined content
  const combinedContent = `
${terms ? `## ${terms.title} (Version ${terms.version})\n\n${terms.content_md}\n\n---\n\n` : '## Terms & Conditions\n\nNo terms available.\n\n---\n\n'}
${privacy ? `## ${privacy.title} (Version ${privacy.version})\n\n${privacy.content_md}` : '## Privacy Policy\n\nNo privacy policy available.'}
  `.trim()

  // Use the most recent update date
  const latestUpdate =
    terms?.updated_at && privacy?.updated_at
      ? new Date(terms.updated_at) > new Date(privacy.updated_at)
        ? terms.updated_at
        : privacy.updated_at
      : terms?.updated_at || privacy?.updated_at

  return (
    <LegalDoc
      title="Review & Accept Legal Documents"
      contentMd={combinedContent}
      updatedAt={latestUpdate}
      backHref="/"
    />
  )
}

// Static generate with periodic revalidation for faster first load
export const revalidate = 3600 // 1 hour
export const dynamic = 'force-static'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'
import LegalDoc from '@/components/legal/legal-doc'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Helparo',
  description: 'Learn how Helparo protects your privacy and handles your personal data.',
  robots: 'index, follow',
}

type LegalDocRow = Pick<Database['public']['Tables']['legal_documents']['Row'], 'title' | 'content_md' | 'version' | 'type' | 'is_active' | 'updated_at'>

const getLatestPrivacy = unstable_cache(
  async (): Promise<LegalDocRow | null> => {
    const supabase = await createClient()
    const attempt = await supabase
      .from('legal_documents')
      .select('title, content_md, version, type, is_active, updated_at')
      .eq('type', 'privacy')
      .eq('audience', 'all')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!attempt.error) {
      return (attempt.data ? (attempt.data as LegalDocRow) : null)
    }

    // Backward compatible: DB may not have `audience` column yet.
    const legacy = await supabase
      .from('legal_documents')
      .select('title, content_md, version, type, is_active, updated_at')
      .eq('type', 'privacy')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (legacy.error) throw attempt.error
    return (legacy.data ? (legacy.data as LegalDocRow) : null)
  },
  ['legal-privacy'],
  { tags: ['legal-docs'], revalidate: 3600 }
)

export default async function PrivacyPage() {
  const doc = await getLatestPrivacy()

  return (
    <LegalDoc
      title={doc?.title ?? 'Privacy Policy'}
      contentMd={doc?.content_md ?? 'No privacy policy available.'}
      version={doc?.version}
      updatedAt={doc?.updated_at}
      backHref="/auth/signup"
    />
  )
}

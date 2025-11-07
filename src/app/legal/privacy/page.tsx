'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type LegalDoc = Pick<Database['public']['Tables']['legal_documents']['Row'], 'title' | 'content_md' | 'version' | 'type' | 'is_active'>

async function getLatestPrivacy(): Promise<LegalDoc | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('type', 'privacy')
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data ? (data as LegalDoc) : null)
}

export default async function PrivacyPage() {
  const doc = await getLatestPrivacy()

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{doc?.title ?? 'Privacy Policy'}</h1>
          <Button asChild variant="outline">
            <Link href="/auth/signup">Back to Sign Up</Link>
          </Button>
        </div>
        <article className="prose prose-slate max-w-none bg-white p-6 rounded-lg shadow">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc?.content_md ?? 'No privacy policy available.'}</ReactMarkdown>
        </article>
      </div>
    </div>
  )
}

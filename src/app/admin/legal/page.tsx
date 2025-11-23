import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Scale, Plus } from 'lucide-react'
import { LegalPageClient } from '@/components/admin/legal-page-client'

export default async function AdminLegalPage() {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('legal_documents')
    .select('id, type, title, version, is_active, created_at')
    .order('created_at', { ascending: false })

  // Calculate stats
  const totalDocuments = documents?.length || 0
  const activeDocuments = documents?.filter((d) => d.is_active).length || 0
  const draftDocuments = documents?.filter((d) => !d.is_active).length || 0
  const latestVersion = documents?.[0]?.version || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Scale className="h-8 w-8 text-primary-600" />
              Legal Documents
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage terms, privacy policy & legal content</p>
          </div>
          <Link 
            href="/admin/legal/new" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Add Document
          </Link>
        </div>

        <LegalPageClient
          documents={documents || []}
          stats={{
            totalDocuments,
            activeDocuments,
            draftDocuments,
            latestVersion,
          }}
        />
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { Scale, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LegalDocumentForm } from '@/components/admin/legal-document-form'
import { createLegalDocument, getNextVersion } from '@/app/actions/legal'

export default async function NewLegalDocumentPage({ searchParams }: { searchParams: { type?: 'terms' | 'privacy' } }) {
  const type = searchParams.type || 'terms'
  
  // Get suggested next version
  const suggestedVersion = await getNextVersion(type)

  async function handleCreate(data: unknown) {
    'use server'
    const result = await createLegalDocument(data as Parameters<typeof createLegalDocument>[0])
    if (result.error) {
      return { error: result.error }
    }
    redirect('/admin/legal')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/legal"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Legal Documents
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary-600" />
            Create Legal Document
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Add a new terms of service or privacy policy document
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg p-6 md:p-8">
          <LegalDocumentForm
            mode="create"
            suggestedVersion={suggestedVersion}
            onSubmit={handleCreate}
          />
        </div>

        {/* Tip */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            💡 Version Management Tip
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Each document type can have multiple versions. Only one version can be active at a time. 
            Users will see the active version when they visit the legal pages. Create new versions when updating terms or policies.
          </p>
        </div>
      </div>
    </div>
  )
}

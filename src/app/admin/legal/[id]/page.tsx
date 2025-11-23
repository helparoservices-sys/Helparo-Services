import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Scale, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LegalDocumentForm } from '@/components/admin/legal-document-form'
import { updateLegalDocument } from '@/app/actions/legal'

export default async function EditLegalDocumentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Fetch document
  const { data: document, error } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !document) {
    notFound()
  }

  async function handleUpdate(data: unknown) {
    'use server'
    const result = await updateLegalDocument(data as Parameters<typeof updateLegalDocument>[0])
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
            Edit Legal Document
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Update {document.type} document version {document.version}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg p-6 md:p-8">
          <LegalDocumentForm
            document={document}
            mode="edit"
            onSubmit={handleUpdate}
          />
        </div>
      </div>
    </div>
  )
}

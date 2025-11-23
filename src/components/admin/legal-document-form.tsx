'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, AlertCircle, Loader2 } from 'lucide-react'

interface FormData {
  id?: string
  type?: 'terms' | 'privacy'
  version?: number
  title: string
  content_md: string
  is_active: boolean
}

interface LegalDocumentFormProps {
  document?: {
    id: string
    type: 'terms' | 'privacy'
    version: number
    title: string
    content_md: string
    is_active: boolean
  }
  mode: 'create' | 'edit'
  suggestedVersion?: number
  onSubmit: (data: FormData) => Promise<{ error?: string; data?: unknown }>
}

export function LegalDocumentForm({ document, mode, suggestedVersion, onSubmit }: LegalDocumentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState<'terms' | 'privacy'>(document?.type || 'terms')
  const [version, setVersion] = useState(document?.version || suggestedVersion || 1)
  const [title, setTitle] = useState(document?.title || '')
  const [contentMd, setContentMd] = useState(document?.content_md || '')
  const [isActive, setIsActive] = useState(document?.is_active ?? false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await onSubmit({
        ...(mode === 'edit' && { id: document?.id }),
        ...(mode === 'create' && { type, version }),
        title,
        content_md: contentMd,
        is_active: isActive,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin/legal')
        router.refresh()
      }
    } catch {
      setError('Failed to save document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Document Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'terms' | 'privacy')}
            disabled={mode === 'edit'}
            required
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="terms">Terms & Conditions</option>
            <option value="privacy">Privacy Policy</option>
          </select>
          {mode === 'edit' && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Type cannot be changed after creation
            </p>
          )}
        </div>

        {/* Version */}
        <div>
          <label htmlFor="version" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Version
          </label>
          <input
            type="number"
            id="version"
            value={version}
            onChange={(e) => setVersion(parseInt(e.target.value))}
            disabled={mode === 'edit'}
            min="1"
            required
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {mode === 'edit' && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Version cannot be changed after creation
            </p>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Helparo Terms & Conditions v2"
          required
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Content (Markdown) */}
      <div>
        <label htmlFor="content_md" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Content (Markdown)
        </label>
        <textarea
          id="content_md"
          value={contentMd}
          onChange={(e) => setContentMd(e.target.value)}
          rows={20}
          placeholder="# Heading&#10;&#10;Your markdown content here...&#10;&#10;## Section&#10;&#10;- Bullet points&#10;- More content"
          required
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Supports Markdown formatting. Use # for headings, ** for bold, * for italic, - for lists, etc.
        </p>
      </div>

      {/* Active Status */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <input
          type="checkbox"
          id="is_active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 rounded"
        />
        <div className="flex-1">
          <label htmlFor="is_active" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Mark as Active
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Only one version per document type can be active at a time. Setting this as active will deactivate other versions.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              {mode === 'create' ? 'Create Document' : 'Save Changes'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

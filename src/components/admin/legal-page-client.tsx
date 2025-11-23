'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, CheckCircle, XCircle, Eye, Edit2, Trash2, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { deleteLegalDocument } from '@/app/actions/legal'

interface LegalDocument {
  id: string
  type: string
  title: string
  version: number
  is_active: boolean
  created_at: string
}

interface LegalPageClientProps {
  documents: LegalDocument[]
  stats: {
    totalDocuments: number
    activeDocuments: number
    draftDocuments: number
    latestVersion: number
  }
}

export function LegalPageClient({ documents, stats }: LegalPageClientProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleDelete = useCallback(async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000) // Reset after 3 seconds
      return
    }

    setDeletingId(id)
    setError('')

    try {
      const result = await deleteLegalDocument(id)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    } catch {
      setError('Failed to delete document')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }, [deleteConfirm, router])

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Documents</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalDocuments}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Documents</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.activeDocuments}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Draft Documents</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.draftDocuments}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg">
              <Edit2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Latest Version</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">v{stats.latestVersion}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Legal Documents</h2>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {documents.map((doc) => (
            <div key={doc.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          doc.is_active 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {doc.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Draft
                            </>
                          )}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {doc.type} • v{doc.version}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 ml-13">
                    Created: {new Date(doc.created_at).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/legal/${doc.type}`} 
                    target="_blank"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Link>
                  <Link 
                    href={`/admin/legal/${doc.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      deleteConfirm === doc.id
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {deletingId === doc.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        {deleteConfirm === doc.id ? 'Confirm?' : 'Delete'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {documents.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Legal Documents</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Create terms of service and privacy policy to get started.</p>
              <Link 
                href="/admin/legal/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Create First Document
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Scale, FileText, CheckCircle, Edit2, Eye, Plus, XCircle } from 'lucide-react'

export default async function AdminLegalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  const { data: documents } = await supabase
    .from('legal_documents')
    .select('id, type, title, version, is_active, created_at')
    .order('created_at', { ascending: false })

  // Calculate stats
  const totalDocuments = documents?.length || 0
  const activeDocuments = documents?.filter((d: any) => d.is_active).length || 0
  const draftDocuments = documents?.filter((d: any) => !d.is_active).length || 0
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Documents</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalDocuments}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeDocuments}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{draftDocuments}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">v{latestVersion}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg">
                <Scale className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Legal Documents</h2>
          </div>
          
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {(documents || []).map((doc: any) => (
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
                  </div>
                </div>
              </div>
            ))}
            
            {(!documents || documents.length === 0) && (
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
      </div>
    </div>
  )
}

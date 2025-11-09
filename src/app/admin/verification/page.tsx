'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Shield, Clock, CheckCircle, XCircle, FileText, Eye, User } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'

interface PendingHelper {
  user_id: string
  full_name: string | null
  email: string
  status: string
}

export default function AdminVerificationPage() {
  const [helpers, setHelpers] = useState<PendingHelper[]>([])
  const [docs, setDocs] = useState<Record<string, { doc_type: string; file_path: string }[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [decision, setDecision] = useState<Record<string, 'approved' | 'rejected' | ''>>({})
  const [comment, setComment] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      // fetch pending helpers
      const { data, error: err } = await supabase
        .from('helper_profiles')
        .select('user_id, verification_status, profiles!helper_profiles_user_id_fkey(full_name, email)')
        .eq('verification_status', 'pending')
      if (err) { setError('Failed to load'); setLoading(false); return }
      const list = (data || []).map((row: any) => ({
        user_id: row.user_id,
        full_name: row.profiles?.full_name || null,
        email: row.profiles?.email || '',
        status: row.verification_status,
      }))
      setHelpers(list)

      // fetch docs for each
      for (const h of list) {
        const { data: d } = await supabase
          .from('verification_documents')
          .select('document_type, document_url')
          .eq('helper_id', h.user_id)
        setDocs(prev => ({ ...prev, [h.user_id]: (d || []).map((doc: any) => ({ doc_type: doc.document_type, file_path: doc.document_url })) }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const viewDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from('kyc').createSignedUrl(path, 60)
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const act = async (helperId: string, d: 'approved' | 'rejected') => {
    const c = comment[helperId] || ''
    // Update helper profile
    const { error: upErr } = await (supabase.from('helper_profiles') as any)
      .update({ is_approved: d === 'approved', verification_status: d })
      .eq('user_id', helperId)
    if (upErr) { setError(upErr.message); return }

    // Insert review row
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await (supabase.from('verification_reviews') as any).insert({
        helper_user_id: helperId,
        admin_user_id: user.id,
        decision: d,
        comment: c || null,
      })
    }

    // refresh list
    setHelpers(prev => prev.filter(h => h.user_id !== helperId))
  }

  if (loading) {
    return <PageLoader text="Loading verification queue..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            Pending Helper Verifications
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Review and approve helper documents</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{helpers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Documents</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {Object.values(docs).reduce((sum, d) => sum + d.length, 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Docs/Helper</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {helpers.length ? Math.round(Object.values(docs).reduce((sum, d) => sum + d.length, 0) / helpers.length) : 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Queue Status</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : 'Ready'}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Helpers List */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Verification Queue</h2>
          </div>
          
          <div className="p-6">
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-slate-500 dark:text-slate-400 mt-4">Loading verifications...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            {!loading && helpers.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-300 dark:text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">All Caught Up!</h3>
                <p className="text-slate-500 dark:text-slate-400">No pending verifications at the moment.</p>
              </div>
            )}
            
            <div className="space-y-6">
              {helpers.map(h => (
                <div key={h.user_id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-semibold text-lg">
                          {h.full_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{h.full_name || 'Unnamed'}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{h.email}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 mt-1">
                          <Clock className="h-3 w-3" />
                          {h.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents ({(docs[h.user_id] || []).length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(docs[h.user_id] || []).map((d, i) => (
                        <button
                          key={i}
                          onClick={() => viewDoc(d.file_path)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View {d.doc_type}
                        </button>
                      ))}
                      {(docs[h.user_id] || []).length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <textarea
                      className="w-full min-h-[80px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                      placeholder="Review comment (optional)"
                      value={comment[h.user_id] || ''}
                      onChange={(e) => setComment({ ...comment, [h.user_id]: e.target.value })}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => act(h.user_id, 'approved')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg flex-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => act(h.user_id, 'rejected')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg flex-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

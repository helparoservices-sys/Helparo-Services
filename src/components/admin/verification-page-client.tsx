'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Clock, CheckCircle, XCircle, FileText, Eye, User, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { approveHelper, rejectHelper } from '@/app/actions/admin'

interface Document {
  id: string
  doc_type: string
  file_path: string
  status: string
  created_at: string
}

interface BankAccount {
  account_holder_name?: string
  account_number?: string
  ifsc_code?: string
  bank_name?: string
  upi_id?: string
  status?: string
}

interface Helper {
  user_id: string
  full_name: string
  email: string
  avatar_url: string | null
  status: string
  documents: Document[]
  // Onboarding details
  service_categories?: string[]
  skills?: string[]
  experience_years?: number
  hourly_rate?: number
  address?: string
  pincode?: string
  service_areas?: string[]
  working_hours?: any
  bank_account?: BankAccount | null
}

interface VerificationPageClientProps {
  helpers: Helper[]
  stats: {
    pendingHelpers: number
    totalDocuments: number
    avgDocsPerHelper: number
  }
  error?: string
}

export function VerificationPageClient({
  helpers: initialHelpers,
  stats,
  error: initialError
}: VerificationPageClientProps) {
  const router = useRouter()
  const [helpers, setHelpers] = useState(initialHelpers)
  const [comment, setComment] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  // Only show initial error if there are no helpers (real error scenario)
  const [error, setError] = useState<string | undefined>(
    initialHelpers.length === 0 ? initialError : undefined
  )
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    setError(undefined) // Clear any previous errors
    router.refresh()
    setTimeout(() => setRefreshing(false), 500)
  }, [router])

  const viewDocument = useCallback(async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc')
        .createSignedUrl(path, 60)
      
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    }
  }, [])

  const handleApprove = useCallback(async (helperId: string) => {
    setActionLoading(prev => ({ ...prev, [helperId]: true }))
    setError(undefined)
    
    try {
      const result = await approveHelper(helperId, comment[helperId] || '')
      
      console.log('[Approve] Result:', result)
      
      if (result && 'error' in result && result.error) {
        setError(result.error)
      } else if (result && 'success' in result && result.success) {
        // Success - remove from list
        setHelpers(prev => prev.filter(h => h.user_id !== helperId))
        setComment(prev => {
          const newComment = { ...prev }
          delete newComment[helperId]
          return newComment
        })
        setError(undefined) // Clear any existing error
      } else {
        // Unknown response format
        console.warn('[Approve] Unexpected result format:', result)
        setHelpers(prev => prev.filter(h => h.user_id !== helperId))
      }
    } catch (err) {
      console.error('[Approve] Exception:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve helper')
    } finally {
      setActionLoading(prev => ({ ...prev, [helperId]: false }))
    }
  }, [comment])

  const handleReject = useCallback(async (helperId: string) => {
    setActionLoading(prev => ({ ...prev, [helperId]: true }))
    setError(undefined)
    
    try {
      const result = await rejectHelper(helperId, comment[helperId] || '')
      
      console.log('[Reject] Result:', result)
      
      if (result && 'error' in result && result.error) {
        setError(result.error)
      } else if (result && 'success' in result && result.success) {
        // Success - remove from list
        setHelpers(prev => prev.filter(h => h.user_id !== helperId))
        setComment(prev => {
          const newComment = { ...prev }
          delete newComment[helperId]
          return newComment
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject helper')
    } finally {
      setActionLoading(prev => ({ ...prev, [helperId]: false }))
    }
  }, [comment])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-600" />
              Pending Helper Verifications
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Review and approve helper documents</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
                  {helpers.reduce((sum, h) => sum + h.documents.length, 0)}
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
                  {stats.avgDocsPerHelper}
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Ready</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Pending Helpers List */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Verification Queue</h2>
          </div>
          
          <div className="p-6">
            {helpers.length === 0 && (
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
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{h.full_name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{h.email}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 mt-1">
                          <Clock className="h-3 w-3" />
                          {h.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Onboarding Details */}
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {h.service_categories && h.service_categories.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Service Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {h.service_categories.map((cat, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {h.skills && h.skills.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {h.skills.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {h.experience_years !== null && h.experience_years !== undefined && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Experience</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{h.experience_years} years</p>
                      </div>
                    )}
                    {h.hourly_rate && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hourly Rate</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">₹{h.hourly_rate}</p>
                      </div>
                    )}
                    {h.address && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Address</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{h.address}{h.pincode ? ` - ${h.pincode}` : ''}</p>
                      </div>
                    )}
                    {h.service_areas && h.service_areas.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Service Areas</p>
                        <div className="flex flex-wrap gap-1">
                          {h.service_areas.map((area, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {h.bank_account && (
                      <div className="md:col-span-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-semibold">Bank Account</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {h.bank_account.account_holder_name && (
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Holder:</span>
                              <span className="ml-1 font-medium text-slate-900 dark:text-white">{h.bank_account.account_holder_name}</span>
                            </div>
                          )}
                          {h.bank_account.account_number && (
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Account:</span>
                              <span className="ml-1 font-medium text-slate-900 dark:text-white">****{h.bank_account.account_number.slice(-4)}</span>
                            </div>
                          )}
                          {h.bank_account.ifsc_code && (
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">IFSC:</span>
                              <span className="ml-1 font-medium text-slate-900 dark:text-white">{h.bank_account.ifsc_code}</span>
                            </div>
                          )}
                          {h.bank_account.bank_name && (
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Bank:</span>
                              <span className="ml-1 font-medium text-slate-900 dark:text-white">{h.bank_account.bank_name}</span>
                            </div>
                          )}
                          {h.bank_account.upi_id && (
                            <div className="col-span-2">
                              <span className="text-slate-500 dark:text-slate-400">UPI:</span>
                              <span className="ml-1 font-medium text-slate-900 dark:text-white">{h.bank_account.upi_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents ({h.documents.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {h.documents.length > 0 ? (
                        h.documents.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => viewDocument(d.file_path)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View {d.doc_type.replace('_', ' ').toUpperCase()}
                          </button>
                        ))
                      ) : (
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
                      disabled={actionLoading[h.user_id]}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(h.user_id)}
                        disabled={actionLoading[h.user_id]}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors shadow-lg flex-1"
                      >
                        {actionLoading[h.user_id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(h.user_id)}
                        disabled={actionLoading[h.user_id]}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors shadow-lg flex-1"
                      >
                        {actionLoading[h.user_id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Reject
                          </>
                        )}
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

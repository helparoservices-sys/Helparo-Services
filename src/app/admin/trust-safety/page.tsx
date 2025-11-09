'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, UserCheck, AlertCircle, TrendingUp, Search, Eye, FileCheck, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { PageLoader } from '@/components/admin/PageLoader'

interface BackgroundCheck {
  id: string
  helper_id: string
  check_type: string
  status: string
  result: string | null
  verified_at: string | null
  expires_at: string | null
  created_at: string
  helper: {
    name: string
    email: string
  }
}

interface TrustScore {
  helper_id: string
  score: number
  status: string
  verification_level: string
  last_updated: string
  helper: {
    name: string
    email: string
  }
}

export default function AdminTrustSafetyPage() {
  const [loading, setLoading] = useState(true)
  const [checks, setChecks] = useState<BackgroundCheck[]>([])
  const [trustScores, setTrustScores] = useState<TrustScore[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'checks' | 'scores'>('checks')
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'expired'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch background checks from Supabase
      const { data: checksData, error: checksError } = await supabase
        .from('background_check_results')
        .select(`
          id,
          helper_id,
          check_type,
          status,
          verification_score,
          verified_at,
          expires_at,
          created_at,
          helper:profiles!background_check_results_helper_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (checksError) throw checksError

      // Transform the data to match the interface
      const transformedChecks = (checksData || []).map((check: any) => ({
        ...check,
        result: check.verification_score > 70 ? 'passed' : 'pending',
        helper: {
          name: check.helper?.full_name || 'Unknown',
          email: check.helper?.email || 'N/A'
        }
      }))

      // Fetch trust scores
      const { data: scoresData, error: scoresError } = await supabase
        .from('helper_trust_scores')
        .select(`
          helper_id,
          trust_score,
          status,
          verification_level,
          updated_at,
          helper:profiles!helper_trust_scores_helper_id_fkey(full_name, email)
        `)
        .order('trust_score', { ascending: false })

      if (scoresError) throw scoresError

      // Transform scores data
      const transformedScores = (scoresData || []).map((score: any) => ({
        ...score,
        score: score.trust_score,
        last_updated: score.updated_at,
        helper: {
          name: score.helper?.full_name || 'Unknown',
          email: score.helper?.email || 'N/A'
        }
      }))

      setChecks(transformedChecks)
      setTrustScores(transformedScores)
    } catch (error: any) {
      console.error('Error loading trust & safety data:', error)
      setError(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700'
    }
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  const getVerificationBadge = (level: string) => {
    const badges: Record<string, { color: string; icon: string }> = {
      basic: { color: 'bg-gray-100 text-gray-700', icon: '✓' },
      standard: { color: 'bg-blue-100 text-blue-700', icon: '✓✓' },
      premium: { color: 'bg-purple-100 text-purple-700', icon: '✓✓✓' },
      elite: { color: 'bg-yellow-100 text-yellow-700', icon: '⭐' }
    }
    return badges[level.toLowerCase()] || badges.basic
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false
    const daysUntilExpiry = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const filteredChecks = checks.filter(check => {
    if (filter !== 'all' && check.status.toLowerCase() !== filter) return false
    if (searchTerm && !check.helper?.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !check.helper?.email.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const filteredScores = trustScores.filter(score => {
    if (searchTerm && !score.helper?.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !score.helper?.email.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const pendingChecks = checks.filter(c => c.status === 'pending').length
  const verifiedChecks = checks.filter(c => c.status === 'verified').length
  const expiredChecks = checks.filter(c => c.status === 'expired').length

  if (loading) {
    return <PageLoader text="Loading trust & safety data..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-600" />
            Trust & Safety Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor background checks, verifications, and trust scores</p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg mb-3">
                <FileCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{checks.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Checks</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shadow-lg mb-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingChecks}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Pending</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg mb-3">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{verifiedChecks}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Verified</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-lg mb-3">
                <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{expiredChecks}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Expired</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg mb-3">
                <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{trustScores.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Trust Scores</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('checks')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'checks'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Background Checks ({checks.length})
            </button>
            <button
              onClick={() => setActiveTab('scores')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'scores'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Trust Scores ({trustScores.length})
            </button>
          </div>

          {/* Filters & Search */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row gap-4">
              {activeTab === 'checks' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'pending'
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('verified')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'verified'
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Verified
                  </button>
                  <button
                    onClick={() => setFilter('expired')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'expired'
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Expired
                  </button>
                </div>
              )}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search by helper name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-slate-500 dark:text-slate-400 mt-4">Loading data...</p>
              </div>
            ) : activeTab === 'checks' ? (
              filteredChecks.length === 0 ? (
                <div className="p-12 text-center">
                  <FileCheck className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Background Checks Found</h3>
                  <p className="text-slate-500 dark:text-slate-400">Start verifying helpers to see background checks here.</p>
                </div>
              ) : (
                filteredChecks.map(check => (
                  <div key={check.id} className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    isExpiringSoon(check.expires_at) ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-semibold text-lg">
                            {check.helper?.name?.charAt(0).toUpperCase() || 'H'}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {check.helper?.name || 'Unknown Helper'}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{check.helper?.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-medium capitalize text-slate-900 dark:text-white">
                            {check.check_type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {check.verified_at ? `Verified ${new Date(check.verified_at).toLocaleDateString()}` : 'Not verified'}
                          </div>
                          {check.expires_at && (
                            <div className={`text-xs mt-1 ${
                              isExpiringSoon(check.expires_at) 
                                ? 'text-red-600 dark:text-red-400 font-medium flex items-center gap-1' 
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {isExpiringSoon(check.expires_at) && <AlertCircle className="h-3 w-3" />}
                              Expires {new Date(check.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                          {check.status}
                        </span>

                        <Link href={`/admin/providers/${check.helper_id}`}>
                          <button className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                            <Eye className="h-4 w-4" />
                            View Profile
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              filteredScores.length === 0 ? (
                <div className="p-12 text-center">
                  <Award className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Trust Scores Found</h3>
                  <p className="text-slate-500 dark:text-slate-400">Helper trust scores will appear here once calculated.</p>
                </div>
              ) : (
                filteredScores.map(score => {
                  const badge = getVerificationBadge(score.verification_level)
                  return (
                    <div key={score.helper_id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-lg">
                              {score.helper?.name?.charAt(0).toUpperCase() || 'H'}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {score.helper?.name || 'Unknown Helper'}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{score.helper?.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(score.score)}`}>{score.score}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Trust Score</div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(score.status)}`}>
                              {score.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                              {badge.icon} {score.verification_level}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-500 dark:text-slate-400">Last Updated</div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {new Date(score.last_updated).toLocaleDateString()}
                            </div>
                          </div>

                          <Link href={`/admin/providers/${score.helper_id}`}>
                            <button className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                              <Eye className="h-4 w-4" />
                              View Profile
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

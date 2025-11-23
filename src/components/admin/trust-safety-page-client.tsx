'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Shield, UserCheck, AlertCircle, TrendingUp, Search, Eye, FileCheck, Award, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-notification'

// Helper function for consistent date formatting (prevents hydration errors)
const formatDate = (dateString: string | null) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

interface BackgroundCheck {
  id: string
  helper_id: string
  check_type: string
  status: string
  result: string | null
  verification_score?: number
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
  trust_score?: number
  status: string
  verification_level: string
  last_updated: string
  updated_at?: string
  helper: {
    name: string
    email: string
  }
}

interface TrustSafetyPageClientProps {
  checks: BackgroundCheck[]
  trustScores: TrustScore[]
  stats: {
    totalChecks: number
    pendingChecks: number
    verifiedChecks: number
    expiredChecks: number
    totalScores: number
  }
  error?: string
}

export function TrustSafetyPageClient({
  checks,
  trustScores,
  stats,
  error: initialError
}: TrustSafetyPageClientProps) {
  const router = useRouter()
  const { showSuccess, showInfo } = useToast()
  const [activeTab, setActiveTab] = useState<'checks' | 'scores'>('checks')
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'expired'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(initialError || '')
  const [refreshing, setRefreshing] = useState(false)

  // Filter checks based on filter and search
  const filteredChecks = useMemo(() => {
    let filtered = checks

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(check => check.status === filter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        check =>
          check.helper.name.toLowerCase().includes(term) ||
          check.helper.email.toLowerCase().includes(term) ||
          check.check_type.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [checks, filter, searchTerm])

  // Filter scores based on search
  const filteredScores = useMemo(() => {
    if (!searchTerm) return trustScores

    const term = searchTerm.toLowerCase()
    return trustScores.filter(
      score =>
        score.helper.name.toLowerCase().includes(term) ||
        score.helper.email.toLowerCase().includes(term)
    )
  }, [trustScores, searchTerm])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    showInfo('Refreshing Data...', 'Fetching latest trust & safety information')
    router.refresh()
    setTimeout(() => {
      setRefreshing(false)
      showSuccess('Data Refreshed! 🔄', 'Trust & safety data has been updated')
    }, 1000)
  }, [router, showInfo, showSuccess])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'active':
        return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'expired':
      case 'flagged':
        return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'gold':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'silver':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/30 dark:text-gray-400'
      case 'bronze':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400'
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6 bg-background dark:bg-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trust & Safety</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Manage background checks and trust scores
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2 text-foreground dark:text-white"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Checks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalChecks}
              </p>
            </div>
            <FileCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {stats.pendingChecks}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Verified</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.verifiedChecks}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Trust Scores</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats.totalScores}
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('checks')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'checks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Background Checks
            </button>
            <button
              onClick={() => setActiveTab('scores')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'scores'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Trust Scores
            </button>
          </div>

          {activeTab === 'checks' && (
            <div className="flex gap-2">
              {(['all', 'pending', 'verified', 'expired'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'checks' ? 'checks' : 'scores'}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Background Checks Table */}
        {activeTab === 'checks' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Helper
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChecks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No background checks found
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm || filter !== 'all'
                          ? 'Try adjusting your filters or search'
                          : 'Background checks will appear here'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredChecks.map(check => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {check.helper.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {check.helper.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {check.check_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            check.status
                          )}`}
                        >
                          {check.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {check.verification_score ? (
                          <span
                            className={`text-sm font-semibold ${getTrustScoreColor(
                              check.verification_score
                            )}`}
                          >
                            {check.verification_score}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {check.verified_at
                          ? formatDate(check.verified_at)
                          : 'Not verified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {check.expires_at
                          ? formatDate(check.expires_at)
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/trust-safety/${check.id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Trust Scores Table */}
        {activeTab === 'scores' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Helper
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trust Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredScores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No trust scores found
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm
                          ? 'Try adjusting your search'
                          : 'Trust scores will appear here'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredScores.map(score => (
                    <tr
                      key={score.helper_id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {score.helper.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {score.helper.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`text-2xl font-bold ${getTrustScoreColor(
                              score.score || score.trust_score || 0
                            )}`}
                          >
                            {score.score || score.trust_score || 0}
                          </span>
                          <span className="text-gray-400 text-sm ml-1">
                            /100
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            score.status
                          )}`}
                        >
                          {score.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getVerificationColor(
                            score.verification_level
                          )}`}
                        >
                          {score.verification_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(
                          score.last_updated || score.updated_at || ''
                        ) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/helpers/${score.helper_id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

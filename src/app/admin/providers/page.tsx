'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  UserCheck,
  Users
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'

export default function ProvidersPage() {
  const [loading, setLoading] = useState(true)
  const [helpers, setHelpers] = useState<any[]>([])
  const [error, setError] = useState('')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetchHelpers()
  }, [])

  const fetchHelpers = async () => {
    try {
      setLoading(true)

      const { data: helpersData, error: helpersError } = await supabase
        .from('helper_profiles')
        .select(`
          id, 
          user_id, 
          verification_status, 
          is_approved, 
          service_categories,
          experience_years,
          is_available_now,
          created_at,
          profiles!helper_profiles_user_id_fkey (
            full_name, 
            email, 
            phone_number,
            phone,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (helpersError) {
        console.error('Error fetching helpers:', helpersError)
        setError('Failed to fetch providers')
      } else {
        setHelpers(helpersData || [])
        console.log('Helpers data:', helpersData)
        console.log('Helpers count:', helpersData?.length)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader text="Loading providers..." />
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  // Derived data & stats
  const filteredHelpers = helpers.filter(h => {
    if (verificationFilter !== 'all') {
      if (verificationFilter === 'approved' && h.verification_status !== 'approved') return false
      if (verificationFilter === 'pending' && h.verification_status !== 'pending') return false
      if (verificationFilter === 'rejected' && h.verification_status !== 'rejected') return false
      if (verificationFilter === 'unverified' && !!h.verification_status) return false
    }
    if (availabilityFilter !== 'all') {
      if (availabilityFilter === 'available' && !h.is_available_now) return false
      if (availabilityFilter === 'unavailable' && h.is_available_now) return false
    }
    return true
  })

  const totalHelpers = filteredHelpers.length || 0
  const availableHelpers = filteredHelpers.filter(h => h.is_available_now).length || 0
  const pendingHelpers = filteredHelpers.filter(h => h.verification_status === 'pending').length || 0
  const verifiedHelpers = filteredHelpers.filter(h => h.verification_status === 'approved').length || 0

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const toggleAvailability = async (helper: any) => {
    setTogglingId(helper.id)
    const newValue = !helper.is_available_now
    // optimistic
    setHelpers(prev => prev.map(h => h.id === helper.id ? { ...h, is_available_now: newValue } : h))
    const { error: updErr } = await supabase
      .from('helper_profiles')
      .update({ is_available_now: newValue })
      .eq('id', helper.id)
    if (updErr) {
      // revert
      setHelpers(prev => prev.map(h => h.id === helper.id ? { ...h, is_available_now: !newValue } : h))
      alert('Failed to toggle availability: ' + updErr.message)
    }
    setTogglingId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Providers Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage helper verification, approval & ratings</p>
        </div>
        <Link
          href="/admin/verification"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
        >
          <Shield className="h-5 w-5" />
          Verification Queue
        </Link>
      </div>

      {/* Stats Cards (match users page styling) */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Helpers</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalHelpers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Available Now</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{availableHelpers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{pendingHelpers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Verified</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{verifiedHelpers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card (matching users page) */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Verification</label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Availability</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Providers Grid (replaces table) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredHelpers.map(helper => {
          const status = helper.profiles?.status
          const verification = helper.verification_status
          return (
            <div key={helper.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {helper.profiles?.full_name?.charAt(0).toUpperCase() || 'H'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1">{helper.profiles?.full_name || 'Unnamed'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{helper.profiles?.email}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {status === 'active' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>}
                    {status === 'suspended' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Suspended</span>}
                    {status === 'banned' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Banned</span>}
                    {verification === 'approved' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Verified</span>}
                    {verification === 'pending' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>}
                    {verification === 'rejected' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Rejected</span>}
                    {helper.is_available_now && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Available</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => toggleAvailability(helper)}
                  disabled={togglingId === helper.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${helper.is_available_now ? 'bg-green-500 dark:bg-green-600' : 'bg-slate-300 dark:bg-slate-600'} ${togglingId === helper.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={helper.is_available_now ? 'Available - click to mark unavailable' : 'Unavailable - click to mark available'}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${helper.is_available_now ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">Joined {new Date(helper.created_at).toLocaleDateString()}</div>
              </div>

              {helper.service_categories && helper.service_categories.length > 0 && (
                <div className={`space-y-1 mb-4 ${expandedId === helper.id ? '' : 'max-h-16 overflow-hidden'}`}>
                  {helper.service_categories.map((cat: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-300 mr-1 mb-1">{cat}</span>
                  ))}
                </div>
              )}
              {!helper.service_categories || helper.service_categories.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">No categories assigned</p>
              ) : (
                <button
                  onClick={() => toggleExpand(helper.id)}
                  className="text-[11px] mb-4 inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {expandedId === helper.id ? 'Collapse' : 'Show All'}
                </button>
              )}

              <div className="mt-auto flex gap-2">
                <Link href={`/admin/providers/${helper.user_id}`} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                  View
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {filteredHelpers.length === 0 && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-12 text-center">
          <Shield className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Providers Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Adjust filters to see helpers</p>
        </div>
      )}
    </div>
  )
}

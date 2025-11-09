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
import { DataTable } from '@/components/admin/DataTable'

export default function ProvidersPage() {
  const [loading, setLoading] = useState(true)
  const [helpers, setHelpers] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHelpers()
  }, [])

  const fetchHelpers = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        setError('Unauthorized')
        setLoading(false)
        return
      }

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

  // Calculate stats
  const totalHelpers = helpers?.length || 0
  const availableHelpers = helpers?.filter(h => h.is_available_now).length || 0
  const pendingHelpers = helpers?.filter(h => !h.is_approved).length || 0
  const verifiedHelpers = helpers?.filter(h => h.verification_status === 'approved').length || 0

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
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Verification Queue
        </Link>
      </div>

      {/* Stats Cards */}
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

      {/* Providers Table */}
      <DataTable
        data={helpers || []}
        searchPlaceholder="Search by name, email, or phone..."
        columns={[
          {
            key: 'full_name',
            label: 'Provider',
            sortable: true,
            render: (h: any) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {h.profiles?.full_name?.charAt(0).toUpperCase() || 'H'}
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{h.profiles?.full_name || 'Unnamed'}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{h.profiles?.email}</div>
                </div>
              </div>
            )
          },
          {
            key: 'phone',
            label: 'Contact',
            render: (h: any) => h.profiles?.phone || h.profiles?.phone_number || '—'
          },
          {
            key: 'service_categories',
            label: 'Categories',
            render: (h: any) => (
              <div className="flex flex-wrap gap-1">
                {h.service_categories && h.service_categories.length > 0 ? (
                  h.service_categories.map((cat: string, idx: number) => (
                    <span key={idx} className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    General
                  </span>
                )}
              </div>
            )
          },
          {
            key: 'is_available_now',
            label: 'Availability',
            render: (h: any) => h.is_available_now ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                <XCircle className="h-3 w-3" />
                Unavailable
              </span>
            )
          },
          {
            key: 'status',
            label: 'Account Status',
            render: (h: any) => {
              if (h.profiles?.status === 'active') {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                )
              } else if (h.profiles?.status === 'suspended') {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    <AlertCircle className="h-3 w-3" />
                    Suspended
                  </span>
                )
              } else if (h.profiles?.status === 'banned') {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <XCircle className="h-3 w-3" />
                    Banned
                  </span>
                )
              } else {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    Inactive
                  </span>
                )
              }
            }
          },
          {
            key: 'verification_status',
            label: 'Verification',
            render: (h: any) => {
              if (h.verification_status === 'approved') {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    Approved
                  </span>
                )
              } else if (h.verification_status === 'pending') {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <AlertCircle className="h-3 w-3" />
                    Pending
                  </span>
                )
              } else if (h.verification_status === 'rejected') {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <XCircle className="h-3 w-3" />
                    Rejected
                  </span>
                )
              } else {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    <AlertCircle className="h-3 w-3" />
                    Not Verified
                  </span>
                )
              }
            }
          },
          {
            key: 'created_at',
            label: 'Joined',
            sortable: true,
            render: (h: any) => new Date(h.created_at).toLocaleDateString()
          }
        ]}
        actions={(h: any) => (
          <Link 
            href={`/admin/providers/${h.user_id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors whitespace-nowrap"
          >
            View Details
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
        emptyMessage="No providers found"
        emptyIcon={<Shield className="h-12 w-12 text-slate-300 dark:text-slate-600" />}
        itemsPerPage={10}
      />
    </div>
  )
}

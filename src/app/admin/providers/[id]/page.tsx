'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'

interface HelperDetail {
  id: string
  user_id: string
  verification_status: string | null
  is_approved: boolean
  service_categories: string[] | null
  experience_years: number | null
  is_available_now: boolean
  created_at: string
  address?: string | null
  pincode?: string | null
  profiles?: {
    full_name?: string | null
    email?: string | null
    phone?: string | null
    phone_number?: string | null
    status?: string | null
  }
}

export default function ProviderDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [helper, setHelper] = useState<HelperDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    
    const fetchHelper = async () => {
      try {
        // Fetch single helper by user id - auth already handled by middleware
        const { data, error: helperError } = await supabase
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
            address,
            pincode,
            profiles!helper_profiles_user_id_fkey (
              full_name,
              email,
              phone,
              phone_number,
              status
            )
          `)
          .eq('user_id', params.id)
          .single()

        if (!mounted) return

        if (helperError) {
          setError(helperError.code === 'PGRST116' ? 'Provider not found' : 'Failed to load provider')
          return
        }

        setHelper(data as HelperDetail)
      } catch (err: any) {
        if (!mounted) return
        setError('An unexpected error occurred')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchHelper()
    
    return () => { mounted = false }
  }, [params.id])

  // Memoize badges to avoid recreating on each render
  const statusBadge = useMemo(() => {
    const s = helper?.profiles?.status
    if (s === 'active') return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
    if (s === 'suspended') return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Suspended</span>
    if (s === 'banned') return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Banned</span>
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">Inactive</span>
  }, [helper?.profiles?.status])

  const verificationBadge = useMemo(() => {
    const v = helper?.verification_status
    if (v === 'approved') return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Verified</span>
    if (v === 'pending') return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>
    if (v === 'rejected') return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Rejected</span>
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">Unverified</span>
  }, [helper?.verification_status])

  if (loading) {
    return <PageLoader text="Loading provider..." />
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
        <Link href="/admin/providers" className="mt-4 inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline">Back to Providers</Link>
      </div>
    )
  }

  if (!helper) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-400">Provider not found.</p>
        </div>
        <Link href="/admin/providers" className="mt-4 inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline">Back to Providers</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Provider Detail</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Insight into a single helper's profile & status</p>
        </div>
        <Link
          href="/admin/providers"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
        >
          Back to Providers
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
              {helper.profiles?.full_name?.charAt(0).toUpperCase() || 'H'}
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{helper.profiles?.full_name || 'Unnamed Helper'}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{helper.profiles?.email}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{helper.profiles?.phone || helper.profiles?.phone_number || 'No phone'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {statusBadge}
                {verificationBadge}
                {helper.is_available_now ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Available Now</span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">Unavailable</span>
                )}
                {helper.is_approved && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Approved</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Joined</p>
              <p className="mt-1 font-medium text-slate-900 dark:text-white">{new Date(helper.created_at).toLocaleString()}</p>
            </div>
            {helper.address && (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Address</p>
                <p className="mt-1 font-medium text-slate-900 dark:text-white">{helper.address}{helper.pincode ? ` - ${helper.pincode}` : ''}</p>
              </div>
            )}
            {helper.experience_years !== null && helper.experience_years !== undefined && (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Experience (Years)</p>
                <p className="mt-1 font-medium text-slate-900 dark:text-white">{helper.experience_years}</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Service Categories</h3>
          <div className="flex flex-wrap gap-2">
            {helper.service_categories && helper.service_categories.length > 0 ? (
              helper.service_categories.map((c, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{c}</span>
              ))
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">General</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

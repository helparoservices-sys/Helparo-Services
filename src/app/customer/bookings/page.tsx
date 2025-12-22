'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  IndianRupee, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Star,
  Eye,
  Plus,
  History,
  Sparkles
} from 'lucide-react'

interface Booking {
  id: string
  booking_number?: string
  title: string
  description: string
  status: string
  broadcast_status?: string
  created_at: string
  assigned_at: string | null
  job_completed_at: string | null
  assigned_helper_id: string | null
  service_address: string | null
  service_city: string | null
  budget_min: number | null
  budget_max: number | null
  helper_profile?: {
    full_name: string
    avatar_url: string | null
    phone: string | null
  }
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', bgColor: 'bg-gray-100', textColor: 'text-gray-700', icon: Clock },
  open: { label: 'Finding Helper', bgColor: 'bg-blue-100', textColor: 'text-blue-700', icon: AlertCircle },
  assigned: { label: 'Assigned', bgColor: 'bg-amber-100', textColor: 'text-amber-700', icon: Clock },
  in_progress: { label: 'In Progress', bgColor: 'bg-purple-100', textColor: 'text-purple-700', icon: Clock },
  completed: { label: 'Completed', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: XCircle },
}

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    setLoading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError

      const user = authData?.user
      if (!user) {
        setBookings([])
        setErrorMessage('Please log in to view your past bookings.')
      } else {
        const { data: allBookingsData, error: bookingsError } = await supabase
          .from('service_requests')
          .select(`
            id,
            booking_number,
            title,
            description,
            status,
            broadcast_status,
            created_at,
            assigned_at,
            job_completed_at,
            assigned_helper_id,
            service_address,
            service_city,
            service_state,
            service_pincode,
            budget_min,
            budget_max
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        if (bookingsError) throw bookingsError

        const bookingsData = (allBookingsData ?? []).filter(b => 
          b?.status === 'completed' || 
          b?.status === 'cancelled' || 
          b?.broadcast_status === 'completed' || 
          b?.broadcast_status === 'cancelled'
        )

        let helperProfiles: Record<string, { full_name: string; avatar_url: string | null; phone: string | null }> = {}

        if (bookingsData.length > 0) {
          const helperIds = bookingsData
            .map(b => b?.assigned_helper_id)
            .filter((id): id is string => Boolean(id))

          if (helperIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, phone')
              .in('id', helperIds)

            if (profilesError) throw profilesError

            profiles?.forEach(p => {
              helperProfiles[p.id] = {
                full_name: p.full_name || 'Helper',
                avatar_url: p.avatar_url,
                phone: p.phone
              }
            })
          }
        }

        const transformedBookings = bookingsData.map((booking) => ({
          ...booking,
          helper_profile: booking?.assigned_helper_id 
            ? helperProfiles[booking.assigned_helper_id]
            : undefined
        }))

        setBookings(transformedBookings as Booking[])
      }
    } catch (error) {
      console.error('Failed to load past bookings', error)
      setBookings([])
      setErrorMessage('Unable to load your past bookings right now. Please refresh or tap retry.')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to determine if booking is completed or cancelled
  // Check both status and broadcast_status fields
  const isCompleted = (booking: Booking) => 
    booking.status === 'completed' || booking.broadcast_status === 'completed'
  
  const isCancelled = (booking: Booking) => 
    booking.status === 'cancelled' || booking.broadcast_status === 'cancelled'

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    if (filter === 'completed') return isCompleted(booking)
    if (filter === 'cancelled') return isCancelled(booking)
    return true
  })

  const formatDate = (value?: string | null) => {
    if (!value) return 'Date unavailable'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime())
      ? 'Date unavailable'
      : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => isCompleted(b)).length,
    cancelled: bookings.filter(b => isCancelled(b)).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 space-y-4">
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertCircle className="h-5 w-5 mt-0.5 text-amber-700" />
          <div className="space-y-2">
            <div className="text-sm font-semibold">We could not load your past bookings.</div>
            <p className="text-sm leading-relaxed">{errorMessage}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadBookings}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
              >
                Retry
              </button>
              <Link
                href="/customer/active-requests"
                className="inline-flex items-center justify-center rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                Go to Active Requests
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-5 md:p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium">
              Your Activity
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black mb-1">Booking History</h1>
          <p className="text-slate-300 text-sm md:text-base mb-4">
            Track all your completed and cancelled service requests
          </p>
          
          <Link href="/customer/requests/new">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25">
              <Plus className="w-4 h-4" />
              New Booking
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - Horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
        <div className="flex-shrink-0 w-[120px] md:w-auto md:flex-1 bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-0.5">Total History</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl md:text-3xl font-black text-gray-900">{stats.total}</p>
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </div>
        </div>

        <div className="flex-shrink-0 w-[120px] md:w-auto md:flex-1 bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-0.5">Completed</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl md:text-3xl font-black text-emerald-600">{stats.completed}</p>
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
          </div>
        </div>

        <div className="flex-shrink-0 w-[120px] md:w-auto md:flex-1 bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-0.5">Cancelled</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl md:text-3xl font-black text-red-500">{stats.cancelled}</p>
            <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 flex gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            filter === 'completed'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Completed ({stats.completed})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            filter === 'cancelled'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Cancelled ({stats.cancelled})
        </button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 md:p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-14 h-14 md:w-20 md:h-20 mx-auto mb-3 rounded-xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center">
            <Calendar className="w-7 h-7 md:w-10 md:h-10 text-gray-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
            {errorMessage ? 'Unable to show past bookings' : 'No completed bookings yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-5 max-w-xs mx-auto">
            {errorMessage
              ? errorMessage
              : filter === 'all' 
                ? "Your completed and cancelled bookings will appear here. Check your active requests for ongoing services." 
                : `No ${filter} bookings to show`}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-xs mx-auto">
            {errorMessage && (
              <button
                onClick={loadBookings}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold transition-all hover:bg-amber-700"
              >
                Retry
              </button>
            )}
            <Link href="/customer/active-requests" className="w-full sm:w-auto">
              <button className="w-full px-5 py-2.5 bg-white border-2 border-emerald-500 text-emerald-600 rounded-xl text-sm font-semibold transition-all hover:bg-emerald-50">
                View Active
              </button>
            </Link>
            <Link href="/customer/requests/new" className="w-full sm:w-auto">
              <button className="w-full px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md">
                Create New
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            // Determine the display status - prioritize broadcast_status if it shows completed/cancelled
            const displayStatus = 
              (booking.broadcast_status === 'completed' || booking.broadcast_status === 'cancelled') 
                ? booking.broadcast_status 
                : booking.status
            const config = statusConfig[displayStatus] || statusConfig.open
            const StatusIcon = config.icon

            return (
              <div 
                key={booking.id} 
                className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Title & Status */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{booking.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>

                    {/* Booking ID */}
                    {booking.booking_number && (
                      <p className="text-xs font-mono font-semibold text-blue-600 mb-2">
                        {booking.booking_number}
                      </p>
                    )}
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {booking.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {booking.service_address && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <span className="truncate max-w-[250px]">{booking.service_address}, {booking.service_city}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>Created {formatDate(booking.created_at)}</span>
                      </div>

                      {(booking.budget_min || booking.budget_max) && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <IndianRupee className="w-4 h-4 text-amber-500" />
                          <span>₹{booking.budget_min || 0} - ₹{booking.budget_max || 0}</span>
                        </div>
                      )}

                      {booking.assigned_helper_id && booking.helper_profile && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <User className="w-4 h-4 text-purple-500" />
                          <span>{booking.helper_profile.full_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:flex-col gap-2 md:min-w-[120px]">
                    <Link href={`/customer/bookings/${booking.id}`} className="flex-1 md:flex-none">
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </Link>

                    {isCompleted(booking) && (
                      <Link href={`/customer/requests/${booking.id}/review`} className="flex-1 md:flex-none">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-sm font-medium transition-all">
                          <Star className="w-4 h-4" />
                          Review
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom CTA */}
      {filteredBookings.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">Need help again?</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Our verified helpers are ready to assist you with any service</p>
          <Link href="/customer/requests/new">
            <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25">
              Book a New Service
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

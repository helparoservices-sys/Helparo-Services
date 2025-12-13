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
  title: string
  description: string
  status: string
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

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return

    const { data: bookingsData, error } = await supabase
      .from('service_requests')
      .select(`
        id,
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
        budget_max,
        helper_profile:assigned_helper_id (
          full_name,
          avatar_url,
          phone
        )
      `)
      .eq('customer_id', user.id)
      .in('broadcast_status', ['completed', 'cancelled'])
      .order('created_at', { ascending: false })

    if (!error && bookingsData) {
      const transformedBookings = bookingsData.map((booking: typeof bookingsData[0]) => ({
        ...booking,
        helper_profile: Array.isArray(booking.helper_profile) && booking.helper_profile.length > 0
          ? booking.helper_profile[0]
          : undefined
      }))
      setBookings(transformedBookings as Booking[])
    }
    setLoading(false)
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    if (filter === 'completed') return booking.status === 'completed'
    if (filter === 'cancelled') return booking.status === 'cancelled'
    return true
  })

  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
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
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium">
                Your Activity
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2">Booking History</h1>
            <p className="text-slate-300">
              Track all your completed and cancelled service requests
            </p>
          </div>
          
          <Link href="/customer/requests/new">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25">
              <Plus className="w-5 h-5" />
              New Booking
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total History</p>
              <p className="text-3xl font-black text-gray-900">{stats.total}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Completed</p>
              <p className="text-3xl font-black text-emerald-600">{stats.completed}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Cancelled</p>
              <p className="text-3xl font-black text-red-500">{stats.cancelled}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 inline-flex gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            filter === 'completed'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Completed ({stats.completed})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            filter === 'cancelled'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Cancelled ({stats.cancelled})
        </button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 shadow-md border border-gray-100 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "You haven't created any bookings yet. Let's fix that!" 
              : `No ${filter} bookings to show`}
          </p>
          {filter === 'all' && (
            <Link href="/customer/requests/new">
              <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all shadow-lg">
                Create Your First Booking
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const config = statusConfig[booking.status] || statusConfig.open
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
                        <span>Created {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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

                    {booking.status === 'completed' && (
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

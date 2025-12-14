'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

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
  Star,
  ChevronRight,
  History,
  Wrench,
  Phone,
  Timer,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  Package,
  Hash,
  CalendarDays,
  BadgeCheck,
  X
} from 'lucide-react'

interface PastBooking {
  id: string
  booking_number: string | null
  title: string
  description: string
  status: string
  broadcast_status: string | null
  created_at: string
  assigned_at: string | null
  job_started_at: string | null
  job_completed_at: string | null
  assigned_helper_id: string | null
  service_address: string | null
  service_city: string | null
  service_state: string | null
  service_pincode: string | null
  service_location_lat: number | null
  service_location_lng: number | null
  budget_min: number | null
  budget_max: number | null
  final_price: number | null
  estimated_price: number | null
  urgency_level: string | null
  images: string[] | null
  category_id: string | null
  service_type_details: {
    estimated_duration?: number
    helper_brings?: string[]
    customer_provides?: string[]
    work_overview?: string
    materials_needed?: string[]
  } | null
  helper_profile?: {
    full_name: string
    avatar_url: string | null
    phone: string | null
  }
  category?: {
    name: string
    icon: string
  }
  review?: {
    rating: number
    comment: string
  }
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: typeof Clock }> = {
  completed: { label: 'Completed', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: XCircle },
}

export default function PastBookingsPage() {
  const [bookings, setBookings] = useState<PastBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<PastBooking | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [imageModal, setImageModal] = useState<{ open: boolean; images: string[]; index: number }>({ open: false, images: [], index: 0 })

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      setLoading(false)
      return
    }

    // Fetch ALL bookings first
    const { data: allBookingsData, error } = await supabase
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
        job_started_at,
        job_completed_at,
        assigned_helper_id,
        service_address,
        service_city,
        service_state,
        service_pincode,
        service_location_lat,
        service_location_lng,
        budget_min,
        budget_max,
        final_price,
        estimated_price,
        urgency_level,
        images,
        category_id,
        service_type_details,
        category:category_id (name, icon)
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !allBookingsData) {
      setLoading(false)
      return
    }
    
    // Filter for completed or cancelled
    const bookingsData = allBookingsData.filter((b: any) => 
      b.status === 'completed' || 
      b.status === 'cancelled' || 
      b.broadcast_status === 'completed' || 
      b.broadcast_status === 'cancelled'
    )

    if (bookingsData.length > 0) {
      // Fetch helper profiles
      const helperIds = bookingsData
        .map((b: any) => b.assigned_helper_id)
        .filter((id: any): id is string => id !== null)
      
      const helperProfiles: Record<string, { full_name: string; avatar_url: string | null; phone: string | null }> = {}
      
      if (helperIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, phone')
          .in('id', helperIds)
        
        if (profiles) {
          profiles.forEach((p: any) => {
            helperProfiles[p.id] = {
              full_name: p.full_name || 'Helper',
              avatar_url: p.avatar_url,
              phone: p.phone
            }
          })
        }
      }

      // Fetch reviews for completed bookings
      const completedIds = bookingsData
        .filter((b: any) => b.status === 'completed' || b.broadcast_status === 'completed')
        .map((b: any) => b.id)
      
      const reviews: Record<string, { rating: number; comment: string }> = {}
      
      if (completedIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('service_request_id, rating, comment')
          .in('service_request_id', completedIds)
        
        if (reviewsData) {
          reviewsData.forEach((r: any) => {
            reviews[r.service_request_id] = {
              rating: r.rating,
              comment: r.comment || ''
            }
          })
        }
      }

      // Transform data
      const transformedBookings = bookingsData.map((booking: any) => ({
        ...booking,
        category: Array.isArray(booking.category) ? booking.category[0] : booking.category,
        helper_profile: booking.assigned_helper_id 
          ? helperProfiles[booking.assigned_helper_id]
          : undefined,
        review: reviews[booking.id]
      }))
      
      setBookings(transformedBookings as PastBooking[])
    }
    setLoading(false)
  }

  const isCompleted = (booking: PastBooking) => 
    booking.status === 'completed' || booking.broadcast_status === 'completed'
  
  const isCancelled = (booking: PastBooking) => 
    booking.status === 'cancelled' || booking.broadcast_status === 'cancelled'

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    if (filter === 'completed') return isCompleted(booking)
    if (filter === 'cancelled') return isCancelled(booking)
    return true
  })

  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => isCompleted(b)).length,
    cancelled: bookings.filter(b => isCancelled(b)).length,
  }

  // Calculate time taken for a booking
  const getTimeTaken = (booking: PastBooking): string => {
    if (!booking.job_started_at || !booking.job_completed_at) {
      if (booking.assigned_at && booking.job_completed_at) {
        const start = new Date(booking.assigned_at)
        const end = new Date(booking.job_completed_at)
        const diffMs = end.getTime() - start.getTime()
        const diffMins = Math.round(diffMs / 60000)
        if (diffMins < 60) return `${diffMins} min`
        const hours = Math.floor(diffMins / 60)
        const mins = diffMins % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
      }
      return 'N/A'
    }
    const start = new Date(booking.job_started_at)
    const end = new Date(booking.job_completed_at)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.round(diffMs / 60000)
    if (diffMins < 60) return `${diffMins} min`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your past bookings...</p>
        </div>
      </div>
    )
  }

  // Detail View
  if (selectedBooking) {
    const booking = selectedBooking
    const displayStatus = isCompleted(booking) ? 'completed' : 'cancelled'
    const config = statusConfig[displayStatus]
    const StatusIcon = config.icon

    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedBooking(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Past Bookings</span>
        </button>

        {/* Header Card */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {config.label}
                </span>
              </div>
              {booking.booking_number && (
                <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-lg">
                  {booking.booking_number}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl font-bold mb-2">{booking.title}</h1>
            <p className="text-slate-300 text-sm line-clamp-2">{booking.description}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Booked On</p>
                <p className="font-semibold text-gray-900 text-sm">{formatDateShort(booking.created_at)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Timer className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Time Taken</p>
                <p className="font-semibold text-gray-900 text-sm">{getTimeTaken(booking)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="font-semibold text-gray-900 text-sm">
                  ₹{booking.final_price || booking.estimated_price || booking.budget_max || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {booking.category?.name || 'General'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Helper Details */}
        {booking.helper_profile && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Helper Who Worked
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {booking.helper_profile.avatar_url ? (
                  <img 
                    src={booking.helper_profile.avatar_url} 
                    alt={booking.helper_profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  booking.helper_profile.full_name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  {booking.helper_profile.full_name}
                  <BadgeCheck className="w-5 h-5 text-emerald-500" />
                </h4>
                {booking.helper_profile.phone && (
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {booking.helper_profile.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Service Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Service Details
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
              <p className="text-gray-700">{booking.description}</p>
            </div>
            
            {booking.service_type_details?.work_overview && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Work Overview</p>
                <p className="text-gray-700">{booking.service_type_details.work_overview}</p>
              </div>
            )}
            
            {booking.service_type_details?.helper_brings && booking.service_type_details.helper_brings.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Helper Brought</p>
                <div className="flex flex-wrap gap-2">
                  {booking.service_type_details.helper_brings.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {booking.service_type_details?.materials_needed && booking.service_type_details.materials_needed.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Materials Used</p>
                <div className="flex flex-wrap gap-2">
                  {booking.service_type_details.materials_needed.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Service Location
          </h3>
          <p className="text-gray-700">
            {[booking.service_address, booking.service_city, booking.service_state, booking.service_pincode]
              .filter(Boolean)
              .join(', ') || 'Location not specified'}
          </p>
          {booking.service_location_lat && booking.service_location_lng && (
            <a
              href={`https://www.google.com/maps?q=${booking.service_location_lat},${booking.service_location_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              <MapPin className="w-4 h-4" />
              View on Google Maps
            </a>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Timeline
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5"></div>
              <div>
                <p className="font-medium text-gray-900">Booking Created</p>
                <p className="text-sm text-gray-500">{formatDate(booking.created_at)}</p>
              </div>
            </div>
            {booking.assigned_at && (
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-amber-500 mt-1.5"></div>
                <div>
                  <p className="font-medium text-gray-900">Helper Assigned</p>
                  <p className="text-sm text-gray-500">{formatDate(booking.assigned_at)}</p>
                </div>
              </div>
            )}
            {booking.job_started_at && (
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-purple-500 mt-1.5"></div>
                <div>
                  <p className="font-medium text-gray-900">Work Started</p>
                  <p className="text-sm text-gray-500">{formatDate(booking.job_started_at)}</p>
                </div>
              </div>
            )}
            {booking.job_completed_at && (
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    {isCompleted(booking) ? 'Work Completed' : 'Booking Cancelled'}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(booking.job_completed_at)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        {booking.images && booking.images.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pink-600" />
              Photos ({booking.images.length})
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {booking.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageModal({ open: true, images: booking.images!, index: i })}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                >
                  <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Review */}
        {booking.review && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Your Review
            </h3>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= booking.review!.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="ml-2 font-semibold text-gray-900">{booking.review.rating}/5</span>
            </div>
            {booking.review.comment && (
              <p className="text-gray-600 italic">&ldquo;{booking.review.comment}&rdquo;</p>
            )}
          </div>
        )}

        {/* Image Modal */}
        {imageModal.open && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setImageModal({ ...imageModal, open: false })}>
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
              onClick={() => setImageModal({ ...imageModal, open: false })}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={imageModal.images[imageModal.index]}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    )
  }

  // List View
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
                Service History
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2">Past Bookings</h1>
            <p className="text-slate-300">
              View all your completed and cancelled services with full details
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total</p>
              <p className="text-3xl font-black text-gray-900">{stats.total}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <Package className="w-7 h-7 text-blue-600" />
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
            <History className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No past bookings yet</h3>
          <p className="text-gray-500 mb-6">
            Your completed and cancelled services will appear here with all details.
          </p>
          <Link href="/customer/active-requests">
            <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all shadow-lg">
              View Active Requests
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const displayStatus = isCompleted(booking) ? 'completed' : 'cancelled'
            const config = statusConfig[displayStatus]
            const StatusIcon = config.icon

            return (
              <button
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="w-full text-left bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="w-full md:w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {booking.images && booking.images.length > 0 ? (
                      <img 
                        src={booking.images[0]} 
                        alt={booking.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-gray-100">
                        <Wrench className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title & Status */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{booking.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>

                    {/* Order ID */}
                    {booking.booking_number && (
                      <p className="text-xs font-mono font-semibold text-blue-600 mb-2 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {booking.booking_number}
                      </p>
                    )}

                    {/* Info Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateShort(booking.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {getTimeTaken(booking)}
                      </span>
                      {booking.helper_profile && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {booking.helper_profile.full_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        ₹{booking.final_price || booking.estimated_price || booking.budget_max || 'N/A'}
                      </span>
                    </div>

                    {/* Location */}
                    {booking.service_city && (
                      <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {booking.service_city}
                        {booking.service_state ? `, ${booking.service_state}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

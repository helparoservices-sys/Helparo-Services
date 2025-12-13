'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  Timer,
  Wrench,
  Camera,
  Video,
  FileText,
  Package,
  MessageSquare,
  Shield,
  BadgeCheck,
  Zap,
  Home,
  ChevronRight,
  Play,
  ExternalLink,
  Copy,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface BookingDetails {
  id: string
  title: string
  description: string
  status: string
  broadcast_status: string
  
  // Location
  service_address: string
  service_city: string
  service_state: string
  service_pincode: string
  service_location_lat: number
  service_location_lng: number
  
  // Pricing
  budget_min: number | null
  budget_max: number | null
  estimated_price: number | null
  final_price: number | null
  payment_method: string
  
  // Urgency
  urgency_level: string
  preferred_date: string | null
  preferred_time: string | null
  
  // Timestamps
  created_at: string
  helper_accepted_at: string | null
  helper_reached_at: string | null
  work_started_at: string | null
  work_completed_at: string | null
  cancelled_at: string | null
  
  // OTPs
  start_otp: string | null
  end_otp: string | null
  
  // Media
  images: string[]
  videos: string[]
  
  // AI Details
  service_type_details: {
    work_overview?: string
    estimated_duration?: number
    confidence?: number
    helper_brings?: string[]
    customer_provides?: string[]
    materials_needed?: string[]
    problem_duration?: string
    error_code?: string
  }
  
  // Category
  category: {
    id: string
    name: string
    icon: string
  } | null
  
  // Helper
  assigned_helper: {
    id: string
    user_id: string
    avg_rating: number
    total_jobs_completed: number
    years_experience: number
    profile: {
      full_name: string
      phone: string
      avatar_url: string | null
    }
  } | null
  
  // Cancellation
  cancellation_reason: string | null
  cancelled_by: string | null
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', bgColor: 'bg-gray-100', textColor: 'text-gray-700', icon: Clock },
  open: { label: 'Finding Helper', bgColor: 'bg-blue-100', textColor: 'text-blue-700', icon: AlertCircle },
  assigned: { label: 'Helper Assigned', bgColor: 'bg-amber-100', textColor: 'text-amber-700', icon: User },
  in_progress: { label: 'Work In Progress', bgColor: 'bg-purple-100', textColor: 'text-purple-700', icon: Wrench },
  completed: { label: 'Completed', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: XCircle },
}

const urgencyLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Flexible', color: 'text-gray-600' },
  normal: { label: 'Normal', color: 'text-blue-600' },
  high: { label: 'Urgent', color: 'text-orange-600' },
  emergency: { label: 'Emergency', color: 'text-red-600' },
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageModal, setImageModal] = useState<string | null>(null)

  useEffect(() => {
    loadBookingDetails()
  }, [bookingId])

  async function loadBookingDetails() {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          category:category_id (
            id,
            name,
            icon
          ),
          assigned_helper:assigned_helper_id (
            id,
            user_id,
            avg_rating,
            total_jobs_completed,
            years_experience,
            profile:user_id (
              full_name,
              phone,
              avatar_url
            )
          )
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error

      const transformed: BookingDetails = {
        id: data.id,
        title: data.title || 'Service Request',
        description: data.description || '',
        status: data.status || 'open',
        broadcast_status: data.broadcast_status || 'broadcasting',
        
        service_address: data.service_address || data.address_line1 || '',
        service_city: data.service_city || '',
        service_state: data.service_state || '',
        service_pincode: data.service_pincode || '',
        service_location_lat: data.service_location_lat || data.latitude || 0,
        service_location_lng: data.service_location_lng || data.longitude || 0,
        
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        estimated_price: data.estimated_price,
        final_price: data.final_price,
        payment_method: data.payment_method || 'cash',
        
        urgency_level: data.urgency_level || 'normal',
        preferred_date: data.preferred_date,
        preferred_time: data.preferred_time,
        
        created_at: data.created_at,
        helper_accepted_at: data.helper_accepted_at,
        helper_reached_at: data.helper_reached_at,
        work_started_at: data.work_started_at,
        work_completed_at: data.work_completed_at,
        cancelled_at: data.cancelled_at,
        
        start_otp: data.start_otp,
        end_otp: data.end_otp,
        
        images: data.images || [],
        videos: data.service_type_details?.videos || [],
        
        service_type_details: data.service_type_details || {},
        
        category: data.category ? (Array.isArray(data.category) ? data.category[0] : data.category) : null,
        
        assigned_helper: data.assigned_helper ? {
          ...data.assigned_helper,
          profile: Array.isArray(data.assigned_helper.profile) 
            ? data.assigned_helper.profile[0] 
            : data.assigned_helper.profile
        } : null,
        
        cancellation_reason: data.cancellation_reason,
        cancelled_by: data.cancelled_by,
      }

      setBooking(transformed)
    } catch (err) {
      console.error('Error loading booking:', err)
      toast.error('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatDuration(start: string | null, end: string | null) {
    if (!start || !end) return '-'
    const diff = new Date(end).getTime() - new Date(start).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} minutes`
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading details...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-3xl p-8 shadow-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-500 mb-6">This booking doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/customer/bookings')}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    )
  }

  const config = statusConfig[booking.status] || statusConfig.open
  const StatusIcon = config.icon
  const urgency = urgencyLabels[booking.urgency_level] || urgencyLabels.normal

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-11 h-11 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-sm text-gray-500">Complete information about your booking</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl p-4 ${config.bgColor}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${config.textColor} bg-white/50 flex items-center justify-center`}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div>
            <p className={`font-bold ${config.textColor}`}>{config.label}</p>
            <p className="text-sm text-gray-600">
              {booking.status === 'completed' && `Completed on ${formatDate(booking.work_completed_at)}`}
              {booking.status === 'cancelled' && `Cancelled on ${formatDate(booking.cancelled_at)}`}
              {!['completed', 'cancelled'].includes(booking.status) && `Created on ${formatDate(booking.created_at)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Service Details Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start gap-3">
            {booking.category && (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{booking.category.icon || '🔧'}</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{booking.title}</h2>
                  {booking.category && (
                    <p className="text-sm text-emerald-600 font-medium">{booking.category.name}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold ${urgency.color}`}>
                  {urgency.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Description */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Problem Description</p>
            <p className="text-gray-700">{booking.description || 'No description provided'}</p>
          </div>

          {/* AI Work Overview */}
          {booking.service_type_details?.work_overview && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-700">AI Analysis</p>
              </div>
              <p className="text-sm text-blue-800">{booking.service_type_details.work_overview}</p>
            </div>
          )}
        </div>
      </div>

      {/* Photos & Videos */}
      {(booking.images.length > 0 || booking.videos.length > 0) && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Photos & Videos</h3>
            <span className="text-xs text-gray-500">({booking.images.length + booking.videos.length} files)</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {booking.images.map((img, idx) => (
              <button
                key={`img-${idx}`}
                onClick={() => setImageModal(img)}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-all relative group"
              >
                <Image
                  src={img}
                  alt={`Photo ${idx + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </button>
            ))}
            {booking.videos.map((vid, idx) => (
              <a
                key={`vid-${idx}`}
                href={vid}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center hover:opacity-80 transition-all"
              >
                <div className="text-center">
                  <Play className="w-8 h-8 text-white mx-auto mb-1" />
                  <span className="text-xs text-white/70">Video {idx + 1}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Location Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-gray-900">Service Location</h3>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="font-medium text-gray-900">{booking.service_address}</p>
          <p className="text-sm text-gray-500">
            {[booking.service_city, booking.service_state, booking.service_pincode].filter(Boolean).join(', ')}
          </p>
        </div>

        {booking.service_location_lat && booking.service_location_lng && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${booking.service_location_lat},${booking.service_location_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-sm font-medium transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Maps
          </a>
        )}
      </div>

      {/* Helper Details */}
      {booking.assigned_helper && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Assigned Helper</h3>
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                {booking.assigned_helper.profile?.avatar_url ? (
                  <Image
                    src={booking.assigned_helper.profile.avatar_url}
                    alt={booking.assigned_helper.profile?.full_name || 'Helper'}
                    width={64}
                    height={64}
                    className="rounded-2xl object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>

              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg">
                  {booking.assigned_helper.profile?.full_name || 'Helper'}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {booking.assigned_helper.avg_rating?.toFixed(1) || '5.0'}
                    </span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">
                    {booking.assigned_helper.total_jobs_completed || 0} jobs
                  </span>
                  {booking.assigned_helper.years_experience > 0 && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500">
                        {booking.assigned_helper.years_experience}+ yrs exp
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {booking.assigned_helper.profile?.phone && (
              <div className="mt-4 flex gap-2">
                <a
                  href={`tel:${booking.assigned_helper.profile.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-sm font-medium transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Call Helper
                </a>
                <button
                  onClick={() => copyToClipboard(booking.assigned_helper!.profile.phone)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-gray-900">Timeline</h3>
        </div>

        <div className="space-y-4">
          {/* Created */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 pb-4 border-b border-gray-100">
              <p className="font-medium text-gray-900">Booking Created</p>
              <p className="text-sm text-gray-500">{formatDate(booking.created_at)}</p>
            </div>
          </div>

          {/* Helper Accepted */}
          {booking.helper_accepted_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 pb-4 border-b border-gray-100">
                <p className="font-medium text-gray-900">Helper Accepted</p>
                <p className="text-sm text-gray-500">{formatDate(booking.helper_accepted_at)}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  Response time: {formatDuration(booking.created_at, booking.helper_accepted_at)}
                </p>
              </div>
            </div>
          )}

          {/* Helper Reached */}
          {booking.helper_reached_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 pb-4 border-b border-gray-100">
                <p className="font-medium text-gray-900">Helper Arrived</p>
                <p className="text-sm text-gray-500">{formatDate(booking.helper_reached_at)}</p>
              </div>
            </div>
          )}

          {/* Work Started */}
          {booking.work_started_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 pb-4 border-b border-gray-100">
                <p className="font-medium text-gray-900">Work Started</p>
                <p className="text-sm text-gray-500">{formatDate(booking.work_started_at)}</p>
              </div>
            </div>
          )}

          {/* Work Completed */}
          {booking.work_completed_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Work Completed</p>
                <p className="text-sm text-gray-500">{formatDate(booking.work_completed_at)}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  Work duration: {formatDuration(booking.work_started_at, booking.work_completed_at)}
                </p>
              </div>
            </div>
          )}

          {/* Cancelled */}
          {booking.cancelled_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Cancelled</p>
                <p className="text-sm text-gray-500">{formatDate(booking.cancelled_at)}</p>
                {booking.cancellation_reason && (
                  <p className="text-xs text-red-600 mt-1">Reason: {booking.cancellation_reason}</p>
                )}
                {booking.cancelled_by && (
                  <p className="text-xs text-gray-500">By: {booking.cancelled_by}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <IndianRupee className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-gray-900">Payment Details</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Payment Method</span>
            <span className="font-medium text-gray-900 capitalize">{booking.payment_method}</span>
          </div>

          {(booking.budget_min || booking.budget_max) && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Budget Range</span>
              <span className="font-medium text-gray-900">
                ₹{booking.budget_min || 0} - ₹{booking.budget_max || 0}
              </span>
            </div>
          )}

          {booking.estimated_price && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Estimated Price</span>
              <span className="font-medium text-gray-900">₹{booking.estimated_price}</span>
            </div>
          )}

          {booking.final_price && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Final Amount</span>
              <span className="font-bold text-xl text-emerald-600">₹{booking.final_price}</span>
            </div>
          )}

          {!booking.final_price && booking.estimated_price && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Amount</span>
              <span className="font-bold text-xl text-emerald-600">₹{booking.estimated_price}</span>
            </div>
          )}
        </div>
      </div>

      {/* Materials & Requirements */}
      {(booking.service_type_details?.materials_needed?.length > 0 ||
        booking.service_type_details?.helper_brings?.length > 0 ||
        booking.service_type_details?.customer_provides?.length > 0) && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Materials & Requirements</h3>
          </div>

          <div className="space-y-4">
            {booking.service_type_details?.helper_brings?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Helper Will Bring</p>
                <div className="flex flex-wrap gap-2">
                  {booking.service_type_details.helper_brings.map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {booking.service_type_details?.customer_provides?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Customer Should Provide</p>
                <div className="flex flex-wrap gap-2">
                  {booking.service_type_details.customer_provides.map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {booking.service_type_details?.materials_needed?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Materials Needed</p>
                <div className="flex flex-wrap gap-2">
                  {booking.service_type_details.materials_needed.map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900">Additional Information</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Booking ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-900">{booking.id.slice(0, 8)}...</span>
              <button onClick={() => copyToClipboard(booking.id)} className="text-gray-400 hover:text-gray-600">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {booking.preferred_date && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Preferred Date</span>
              <span className="text-gray-900">{new Date(booking.preferred_date).toLocaleDateString('en-IN')}</span>
            </div>
          )}

          {booking.preferred_time && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Preferred Time</span>
              <span className="text-gray-900">{booking.preferred_time}</span>
            </div>
          )}

          {booking.service_type_details?.estimated_duration && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Estimated Duration</span>
              <span className="text-gray-900">{booking.service_type_details.estimated_duration} minutes</span>
            </div>
          )}

          {booking.service_type_details?.problem_duration && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Problem Duration</span>
              <span className="text-gray-900">{booking.service_type_details.problem_duration}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {booking.status === 'completed' && (
        <div className="sticky bottom-4">
          <Link href={`/customer/requests/${booking.id}/review`}>
            <button className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all">
              <Star className="w-5 h-5" />
              Write a Review
            </button>
          </Link>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
            onClick={() => setImageModal(null)}
          >
            <XCircle className="w-6 h-6" />
          </button>
          <Image
            src={imageModal}
            alt="Full size"
            width={800}
            height={600}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  )
}

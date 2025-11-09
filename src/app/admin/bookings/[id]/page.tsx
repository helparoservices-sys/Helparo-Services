'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, MapPin, Calendar, Clock, DollarSign,
  Phone, Mail, CheckCircle, XCircle, AlertCircle, Package,
  MessageSquare, Image as ImageIcon, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/admin/PageLoader'
import { supabase } from '@/lib/supabase/client'

interface Booking {
  id: string
  booking_number: string
  service_name: string
  customer_name: string
  customer_email: string
  customer_phone: string
  provider_name: string
  provider_phone: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  booking_date: string
  booking_time: string
  address: string
  total_amount: number
  payment_status: 'pending' | 'paid' | 'refunded'
  created_at: string
  notes?: string
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookingDetails()
  }, [params.id])

  const fetchBookingDetails = async () => {
    try {
      // Fetch booking with related data
      const { data: booking, error: bookingError } = await supabase
        .from('service_requests')
        .select(`
          *,
          service_categories(name),
          customer:profiles!service_requests_customer_id_fkey(full_name, email, phone),
          helper:profiles!service_requests_assigned_helper_id_fkey(full_name, phone)
        `)
        .eq('id', params.id)
        .single()

      if (bookingError) throw bookingError

      setBooking({
        id: booking.id,
        booking_number: booking.booking_number || `SR-${booking.id.slice(0, 8)}`,
        service_name: booking.service_categories?.name || booking.title || 'N/A',
        customer_name: booking.customer?.full_name || 'N/A',
        customer_email: booking.customer?.email || 'N/A',
        customer_phone: booking.customer?.phone || 'N/A',
        provider_name: booking.helper?.full_name || 'Not Assigned',
        provider_phone: booking.helper?.phone || 'N/A',
        status: booking.status,
        booking_date: booking.created_at,
        booking_time: booking.scheduled_at || booking.created_at,
        address: booking.address || booking.city || 'N/A',
        total_amount: booking.final_price || booking.estimated_price || 0,
        payment_status: booking.payment_status || 'pending',
        created_at: booking.created_at,
        notes: booking.description || booking.notes
      })
    } catch (error) {
      console.error('Error fetching booking:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus })
        .eq('id', params.id)

      if (error) throw error

      setBooking(prev => prev ? { ...prev, status: newStatus as any } : null)
    } catch (error) {
      console.error('Error updating booking status:', error)
    }
  }

  if (loading) return <PageLoader text="Loading booking details..." />

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Booking Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">This booking doesn't exist.</p>
          <Button onClick={() => router.push('/admin/bookings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/bookings')}
            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Button>
          
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Booking Header Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {booking.service_name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Booking #{booking.booking_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{booking.total_amount}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                booking.payment_status === 'paid' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : booking.payment_status === 'refunded'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {booking.payment_status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Booking Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Date & Time</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Service Location</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{booking.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Booked On</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {new Date(booking.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {booking.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Special Instructions</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Card */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
                <p className="font-semibold text-slate-900 dark:text-white">{booking.customer_name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${booking.customer_email}`} className="text-primary hover:underline">
                  {booking.customer_email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-400" />
                <a href={`tel:${booking.customer_phone}`} className="text-slate-700 dark:text-slate-300">
                  {booking.customer_phone}
                </a>
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm">
                View Customer Profile
              </Button>
            </div>
          </div>

          {/* Provider Card */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Provider Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
                <p className="font-semibold text-slate-900 dark:text-white">{booking.provider_name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-400" />
                <a href={`tel:${booking.provider_phone}`} className="text-slate-700 dark:text-slate-300">
                  {booking.provider_phone}
                </a>
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm">
                View Provider Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Update Booking Status</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateBookingStatus('confirmed')}
              disabled={booking.status === 'confirmed'}
              className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateBookingStatus('in_progress')}
              disabled={booking.status === 'in_progress'}
              className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            >
              <Clock className="mr-2 h-4 w-4" />
              In Progress
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateBookingStatus('completed')}
              disabled={booking.status === 'completed'}
              className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateBookingStatus('cancelled')}
              disabled={booking.status === 'cancelled'}
              className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

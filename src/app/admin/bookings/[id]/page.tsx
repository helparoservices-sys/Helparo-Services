import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Package, FileText } from 'lucide-react'
import { BookingActions } from '@/components/admin/booking-actions'

export const dynamic = 'force-dynamic'

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: booking, error } = await supabase
    .from('service_requests')
    .select(`
      id,
      title,
      description,
      status,
      created_at,
      estimated_price,
      category_id,
      assigned_helper_id,
      customer:profiles!service_requests_customer_id_fkey(full_name,email),
      helper:profiles!service_requests_assigned_helper_id_fkey(full_name,email)
    `)
    .eq('id', params.id)
    .single()

  if (error || !booking) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-3">Booking Not Found</h2>
        <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-primary-600">
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
        </Link>
      </div>
    )
  }

  // Fix array to object (Supabase returns array for FK relations)
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
  const helper = Array.isArray(booking.helper) ? booking.helper[0] : booking.helper

  // Fetch category name manually (no FK relationship)
  let categoryName: string | null = null
  if (booking.category_id) {
    const { data: cat } = await supabase
      .from('service_categories')
      .select('name')
      .eq('id', booking.category_id)
      .single()
    categoryName = cat?.name || null
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'assigned': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'open': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/bookings" className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(booking.status)}`}>{booking.status}</span>
      </div>
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          {categoryName && <Package className="h-5 w-5 text-slate-500" />} {booking.title}
        </h1>
        {categoryName && <p className="text-sm text-slate-600 dark:text-slate-400">Category: {categoryName}</p>}
        <p className="text-sm text-slate-600 dark:text-slate-400">Created: {new Date(booking.created_at).toLocaleString()}</p>
        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{booking.description}</p>
        <div className="flex flex-wrap gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1"><Clock className="h-4 w-4 text-slate-400" /> Status: {booking.status}</div>
          <div className="flex items-center gap-1"><Calendar className="h-4 w-4 text-slate-400" /> Price: ₹{booking.estimated_price ?? '—'}</div>
        </div>
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          {/* Actions */}
          <div className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Manage Booking</div>
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-4">
            <BookingActions bookingId={booking.id} currentStatus={booking.status} assignedHelperId={booking.assigned_helper_id} />
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow rounded-lg p-5 space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Customer</h2>
          <p className="font-medium">{customer?.full_name || '—'}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{customer?.email}</p>
        </div>
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow rounded-lg p-5 space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Assigned Helper</h2>
          <p className="font-medium">{helper?.full_name || 'Not assigned'}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{helper?.email}</p>
        </div>
      </div>
      {booking.description && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-2"><FileText className="h-4 w-4" /> Details</h2>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{booking.description}</p>
        </div>
      )}
    </div>
  )
}

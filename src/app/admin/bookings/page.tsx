import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookingsFilters } from '@/components/admin/bookings-filters'
import { 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Calendar,
  IndianRupee,
  Package
} from 'lucide-react'

interface BookingRow {
  id: string
  title: string
  status: 'draft' | 'open' | 'assigned' | 'completed' | 'cancelled'
  estimated_price: number | null
  created_at: string
  service_categories?: { name: string } | null
  customer_profile?: { full_name: string | null; email: string | null } | null
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const supabase = await createClient()

  const pageSize = 20
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))

  // Base query (filters applied later)
  let baseQuery = supabase
    .from('service_requests')
    .select(`
      id,
      title,
      status,
      estimated_price,
      created_at,
      category_id,
      profiles:profiles!service_requests_customer_id_fkey(full_name,email)
    `)
    .order('created_at', { ascending: false })

  // Filters
  const statusFilter = searchParams.status?.trim()
  if (statusFilter) baseQuery = baseQuery.eq('status', statusFilter)
  const bookingIdFilter = searchParams.bookingId?.trim()
  if (bookingIdFilter) baseQuery = baseQuery.ilike('id', `%${bookingIdFilter}%`)
  const customerFilter = searchParams.customer?.trim()
  if (customerFilter) baseQuery = baseQuery.ilike('profiles.full_name', `%${customerFilter}%`)
  const categoryFilter = searchParams.category?.trim()
  const fromDate = searchParams.from?.trim()
  if (fromDate) baseQuery = baseQuery.gte('created_at', new Date(fromDate + 'T00:00:00Z').toISOString())
  const toDate = searchParams.to?.trim()
  if (toDate) baseQuery = baseQuery.lte('created_at', new Date(toDate + 'T23:59:59Z').toISOString())

  // Count (exact) for pagination
  let countQuery = supabase.from('service_requests').select('id', { count: 'exact', head: true })
  if (statusFilter) countQuery = countQuery.eq('status', statusFilter)
  if (bookingIdFilter) countQuery = countQuery.ilike('id', `%${bookingIdFilter}%`)
  if (customerFilter) countQuery = countQuery.ilike('profiles.full_name', `%${customerFilter}%`)
  if (fromDate) countQuery = countQuery.gte('created_at', new Date(fromDate + 'T00:00:00Z').toISOString())
  if (toDate) countQuery = countQuery.lte('created_at', new Date(toDate + 'T23:59:59Z').toISOString())
  const { count: totalCount } = await countQuery

  const start = (page - 1) * pageSize
  const end = start + pageSize - 1
  const { data: rawBookings } = await baseQuery.range(start, end)

  // Graceful handling for empty/error state
  const bookings: BookingRow[] = (rawBookings || []).map((b: any) => ({
    id: b.id,
    title: b.title,
    status: b.status,
    estimated_price: b.estimated_price,
    created_at: b.created_at,
    service_categories: null,
    customer_profile: b.profiles ? { full_name: b.profiles.full_name, email: b.profiles.email } : null,
    category_id: b.category_id
  })) as any

  // If we have category ids, fetch names (relationship missing FK so manual lookup)
  const categoryIds = Array.from(new Set(bookings.map((b: any) => b.category_id).filter(Boolean)))
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from('service_categories')
      .select('id,name')
      .in('id', categoryIds as string[])
    const catMap = new Map(categories?.map(c => [c.id, c.name]))
    for (const b of bookings as any[]) {
      if (b.category_id && catMap.has(b.category_id)) {
        b.service_categories = { name: catMap.get(b.category_id) }
      }
    }
  }

  // Apply category filter client-side after enrichment
  const filteredBookings = categoryFilter
    ? bookings.filter((b: any) => b.service_categories?.name?.toLowerCase().includes(categoryFilter.toLowerCase()))
    : bookings

  // Single pass stats aggregation (avoid repeated array scans)
  let totalBookings = 0
  let openBookings = 0
  let inProgressBookings = 0
  let completedBookings = 0
  let totalRevenue = 0

  for (const b of filteredBookings) {
    totalBookings++
    if (b.status === 'open') openBookings++
    else if (b.status === 'assigned') inProgressBookings++
    else if (b.status === 'completed') completedBookings++
    if (b.estimated_price) totalRevenue += Number(b.estimated_price)
  }

  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1
  const makePageLink = (p: number) => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (bookingIdFilter) params.set('bookingId', bookingIdFilter)
    if (customerFilter) params.set('customer', customerFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    params.set('page', p.toString())
    return `/admin/bookings?${params.toString()}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bookings Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor all service requests & orders</p>
        </div>
        <BookingsFilters />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Bookings</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalBookings}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Open</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{openBookings}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">In Progress</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{inProgressBookings}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{completedBookings}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Total Revenue</p>
            <p className="text-4xl font-bold mt-2">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-2">From {totalBookings} bookings</p>
          </div>
          <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
            <IndianRupee className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredBookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">#{b.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      {b.service_categories?.name && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-300">
                          <Package className="h-3 w-3" /> {b.service_categories.name}
                        </span>
                      )}
                      {b.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-white">{b.customer_profile?.full_name || '—'}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{b.customer_profile?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {b.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" /> Completed
                      </span>
                    ) : b.status === 'assigned' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <AlertCircle className="h-3 w-3" /> In Progress
                      </span>
                    ) : b.status === 'cancelled' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        <XCircle className="h-3 w-3" /> Cancelled
                      </span>
                    ) : b.status === 'open' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <Clock className="h-3 w-3" /> Open
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        <Clock className="h-3 w-3" /> {b.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 dark:text-white">₹{b.estimated_price ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      {new Date(b.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                    >
                      Details <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!filteredBookings || filteredBookings.length === 0) && (
            <div className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No bookings found</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 text-sm">
          <div className="text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages} • {totalCount || 0} total
          </div>
          <div className="flex gap-2">
            <Link href={makePageLink(Math.max(1, page - 1))} className={`px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}>Prev</Link>
            <Link href={makePageLink(Math.min(totalPages, page + 1))} className={`px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}>Next</Link>
            <Link href={`/admin/bookings/export?${new URLSearchParams(Object.entries(searchParams).filter(([,v])=>v) as [string, string][]).toString()}`} className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors">Export CSV</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

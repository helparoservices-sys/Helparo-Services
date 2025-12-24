import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  UserCheck,
  ShoppingCart,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'

// Revalidate every 60 seconds to reduce unnecessary DB calls
export const revalidate = 60
export const dynamic = 'force-dynamic' // Required for auth

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch dashboard stats with optimized queries
  // Use Promise.all for parallel execution
  const [
    { count: totalUsers },
    { count: totalCustomers },
    { count: totalHelpers },
    { count: activeUsers },
    { count: suspendedUsers },
    { count: bannedUsers },
    { count: totalBookings },
    { count: activeBookings },
    { data: recentBookings },
    { count: pendingVerifications },
    { count: supportTickets },
    { data: todayBookings }
  ] = await Promise.all([
    // Total Users = Customers + Helpers (not including admins)
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['customer', 'helper']),
    
    // Total Customers
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer'),
    
    // Total Helpers
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'helper'),
    
    // Active users (status = active)
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['customer', 'helper'])
      .eq('status', 'active'),
    
    // Suspended users (status = suspended)
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['customer', 'helper'])
      .eq('status', 'suspended'),
    
    // Banned users
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['customer', 'helper'])
      .eq('is_banned', true),
    
    // Total bookings
    supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true }),
    
    // Active bookings: open and assigned (not completed or cancelled)
    supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'assigned']),
    
    // Recent bookings
    supabase
      .from('service_requests')
      .select(`
        id,
        status,
        created_at,
        title,
        description,
        profiles!service_requests_customer_id_fkey (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // Pending verifications (helper_profiles with pending verification_status)
    supabase
      .from('helper_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    
    // Active support tickets (open, assigned, in_progress)
    supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'assigned', 'in_progress']),
    
    // Today's revenue (from released escrows today, not estimated prices)
    (() => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return supabase
        .from('escrows')
        .select('amount')
        .eq('status', 'released')
        .gte('released_at', today.toISOString())
    })()
  ])

  const todayRevenue = todayBookings?.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0) || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Total Users */}
        <Link href="/admin/users" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Link>

        {/* Active Users */}
        <Link href="/admin/users?status=active" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Users</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{activeUsers || 0}</p>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Link>

        {/* Suspended Users */}
        <Link href="/admin/users?status=suspended" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Suspended</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{suspendedUsers || 0}</p>
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">Suspended</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Link>

        {/* Banned Users */}
        <Link href="/admin/users?status=banned" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Banned Users</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{bannedUsers || 0}</p>
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600 font-medium">Banned</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Link>

        {/* Total Customers */}
        <Link href="/admin/users?role=customer" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Customers</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalCustomers || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Link>

        {/* Total Helpers */}
        <Link href="/admin/users?role=helper" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Helpers</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalHelpers || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Link>

        {/* Total Bookings */}
        <Link href="/admin/bookings" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Bookings</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalBookings || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Link>

        {/* Active Bookings */}
        <Link href="/admin/bookings?status=assigned" className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Bookings</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{activeBookings || 0}</p>
              <div className="flex items-center gap-1 mt-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">Live now</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Bookings</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Latest service requests on the platform</p>
        </div>
        <div className="p-6">
          {recentBookings && recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-4">
                    {booking.status === 'draft' && <AlertCircle className="h-5 w-5 text-gray-600" />}
                    {booking.status === 'open' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                    {booking.status === 'assigned' && <Clock className="h-5 w-5 text-blue-600" />}
                    {booking.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {booking.status === 'cancelled' && <AlertCircle className="h-5 w-5 text-red-600" />}
                    
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {booking.profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {booking.title || 'Service Request'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
                      booking.status === 'open' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      booking.status === 'assigned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      booking.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {booking.status}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No recent bookings</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <h3 className="font-semibold text-lg mb-2">Pending Verifications</h3>
          <p className="text-2xl font-bold">{pendingVerifications || 0}</p>
          <p className="text-sm opacity-90 mt-2">Helpers awaiting approval</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <h3 className="font-semibold text-lg mb-2">Support Tickets</h3>
          <p className="text-2xl font-bold">{supportTickets || 0}</p>
          <p className="text-sm opacity-90 mt-2">Active support requests</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <h3 className="font-semibold text-lg mb-2">Revenue (Today)</h3>
          <p className="text-2xl font-bold">₹{todayRevenue.toLocaleString()}</p>
          <p className="text-sm opacity-90 mt-2">Platform earnings</p>
        </div>
      </div>
    </div>
  )
}
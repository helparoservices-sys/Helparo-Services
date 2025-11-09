'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, 
  ShoppingBag, Star, Award, Ban, Check, Edit, AlertCircle,
  TrendingUp, Package, CheckCircle, Clock, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loader'
import { supabase } from '@/lib/supabase/client'

interface UserDetails {
  id: string
  full_name: string
  email: string
  phone: string
  role: 'customer' | 'helper' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  is_banned: boolean
  ban_reason: string | null
  profile_image?: string
  joined_date: string
  address?: string
  pincode?: string
  total_bookings: number
  total_spent: number
  rating?: number
  bio?: string
  // Helper specific
  total_earnings?: number
  total_jobs_completed?: number
  service_categories?: string[]
  badges?: Array<{ name: string; icon_url?: string }>
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])

  useEffect(() => {
    fetchUserDetails()
  }, [params.id])

  const fetchUserDetails = async () => {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (profileError) throw profileError

      let userDetails: UserDetails = {
        id: profile.id,
        full_name: profile.full_name || 'N/A',
        email: profile.email || 'N/A',
        phone: profile.phone || 'N/A',
        role: profile.role,
        status: profile.status || 'active',
        is_banned: profile.is_banned || false,
        ban_reason: profile.ban_reason,
        profile_image: profile.profile_image,
        joined_date: profile.created_at,
        address: profile.address,
        pincode: profile.pincode,
        bio: profile.bio,
        total_bookings: 0,
        total_spent: 0
      }

      // Role-specific data fetching
      if (profile.role === 'customer') {
        // Fetch customer bookings stats
        const { data: bookings } = await supabase
          .from('service_requests')
          .select('id, final_price, estimated_price, status, created_at, service_categories!inner(name)')
          .eq('customer_id', params.id)
          .order('created_at', { ascending: false })
          .limit(5)

        const totalBookings = bookings?.length || 0
        const totalSpent = bookings?.filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.final_price || b.estimated_price || 0), 0) || 0

        userDetails.total_bookings = totalBookings
        userDetails.total_spent = totalSpent
        setRecentBookings(bookings || [])

      } else if (profile.role === 'helper') {
        // Fetch helper profile and stats
        const { data: helperProfile } = await supabase
          .from('helper_profiles')
          .select('*, service_categories')
          .eq('user_id', params.id)
          .single()

        // Fetch helper jobs
        const { data: jobs } = await supabase
          .from('service_requests')
          .select('id, final_price, status, created_at')
          .eq('assigned_helper_id', params.id)

        const completedJobs = jobs?.filter(j => j.status === 'completed') || []
        const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.final_price || 0), 0)

        // Fetch helper rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('helper_id', params.id)

        const rating = reviews && reviews.length > 0
          ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
          : 0

        // Fetch badges
        const { data: helperBadges } = await supabase
          .from('helper_badges')
          .select('badge_definitions(name, icon_url)')
          .eq('helper_id', params.id)

        userDetails.total_jobs_completed = completedJobs.length
        userDetails.total_earnings = totalEarnings
        userDetails.rating = rating
        userDetails.service_categories = helperProfile?.service_categories || []
        userDetails.badges = helperBadges?.map((b: any) => b.badge_definitions).filter(Boolean) || []
        setRecentBookings(jobs || [])
      }

      setUser(userDetails)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    setActionLoading('status')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', params.id)

      if (error) throw error

      setUser(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (error) {
      console.error('Error updating user status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBan = async () => {
    setActionLoading('ban')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !user?.is_banned })
        .eq('id', params.id)

      if (error) throw error

      setUser(prev => prev ? { ...prev, is_banned: !prev.is_banned } : null)
    } catch (error) {
      console.error('Error banning user:', error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <PageLoader />

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">User Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>

        {/* User Profile Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                {user.full_name.charAt(0)}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                    {user.full_name}
                    {user.is_banned && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <Ban className="inline h-3 w-3 mr-1" />
                        Banned
                      </span>
                    )}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : user.role === 'helper'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : user.status === 'suspended'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  <CheckCircle className="inline h-3 w-3 mr-1" />
                  {user.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                    {user.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">{user.phone}</span>
                </div>
                {user.address && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4" />
                    {user.address} {user.pincode && `- ${user.pincode}`}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(user.joined_date).toLocaleDateString()}
                </div>
              </div>

              {user.bio && (
                <p className="text-slate-600 dark:text-slate-400 text-sm">{user.bio}</p>
              )}

              {user.ban_reason && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-900 dark:text-red-300">Ban Reason:</p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">{user.ban_reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Actions */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Account Actions</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateUserStatus('active')}
                disabled={user.status === 'active' || actionLoading === 'status'}
                className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              >
                {actionLoading === 'status' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateUserStatus('suspended')}
                disabled={user.status === 'suspended' || actionLoading === 'status'}
                className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
              >
                {actionLoading === 'status' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4" />
                )}
                Suspend
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBan}
                disabled={actionLoading === 'ban'}
                className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                {actionLoading === 'ban' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                {user.is_banned ? 'Unban' : 'Ban'}
              </Button>
            </div>
          </div>
        </div>

        {/* Role-Based Stats Section */}
        {user.role === 'customer' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Bookings</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{user.total_bookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Spent</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{user.total_spent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            {recentBookings.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Bookings</h2>
                <div className="space-y-3">
                  {recentBookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {booking.service_categories?.name || 'Service'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          booking.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {booking.status}
                        </span>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                          ₹{(booking.final_price || booking.estimated_price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {user.role === 'helper' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Jobs Completed</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{user.total_jobs_completed || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Earnings</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{(user.total_earnings || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Rating</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{user.rating || 0}/5.0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Categories */}
            {user.service_categories && user.service_categories.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Service Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {user.service_categories.map((category, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            {user.badges && user.badges.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Badges & Achievements</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {user.badges.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Admin - Only Basic Info, No Stats */}
        {user.role === 'admin' && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admin Account</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This is an administrator account with full system access. No additional statistics are available for admin accounts.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

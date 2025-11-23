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
  const [error, setError] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])

  useEffect(() => {
    fetchUserDetails()
  }, [params.id])

  const fetchUserDetails = async () => {
    try {
      // Optimized single query with all user data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          helper_profiles (
            service_categories,
            hourly_rate,
            experience_years,
            verification_status,
            is_approved,
            address,
            pincode
          )
        `)
        .eq('id', params.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw profileError
      }

      if (!profile) {
        setUser(null)
        setLoading(false)
        return
      }

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
        address: profile.helper_profiles?.[0]?.address,
        pincode: profile.helper_profiles?.[0]?.pincode,
        bio: undefined,
        total_bookings: 0,
        total_spent: 0
      }

      // Parallel queries for role-specific data
      const queries: Promise<any>[] = []

      if (profile.role === 'customer') {
        // Customer bookings query
        queries.push(
          supabase
            .from('service_requests')
            .select('id, estimated_price, status, created_at, title, category_id, service_categories!inner(name)')
            .eq('customer_id', params.id)
            .order('created_at', { ascending: false })
            .limit(5)
        )
      } else if (profile.role === 'helper') {
        // Helper jobs query
        queries.push(
          supabase
            .from('service_requests')
            .select('id, estimated_price, status, created_at, title')
            .eq('assigned_helper_id', params.id)
            .order('created_at', { ascending: false })
            .limit(5)
        )

        // Helper reviews query
        queries.push(
          supabase
            .from('reviews')
            .select('rating')
            .eq('helper_id', params.id)
        )

        // Helper badges query
        queries.push(
          supabase
            .from('helper_badges')
            .select('badge_definitions(name, icon_url)')
            .eq('helper_id', params.id)
        )
      }

      const results = await Promise.all(queries)

      if (profile.role === 'customer') {
        const { data: bookings } = results[0]
        const totalBookings = bookings?.length || 0
        const totalSpent = bookings?.filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (Number(b.estimated_price) || 0), 0) || 0

        userDetails.total_bookings = totalBookings
        userDetails.total_spent = totalSpent
        setRecentBookings(bookings || [])

      } else if (profile.role === 'helper') {
        const { data: jobs } = results[0]
        const { data: reviews } = results[1]
        const { data: helperBadges } = results[2]

        const completedJobs = jobs?.filter(j => j.status === 'completed') || []
        const totalEarnings = completedJobs.reduce((sum, j) => sum + (Number(j.estimated_price) || 0), 0)

        const rating = reviews && reviews.length > 0
          ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
          : 0

        userDetails.total_jobs_completed = completedJobs.length
        userDetails.total_earnings = totalEarnings
        userDetails.rating = rating
        userDetails.service_categories = profile.helper_profiles?.[0]?.service_categories || []
        userDetails.badges = helperBadges?.map((b: any) => b.badge_definitions).filter(Boolean) || []
        setRecentBookings(jobs || [])
      }

      setUser(userDetails)
    } catch (error: any) {
      console.error('Error fetching user details:', error)
      setError(error.message || 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    if (user?.status === newStatus) return
    
    setActionLoading('status')
    setError('')
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (updateError) {
        console.error('Status update error:', updateError)
        throw new Error(updateError.message)
      }

      setUser(prev => prev ? { ...prev, status: newStatus } : null)
      
      // Show success (you can add a toast notification here)
      console.log(`User status updated to ${newStatus}`)
    } catch (error: any) {
      console.error('Error updating user status:', error)
      setError(error.message || 'Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBan = async () => {
    if (!user) return
    
    const shouldBan = !user.is_banned
    setActionLoading('ban')
    setError('')
    
    try {
      if (shouldBan) {
        // Banning - require confirmation
        const reason = prompt('Enter ban reason (required):')
        if (!reason || reason.trim().length < 10) {
          setError('Ban reason must be at least 10 characters')
          setActionLoading(null)
          return
        }

        const duration = prompt('Enter ban duration in days (0 for permanent):')
        const durationDays = parseInt(duration || '0')
        
        if (isNaN(durationDays) || durationDays < 0) {
          setError('Invalid duration')
          setActionLoading(null)
          return
        }

        let ban_expires_at = null
        if (durationDays > 0) {
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + durationDays)
          ban_expires_at = expiryDate.toISOString()
        }

        const { error: banError } = await supabase
          .from('profiles')
          .update({ 
            is_banned: true,
            ban_reason: reason.trim(),
            banned_at: new Date().toISOString(),
            ban_expires_at: ban_expires_at,
            status: 'suspended', // Also suspend the account
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)

        if (banError) {
          console.error('Ban error:', banError)
          throw new Error(banError.message)
        }

        setUser(prev => prev ? { 
          ...prev, 
          is_banned: true, 
          ban_reason: reason.trim(),
          status: 'suspended'
        } : null)
        
        console.log('User banned successfully')
      } else {
        // Unbanning
        const { error: unbanError } = await supabase
          .from('profiles')
          .update({ 
            is_banned: false,
            ban_reason: null,
            banned_at: null,
            banned_by: null,
            ban_expires_at: null,
            status: 'active', // Reactivate on unban
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)

        if (unbanError) {
          console.error('Unban error:', unbanError)
          throw new Error(unbanError.message)
        }

        setUser(prev => prev ? { 
          ...prev, 
          is_banned: false, 
          ban_reason: null,
          status: 'active'
        } : null)
        
        console.log('User unbanned successfully')
      }
    } catch (error: any) {
      console.error('Error in ban/unban operation:', error)
      setError(error.message || 'Failed to update ban status')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">Loading user details...</p>
        </div>
      </div>
    )
  }

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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

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

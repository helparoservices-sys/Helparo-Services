'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Eye,
  Play
} from 'lucide-react'

interface Booking {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  assigned_at: string | null
  job_completed_at: string | null
  service_address: string | null
  service_city: string | null
  customer_profile?: {
    full_name: string
    avatar_url: string | null
    phone: string | null
  } | null
  applications?: {
    bid_amount: number | null
    status: string
  }[]
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'bg-blue-500', icon: Clock },
  assigned: { label: 'In Progress', color: 'bg-yellow-500', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
}

export default function HelperBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  // Set up realtime subscription for job updates
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('helper-bookings-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `assigned_helper_id=eq.${userId}`
        },
        (payload) => {
          console.log('📡 Realtime update for helper bookings:', payload)
          loadBookings() // Reload bookings when any assigned job changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function loadBookings() {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    if (!user) return

    // Set userId for realtime subscription
    if (!userId) setUserId(user.id)

    // Get bookings where helper is assigned
    const { data: assignedBookings, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        assigned_at,
        job_completed_at,
        service_address,
        service_city,
        customer_id,
        customer_profile:customer_id (
          full_name,
          avatar_url,
          phone
        ),
        applications:request_applications!request_id (
          bid_amount,
          status
        )
      `)
      .eq('assigned_helper_id', user.id)
      .in('status', ['open', 'assigned', 'completed', 'cancelled'])
      .order('created_at', { ascending: false })

    console.log('📋 Loaded bookings:', assignedBookings?.length, 'for user:', user.id)
    if (error) {
      console.error('❌ Error loading bookings:', error)
    }

    if (!error && assignedBookings) {
      // Transform the data to match the Booking interface
      const transformedBookings = assignedBookings.map((booking: typeof assignedBookings[0]) => ({
        ...booking,
        customer_profile: Array.isArray(booking.customer_profile) && booking.customer_profile.length > 0
          ? booking.customer_profile[0]
          : null
      }))
      setBookings(transformedBookings as Booking[])
    }
    setLoading(false)
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    if (filter === 'active') return ['open', 'assigned'].includes(booking.status)
    if (filter === 'completed') return booking.status === 'completed'
    if (filter === 'cancelled') return booking.status === 'cancelled'
    return true
  })

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => ['open', 'assigned'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Jobs
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your assigned service jobs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Jobs</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active Jobs</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.active}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All ({stats.total})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
            size="sm"
          >
            Active ({stats.active})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            size="sm"
          >
            Completed ({stats.completed})
          </Button>
          <Button
            variant={filter === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setFilter('cancelled')}
            size="sm"
            className={filter === 'cancelled' ? 'bg-red-500 hover:bg-red-600' : 'text-red-600 border-red-200 hover:bg-red-50'}
          >
            Cancelled ({stats.cancelled})
          </Button>
        </div>

        {/* Jobs List */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No jobs found</h3>
              <p className="text-slate-500 mb-4">
                {filter === 'all' 
                  ? "You haven't been assigned to any jobs yet" 
                  : `No ${filter} jobs`}
              </p>
              {filter === 'all' && (
                <Link href="/helper/requests">
                  <Button>Browse Available Requests</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const config = statusConfig[booking.status] || statusConfig.assigned
              const StatusIcon = config.icon
              const myBid = booking.applications?.[0]

              return (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{booking.title}</h3>
                              <Badge className={`${config.color} text-white`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                              {booking.description}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {booking.service_address && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <MapPin className="w-4 h-4" />
                                  <span>{booking.service_address}, {booking.service_city}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4" />
                                <span>Assigned {booking.assigned_at ? new Date(booking.assigned_at).toLocaleDateString() : 'N/A'}</span>
                              </div>

                              {myBid?.bid_amount && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <DollarSign className="w-4 h-4" />
                                  <span>Your Bid: ₹{myBid.bid_amount}</span>
                                </div>
                              )}

                              {booking.customer_profile && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <User className="w-4 h-4" />
                                  <span>{booking.customer_profile.full_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link href={`/helper/jobs/${booking.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Job
                          </Button>
                        </Link>
                        
                        <Link href={`/helper/requests/${booking.id}/chat`}>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                        </Link>

                        {booking.status === 'assigned' && (
                          <Link href={`/helper/jobs/${booking.id}`}>
                            <Button variant="outline" size="sm" className="text-green-600 border-green-600">
                              <Play className="w-4 h-4 mr-1" />
                              Continue Job
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

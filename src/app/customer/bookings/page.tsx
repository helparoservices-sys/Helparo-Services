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
  AlertCircle,
  MessageSquare,
  Star,
  Eye,
  Plus
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

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  open: { label: 'Finding Helper', color: 'bg-blue-500', icon: AlertCircle },
  assigned: { label: 'Assigned', color: 'bg-yellow-500', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-purple-500', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
}

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')

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
        created_at,
        assigned_at,
        job_completed_at,
        assigned_helper_id,
        service_address,
        service_city,
        budget_min,
        budget_max,
        helper_profile:assigned_helper_id (
          full_name,
          avatar_url,
          phone
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && bookingsData) {
      // Transform the data to match the Booking interface
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
    if (filter === 'active') return ['open', 'assigned', 'in_progress'].includes(booking.status)
    if (filter === 'completed') return booking.status === 'completed'
    if (filter === 'cancelled') return booking.status === 'cancelled'
    return true
  })

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => ['open', 'assigned', 'in_progress'].includes(b.status)).length,
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Bookings
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track and manage your service bookings
            </p>
          </div>
          <Link href="/customer/requests/new">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Bookings</p>
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
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
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

          <Card className="bg-white dark:bg-slate-800 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
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
          >
            Cancelled ({stats.cancelled})
          </Button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No bookings found</h3>
              <p className="text-slate-500 mb-4">
                {filter === 'all' 
                  ? "You haven't created any bookings yet" 
                  : `No ${filter} bookings`}
              </p>
              {filter === 'all' && (
                <Link href="/customer/requests/new">
                  <Button>Create Your First Booking</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const config = statusConfig[booking.status] || statusConfig.open
              const StatusIcon = config.icon

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
                                <span>Created {new Date(booking.created_at).toLocaleDateString()}</span>
                              </div>

                              {(booking.budget_min || booking.budget_max) && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <DollarSign className="w-4 h-4" />
                                  <span>
                                    Budget: ₹{booking.budget_min || 0} - ₹{booking.budget_max || 0}
                                  </span>
                                </div>
                              )}

                              {booking.assigned_helper_id && booking.helper_profile && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <User className="w-4 h-4" />
                                  <span>{booking.helper_profile.full_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link href={`/customer/requests/${booking.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                        
                        {booking.assigned_helper_id && (
                          <Link href={`/customer/requests/${booking.id}/chat`}>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Chat
                            </Button>
                          </Link>
                        )}

                        {booking.status === 'completed' && (
                          <Link href={`/customer/requests/${booking.id}/review`}>
                            <Button variant="outline" size="sm">
                              <Star className="w-4 h-4 mr-1" />
                              Review
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

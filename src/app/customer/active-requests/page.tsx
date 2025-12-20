'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Radio,
  MapPin,
  User,
  ArrowRight,
  Loader2,
  Navigation,
  Timer,
  CheckCircle2,
  Package,
  Wrench,
  Sparkles,
  Clock
} from 'lucide-react'

interface ActiveRequest {
  id: string
  title: string
  description: string
  status: string
  broadcast_status: string
  service_address: string
  estimated_price: number
  created_at: string
  urgency_level: string
  images: string[]
  service_type_details: {
    estimated_duration?: number
    helper_brings?: string[]
    customer_provides?: string[]
    work_overview?: string
    materials_needed?: string[]
    confidence?: number
  }
  category: {
    name: string
    icon: string
  } | null
  assigned_helper: {
    profile: {
      full_name: string
      avatar_url: string | null
    }
  } | null
}

export default function ActiveRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ActiveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadActiveRequests()
    
    // Real-time subscription
    const channel = supabase
      .channel('active-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_requests'
      }, () => loadActiveRequests())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadActiveRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          title,
          description,
          status,
          broadcast_status,
          service_address,
          estimated_price,
          created_at,
          urgency_level,
          images,
          service_type_details,
          category:category_id (name, icon)
        `)
        .eq('customer_id', user.id)
        .in('broadcast_status', ['broadcasting', 'accepted', 'on_way', 'arrived', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(100) // 🟢 SAFE: Customers rarely have >100 concurrent active requests

      if (!error && data) {
        // Fetch assigned helpers for each request
        const requestsWithHelpers = await Promise.all(
          data.map(async (req) => {
            const category = Array.isArray(req.category) ? req.category[0] : req.category
            
            // Fetch helper if assigned
            let assigned_helper = null
            if (['accepted', 'on_way', 'arrived', 'in_progress'].includes(req.broadcast_status)) {
              const { data: fullReq } = await supabase
                .from('service_requests')
                .select('assigned_helper_id')
                .eq('id', req.id)
                .single()
              
              if (fullReq?.assigned_helper_id) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name, avatar_url')
                  .eq('id', fullReq.assigned_helper_id)
                  .single()
                
                if (profile) {
                  assigned_helper = { profile }
                }
              }
            }

            return {
              ...req,
              category,
              assigned_helper,
              service_type_details: req.service_type_details || {}
            }
          })
        )

        setRequests(requestsWithHelpers)
      }
    } catch (err) {
      console.error('Error loading active requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'broadcasting':
        return { 
          label: 'Searching', 
          color: 'bg-amber-500', 
          bgColor: 'bg-amber-50',
          icon: Radio,
          description: 'Looking for helpers nearby'
        }
      case 'accepted':
        return { 
          label: 'Assigned', 
          color: 'bg-teal-500', 
          bgColor: 'bg-teal-50',
          icon: User,
          description: 'Helper is preparing'
        }
      case 'on_way':
        return { 
          label: 'On the Way', 
          color: 'bg-blue-500', 
          bgColor: 'bg-blue-50',
          icon: Navigation,
          description: 'Helper is coming to you'
        }
      case 'arrived':
        return { 
          label: 'Arrived', 
          color: 'bg-purple-500', 
          bgColor: 'bg-purple-50',
          icon: MapPin,
          description: 'Helper has arrived'
        }
      case 'in_progress':
        return { 
          label: 'Working', 
          color: 'bg-indigo-500', 
          bgColor: 'bg-indigo-50',
          icon: Wrench,
          description: 'Service in progress'
        }
      default:
        return { 
          label: 'Active', 
          color: 'bg-gray-500', 
          bgColor: 'bg-gray-50',
          icon: Clock,
          description: 'Processing'
        }
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const created = new Date(date)
    const diffMins = Math.floor((now.getTime() - created.getTime()) / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-xl shadow-teal-500/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading active requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Active Requests</h1>
            <p className="text-sm text-gray-500">Track your ongoing service requests</p>
          </div>
        </div>
        {requests.length > 0 && (
          <div className="mt-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl px-4 py-2 inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="font-semibold">{requests.length} Active</span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {requests.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Requests</h2>
          <p className="text-gray-500 mb-6">You don&apos;t have any ongoing service requests</p>
          <Button 
            onClick={() => router.push('/customer/requests/ai')}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl px-6 h-12"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Book a Service
          </Button>
        </div>
      )}

      {/* Active Requests List */}
      <div className="space-y-4">
        {requests.map((request) => {
          const statusInfo = getStatusInfo(request.broadcast_status)
          const StatusIcon = statusInfo.icon

          return (
            <div
              key={request.id}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem('tracking_status', request.broadcast_status)
                }
                router.push(`/customer/requests/${request.id}/track`)
              }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all group"
            >
              {/* Status Banner */}
              <div className={`${statusInfo.color} px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4 text-white" />
                  <span className="font-bold text-white text-sm">{statusInfo.label}</span>
                  <span className="text-white/70 text-xs">• {statusInfo.description}</span>
                </div>
                {request.broadcast_status === 'broadcasting' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                )}
              </div>

              <div className="p-4">
                {/* Top Row - Category & Price */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {request.images && request.images[0] ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={request.images[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-6 h-6 text-teal-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{request.category?.name || 'Service'}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(request.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-teal-600">₹{request.estimated_price}</p>
                    {request.service_type_details?.estimated_duration && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        <Timer className="w-3 h-3" />
                        ~{request.service_type_details.estimated_duration} mins
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{request.service_address}</span>
                </div>

                {/* Helper Info (if assigned) */}
                {request.assigned_helper && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {request.assigned_helper.profile?.avatar_url ? (
                        <img src={request.assigned_helper.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{request.assigned_helper.profile?.full_name}</p>
                      <p className="text-xs text-gray-500">Your assigned helper</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                )}

                {/* Quick Info Pills */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {request.service_type_details?.materials_needed && request.service_type_details.materials_needed.length > 0 && (
                    <div className="bg-orange-50 text-orange-700 rounded-lg px-2.5 py-1 text-xs font-medium flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {request.service_type_details.materials_needed.length} materials
                    </div>
                  )}
                  {request.images && request.images.length > 0 && (
                    <div className="bg-blue-50 text-blue-700 rounded-lg px-2.5 py-1 text-xs font-medium">
                      {request.images.length} photos
                    </div>
                  )}
                  {request.urgency_level === 'urgent' && (
                    <div className="bg-red-50 text-red-700 rounded-lg px-2.5 py-1 text-xs font-medium">
                      Urgent
                    </div>
                  )}
                </div>

                {/* View Details Button */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Tap to view full details</span>
                  <div className="flex items-center gap-1 text-teal-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Track Now
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

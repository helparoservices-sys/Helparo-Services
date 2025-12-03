'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { releaseEscrow } from '@/app/actions/payments'
import { PaymentSafetyInfo } from '@/components/trust-badges'
import ChatWindow from '@/components/chat-window'
import { 
  MapPin, Clock, DollarSign, CheckCircle2, XCircle, 
  Phone, MessageSquare, Star, AlertCircle, Loader2,
  Calendar, User, Award
} from 'lucide-react'

interface RequestRow { 
  id: string
  title: string
  description: string
  status: string
  created_at: string
  assigned_helper_id: string | null
  service_address?: string
  service_city?: string
  service_location_lat?: number
  service_location_lng?: number
  budget_min?: number
  budget_max?: number
}

interface ApplicationRow { 
  id: string
  helper_id: string
  status: string
  created_at: string
  bid_amount?: number
  estimated_duration_hours?: number
  availability_note?: string
  profiles?: {
    full_name: string
    avatar_url: string | null
    phone: string | null
  }
}

interface HelperProfile {
  id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  open: { label: 'Open', color: 'bg-blue-500', icon: AlertCircle },
  assigned: { label: 'Assigned', color: 'bg-yellow-500', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-purple-500', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const requestId = params.id
  const supabase = createClient()

  const [request, setRequest] = useState<RequestRow | null>(null)
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [assignedHelper, setAssignedHelper] = useState<HelperProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewed, setReviewed] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'applications' | 'chat'>('details')

  useEffect(() => {
    loadData()
    subscribeToUpdates()
  }, [requestId])

  async function loadData() {
    setLoading(true)
    setError('')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { 
      setError('Not authenticated')
      setLoading(false)
      return 
    }
    setCurrentUser(user)

    const { data: r, error: rErr } = await supabase
      .from('service_requests')
      .select(`
        id, 
        title, 
        description, 
        status, 
        assigned_helper_id, 
        created_at,
        service_address,
        service_city,
        service_location_lat,
        service_location_lng,
        budget_min,
        budget_max
      `)
      .eq('id', requestId)
      .maybeSingle()
    
    if (rErr || !r) { 
      setError('Request not found')
      setLoading(false)
      return 
    }
    setRequest(r as RequestRow)

    const { data: apps } = await supabase
      .from('request_applications')
      .select(`
        id, 
        helper_id, 
        status, 
        created_at,
        bid_amount,
        estimated_duration_hours,
        availability_note,
        profiles:helper_id (
          full_name,
          avatar_url,
          phone
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
    
    setApplications((apps || []) as any)

    // Load assigned helper details
    if (r.assigned_helper_id) {
      const { data: helper } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, phone')
        .eq('id', r.assigned_helper_id)
        .single()
      
      if (helper) {
        setAssignedHelper(helper as HelperProfile)
      }

      // Check if reviewed
      const { data: rev } = await supabase
        .from('reviews')
        .select('id')
        .eq('request_id', requestId)
        .eq('reviewer_id', user.id)
        .eq('reviewee_id', r.assigned_helper_id)
        .maybeSingle()
      
      if (rev) {
        setReviewed(true)
      }
    }

    setLoading(false)
  }

  function subscribeToUpdates() {
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${requestId}`,
        },
        () => {
          loadData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_applications',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function assignHelper(applicationId: string) {
    setError('')
    const { error: rpcErr } = await supabase.rpc('accept_application', { 
      p_request_id: requestId, 
      p_application_id: applicationId 
    })
    if (rpcErr) { 
      setError(rpcErr.message)
      return 
    }
    loadData()
  }

  async function markCompleted() {
    setError('')
    const { error: updErr } = await supabase
      .from('service_requests')
      .update({ status: 'completed' })
      .eq('id', requestId)
    
    if (updErr) { 
      setError(updErr.message)
      return 
    }
    
    // Auto-release escrow
    const formData = new FormData()
    formData.append('requestId', requestId)
    const releaseResult = await releaseEscrow(formData)
    if ('error' in releaseResult && releaseResult.error) {
      setError(`Request completed but escrow release failed: ${releaseResult.error}`)
    }
    
    loadData()
  }

  async function cancelRequest() {
    if (!confirm('Are you sure you want to cancel this request?')) return
    
    setError('')
    const { error: updErr } = await supabase
      .from('service_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
    
    if (updErr) { 
      setError(updErr.message)
      return 
    }
    
    loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-center text-red-600">{error || 'Request not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock
  const statusColor = statusConfig[request.status as keyof typeof statusConfig]?.color || 'bg-gray-500'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {request.title}
            </h1>
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white ${statusColor}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(request.created_at).toLocaleDateString()}
            </div>
            {request.service_city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {request.service_city}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'applications'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Applications ({applications.length})
          </button>
          {assignedHelper && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === 'chat'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Chat
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {request.description}
                    </p>
                  </CardContent>
                </Card>

                {request.service_address && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Service Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 dark:text-slate-300">
                        {request.service_address}
                      </p>
                      {request.service_location_lat && request.service_location_lng && (
                        <p className="text-sm text-slate-500 mt-2">
                          Coordinates: {request.service_location_lat.toFixed(6)}, {request.service_location_lng.toFixed(6)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {request.budget_min && request.budget_max && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Budget Range
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ₹{request.budget_min.toLocaleString()} - ₹{request.budget_max.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <PaymentSafetyInfo />
              </>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Helper Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        No applications yet. Helpers will be notified about your request.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-400 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                                {(app.profiles as any)?.full_name?.[0] || 'H'}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                  {(app.profiles as any)?.full_name || 'Helper'}
                                </h3>
                                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mt-1">
                                  {app.bid_amount && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      Bid: ₹{app.bid_amount.toLocaleString()}
                                    </div>
                                  )}
                                  {app.estimated_duration_hours && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Est. {app.estimated_duration_hours}h
                                    </div>
                                  )}
                                  {app.availability_note && (
                                    <div className="text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                      {app.availability_note}
                                    </div>
                                  )}
                                  <div className="text-xs text-slate-500">
                                    Applied {new Date(app.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {request.status === 'open' && app.status === 'applied' && (
                              <Button
                                size="sm"
                                onClick={() => assignHelper(app.id)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600"
                              >
                                Assign
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && assignedHelper && currentUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat with {assignedHelper.full_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ChatWindow
                    requestId={requestId}
                    currentUserId={currentUser.id}
                    otherUser={{
                      id: assignedHelper.id,
                      name: assignedHelper.full_name,
                      avatar: assignedHelper.avatar_url,
                      role: 'helper'
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned Helper */}
            {assignedHelper && (
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Helper</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                      {assignedHelper.full_name[0]}
                    </div>
                    <h3 className="font-semibold text-lg">{assignedHelper.full_name}</h3>
                    {assignedHelper.phone && (
                      <a
                        href={`tel:${assignedHelper.phone}`}
                        className="flex items-center justify-center gap-2 mt-3 text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="h-4 w-4" />
                        {assignedHelper.phone}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(request.status === 'assigned' || request.status === 'in_progress') && (
                  <Button
                    onClick={markCompleted}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}

                {request.status === 'completed' && !reviewed && (
                  <Button
                    onClick={() => router.push(`/customer/requests/${request.id}/review`)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Leave a Review
                  </Button>
                )}

                {request.status !== 'completed' && request.status !== 'cancelled' && (
                  <Button
                    onClick={cancelRequest}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Request
                  </Button>
                )}

                <Button
                  onClick={() => router.push('/customer/requests')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Requests
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

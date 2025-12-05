'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Clock, 
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle,
  XCircle,
  Target,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getHelperServiceRequests, submitBid, withdrawBid } from '@/app/actions/service-requests'
import { VerificationGate } from '@/components/helper/verification-gate'
import { createClient } from '@/lib/supabase/client'

interface ServiceRequest {
  id: string
  title: string
  description: string
  category: string
  location_address: string
  scheduled_time: string | null
  pricing_type: string
  budget_min: number | null
  budget_max: number | null
  status: string
  created_at: string
  customer_name: string
  distance: number | null
  bid_count: number
  my_bid: {
    id: string
    amount: number
    status: string
    message: string
  } | null
}

export default function HelperRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [bidAmount, setBidAmount] = useState<Record<string, string>>({})
  const [bidMessage, setBidMessage] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    checkVerification()
  }, [])

  useEffect(() => {
    if (isVerified) {
      loadRequests()
    }
  }, [isVerified])

  useEffect(() => {
    filterRequests()
  }, [requests, searchQuery, categoryFilter, statusFilter])

  const checkVerification = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setCheckingVerification(false)
      return
    }

    const { data: profile } = await supabase
      .from('helper_profiles')
      .select('is_approved, verification_status')
      .eq('user_id', user.id)
      .single()

    setIsVerified(profile?.is_approved === true || false)
    setCheckingVerification(false)
  }

  const loadRequests = async () => {
    setLoading(true)
    console.log('🔍 Fetching service requests...')
    const result = await getHelperServiceRequests()
    
    console.log('📦 Result from getHelperServiceRequests:', result)
    
    if ('error' in result) {
      console.error('❌ Error loading requests:', result.error)
      toast.error(result.error || 'Failed to load requests')
      setRequests([])
    } else if ('requests' in result) {
      console.log('✅ Requests loaded:', result.requests.length, 'requests')
      console.log('📋 Requests data:', result.requests)
      setRequests(result.requests)
    } else {
      console.warn('⚠️ Unexpected result format:', result)
      setRequests([])
    }
    
    setLoading(false)
  }

  const filterRequests = () => {
    let filtered = [...requests]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(req => 
        req.title.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query) ||
        req.location_address.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(req => req.category === categoryFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'available') {
        filtered = filtered.filter(req => !req.my_bid)
      } else if (statusFilter === 'bid_submitted') {
        filtered = filtered.filter(req => req.my_bid && req.my_bid.status === 'applied')
      } else if (statusFilter === 'bid_accepted') {
        filtered = filtered.filter(req => req.my_bid && req.my_bid.status === 'accepted')
      } else if (statusFilter === 'bid_rejected') {
        filtered = filtered.filter(req => req.my_bid && req.my_bid.status === 'rejected')
      }
    }

    setFilteredRequests(filtered)
  }

  const handleSubmitBid = async (requestId: string) => {
    try {
      const amount = parseFloat(bidAmount[requestId] || '0')
      const message = bidMessage[requestId] || ''

      console.log('Submitting bid:', { requestId, amount, message })

      if (!amount || amount <= 0) {
        toast.error('Please enter a valid bid amount')
        return
      }

      setSubmitting({ ...submitting, [requestId]: true })

      const result = await submitBid({
        requestId,
        amount,
        message: message.trim(),
      })

      console.log('Bid submission result:', result)

      if ('error' in result) {
        toast.error(result.error || 'Failed to submit bid')
        setSubmitting({ ...submitting, [requestId]: false })
      } else {
        toast.success('🎉 Bid submitted successfully! Check "My Bids" to track its status.')
        setBidAmount({ ...bidAmount, [requestId]: '' })
        setBidMessage({ ...bidMessage, [requestId]: '' })
        setSubmitting({ ...submitting, [requestId]: false })
        await loadRequests()
      }
    } catch (error) {
      console.error('Error submitting bid:', error)
      toast.error('An unexpected error occurred')
      setSubmitting({ ...submitting, [requestId]: false })
    }
  }

  const handleWithdrawBid = async (requestId: string, bidId: string) => {
    if (!confirm('Are you sure you want to withdraw this bid?')) return

    const result = await withdrawBid(bidId)

    if ('error' in result) {
      toast.error(result.error || 'Failed to withdraw bid')
    } else {
      toast.success('Bid withdrawn successfully')
      loadRequests()
    }
  }

  const getStatusBadge = (request: ServiceRequest) => {
    if (request.my_bid) {
      switch (request.my_bid.status) {
        case 'accepted':
          return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>
        case 'rejected':
          return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
        case 'applied':
        case 'pending':
          return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Bid Pending</Badge>
        default:
          return null
      }
    }
    return <Badge variant="outline"><Target className="h-3 w-3 mr-1" />Available</Badge>
  }

  const categories = ['all', ...new Set(requests.map(r => r.category))]

  if (checkingVerification || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <VerificationGate isVerified={isVerified}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-6 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Service Requests</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse and bid on available service requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredRequests.length} available
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="bid_submitted">My Bids</SelectItem>
                  <SelectItem value="bid_accepted">Accepted</SelectItem>
                  <SelectItem value="bid_rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                No service requests found matching your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{request.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {request.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {request.location_address}
                        </span>
                        {request.scheduled_time && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(request.scheduled_time).toLocaleString()}
                          </span>
                        )}
                        {request.distance !== null && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {request.distance.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(request)}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {request.bid_count} bid{request.bid_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description */}
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {request.description}
                  </p>

                  {/* Budget */}
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      Budget: ₹{request.budget_min?.toLocaleString()} - ₹{request.budget_max?.toLocaleString()}
                    </span>
                  </div>

                  {/* My Bid Display */}
                  {request.my_bid && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className="font-semibold text-sm">Your Bid</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          ₹{request.my_bid.amount.toLocaleString()}
                        </p>
                      </div>
                      {request.my_bid.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          {request.my_bid.message}
                        </p>
                      )}
                      {request.my_bid.status === 'applied' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWithdrawBid(request.id, request.my_bid!.id)}
                        >
                          Withdraw Bid
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Bid Form (if no bid submitted) */}
                  {!request.my_bid && (
                    <div className="bg-slate-50 dark:bg-slate-800 border rounded-lg p-4 space-y-3">
                      <p className="font-semibold text-sm">Submit Your Bid</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                            Bid Amount (₹) *
                          </label>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={bidAmount[request.id] || ''}
                            onChange={(e) => setBidAmount({ ...bidAmount, [request.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && bidAmount[request.id] && parseFloat(bidAmount[request.id]) > 0) {
                                e.preventDefault()
                                handleSubmitBid(request.id)
                              }
                            }}
                            min={0}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                            Message (optional)
                          </label>
                          <Input
                            placeholder="Add a message..."
                            value={bidMessage[request.id] || ''}
                            onChange={(e) => setBidMessage({ ...bidMessage, [request.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && bidAmount[request.id] && parseFloat(bidAmount[request.id]) > 0) {
                                e.preventDefault()
                                handleSubmitBid(request.id)
                              }
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          console.log('Button clicked for request:', request.id)
                          handleSubmitBid(request.id)
                        }}
                        disabled={submitting[request.id] || !bidAmount[request.id] || parseFloat(bidAmount[request.id]) <= 0}
                        className="w-full"
                      >
                        {submitting[request.id] ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Submitting...
                          </>
                        ) : (
                          'Submit Bid'
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Customer Info */}
                  <div className="pt-4 border-t text-xs text-slate-500 dark:text-slate-400">
                    Customer: <span className="font-medium">{request.customer_name}</span> • Posted {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </VerificationGate>
  )
}

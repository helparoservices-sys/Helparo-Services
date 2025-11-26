'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  DollarSign, Clock, User, Star, CheckCircle2, 
  XCircle, MessageSquare, TrendingDown, Award, Loader2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-notification'

interface Bid {
  id: string
  request_id: string
  helper_id: string
  bid_amount: number | null
  estimated_duration_hours: number | null
  availability_note: string | null
  bid_breakdown: any
  status: string
  created_at: string
  service_requests?: {
    title: string
    budget_min: number | null
    budget_max: number | null
  }
  profiles?: {
    full_name: string
    avatar_url: string | null
  }
}

export default function CustomerBidsPage() {
  const { showSuccess, showError } = useToast()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date')

  useEffect(() => {
    loadBids()
    subscribeToBids()
  }, [])

  async function loadBids() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all applications for user's requests
    const { data: requests } = await supabase
      .from('service_requests')
      .select('id')
      .eq('customer_id', user.id)

    if (!requests || requests.length === 0) {
      setLoading(false)
      return
    }

    const requestIds = requests.map(r => r.id)

    const { data, error } = await supabase
      .from('request_applications')
      .select(`
        id,
        request_id,
        helper_id,
        bid_amount,
        estimated_duration_hours,
        availability_note,
        bid_breakdown,
        status,
        created_at,
        service_requests (
          title,
          budget_min,
          budget_max
        ),
        profiles:helper_id (
          full_name,
          avatar_url
        )
      `)
      .in('request_id', requestIds)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBids(data as any)
    }
    setLoading(false)
  }

  function subscribeToBids() {
    const supabase = createClient()
    
    const channel = supabase
      .channel('customer-bids')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_applications',
        },
        () => {
          loadBids()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function acceptBid(bidId: string, requestId: string) {
    const supabase = createClient()
    const { error } = await supabase.rpc('accept_application', {
      p_request_id: requestId,
      p_application_id: bidId
    })
    
    if (error) {
      showError('Accept Failed', error.message)
    } else {
      showSuccess('Bid Accepted', 'Helper has been assigned to your request')
      loadBids()
    }
  }

  async function rejectBid(bidId: string) {
    if (!confirm('Are you sure you want to reject this bid?')) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('request_applications')
      .update({ status: 'rejected' })
      .eq('id', bidId)
    
    if (error) {
      showError('Reject Failed', error.message)
    } else {
      showSuccess('Bid Rejected', 'Bid has been rejected')
      loadBids()
    }
  }

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true
    if (filter === 'pending') return bid.status === 'applied'
    if (filter === 'accepted') return bid.status === 'accepted'
    if (filter === 'rejected') return bid.status === 'rejected'
    return true
  })

  const sortedBids = [...filteredBids].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else {
      return (a.bid_amount || 0) - (b.bid_amount || 0)
    }
  })

  const counts = {
    all: bids.length,
    pending: bids.filter(b => b.status === 'applied').length,
    accepted: bids.filter(b => b.status === 'accepted').length,
    rejected: bids.filter(b => b.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Incoming Bids
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Review and compare bids from helpers for your service requests
          </p>
        </div>

        {/* Filters & Sorting */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-2 text-xs opacity-75">({counts[f]})</span>
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'price')}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="price">Sort by Price (Low to High)</option>
          </select>
        </div>

        {/* Bids Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sortedBids.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No bids yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Helpers will start bidding on your service requests soon
            </p>
            <Link
              href="/customer/requests/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Create New Request
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedBids.map((bid) => {
              const isLowestBid = bid.bid_amount && 
                bid.bid_amount === Math.min(...sortedBids
                  .filter(b => b.request_id === bid.request_id && b.bid_amount)
                  .map(b => b.bid_amount!))
              
              return (
                <div
                  key={bid.id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Request Title */}
                      <Link
                        href={`/customer/requests/${bid.request_id}`}
                        className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-2 block"
                      >
                        {(bid.service_requests as any)?.title || 'Untitled Request'}
                      </Link>

                      {/* Helper Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                          {(bid.profiles as any)?.full_name?.[0] || 'H'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {(bid.profiles as any)?.full_name || 'Helper'}
                          </div>
                          <div className="text-xs text-slate-500">
                            Applied {new Date(bid.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Bid Details */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {bid.bid_amount && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-green-600 dark:text-green-400">
                              ₹{bid.bid_amount.toLocaleString()}
                            </span>
                            {isLowestBid && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" />
                                Lowest Bid
                              </span>
                            )}
                          </div>
                        )}
                        {bid.estimated_duration_hours && (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Clock className="h-4 w-4" />
                            Est. {bid.estimated_duration_hours}h
                          </div>
                        )}
                      </div>

                      {/* Budget Comparison */}
                      {(bid.service_requests as any)?.budget_min && (bid.service_requests as any)?.budget_max && bid.bid_amount && (
                        <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                          Your budget: ₹{(bid.service_requests as any).budget_min.toLocaleString()} - ₹{(bid.service_requests as any).budget_max.toLocaleString()}
                          {bid.bid_amount < (bid.service_requests as any).budget_min && (
                            <span className="ml-2 text-green-600">({Math.round((1 - bid.bid_amount / (bid.service_requests as any).budget_min) * 100)}% below budget)</span>
                          )}
                          {bid.bid_amount > (bid.service_requests as any).budget_max && (
                            <span className="ml-2 text-red-600">({Math.round((bid.bid_amount / (bid.service_requests as any).budget_max - 1) * 100)}% above budget)</span>
                          )}
                        </div>
                      )}

                      {/* Availability Note */}
                      {bid.availability_note && (
                        <div className="mt-3 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                          <div className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                            Availability:
                          </div>
                          <div className="text-blue-800 dark:text-blue-400">
                            {bid.availability_note}
                          </div>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="mt-3">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            bid.status === 'applied'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : bid.status === 'accepted'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {bid.status === 'applied' && <Clock className="h-3 w-3" />}
                          {bid.status === 'accepted' && <CheckCircle2 className="h-3 w-3" />}
                          {bid.status === 'rejected' && <XCircle className="h-3 w-3" />}
                          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {bid.status === 'applied' && (
                        <>
                          <Button
                            onClick={() => acceptBid(bid.id, bid.request_id)}
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => rejectBid(bid.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Link href={`/customer/requests/${bid.request_id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          View Request
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

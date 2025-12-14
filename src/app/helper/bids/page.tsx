'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  MapPin, 
  Calendar,
  TrendingUp,
  AlertCircle,
  Eye,
  Users,
  Timer
} from 'lucide-react'
import Link from 'next/link'
import { VerificationGate } from '@/components/helper/verification-gate'

interface BidHistory {
  id: string
  created_at: string
  updated_at: string
  status: string
  proposed_rate: number
  cover_note: string | null
  total_bids_count?: number
  service_request: {
    id: string
    title: string
    description: string
    service_city: string | null
    service_address: string | null
    budget_min: number | null
    budget_max: number | null
    status: string
    created_at: string
    profiles: {
      full_name: string
    } | null
  } | null
}

export default function HelperBidsPage() {
  const [bids, setBids] = useState<BidHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(true)
  const [filter, setFilter] = useState<'all' | 'applied' | 'accepted' | 'rejected' | 'withdrawn'>('all')
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      await checkVerification()
      await loadBids()
    }
    init()
  }, [])

  const checkVerification = async () => {
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

  const loadBids = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('No user found')
      setLoading(false)
      return
    }

    console.log('Loading bids for user:', user.id)

    // Get all bids by this helper using user.id (from profiles table)
    const { data, error } = await supabase
      .from('request_applications')
      .select(`
        id,
        created_at,
        updated_at,
        status,
        proposed_rate,
        cover_note,
        service_requests:request_id (
          id,
          title,
          description,
          service_city,
          service_address,
          budget_min,
          budget_max,
          status,
          created_at,
          profiles:customer_id (
            full_name
          )
        )
      `)
      .eq('helper_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading bids:', error)
      setLoading(false)
      return
    }

    // Fetch total bids count for each request
    const bidsWithCount = await Promise.all(
      (data || []).map(async (bid: any) => {
        if (bid.service_requests?.id) {
          const { count } = await supabase
            .from('request_applications')
            .select('id', { count: 'exact', head: true })
            .eq('request_id', bid.service_requests.id)
          
          return { ...bid, total_bids_count: count || 0 }
        }
        return { ...bid, total_bids_count: 0 }
      })
    )

    console.log('Bids loaded:', bidsWithCount?.length, bidsWithCount)
    setBids(bidsWithCount as any || [])
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case 'withdrawn':
        return (
          <Badge variant="outline">
            <XCircle className="h-3 w-3 mr-1" />
            Withdrawn
          </Badge>
        )
      case 'applied':
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true
    return bid.status === filter
  })

  const stats = {
    total: bids.length,
    applied: bids.filter(b => b.status === 'applied').length,
    accepted: bids.filter(b => b.status === 'accepted').length,
    rejected: bids.filter(b => b.status === 'rejected').length,
    withdrawn: bids.filter(b => b.status === 'withdrawn').length,
  }

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
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Bids</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track all your bid applications and their status
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('all')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Bids</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('applied')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.applied}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Pending</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('accepted')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Accepted</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('rejected')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Rejected</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('withdrawn')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.withdrawn}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Withdrawn</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Filter Badge */}
          {filter !== 'all' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Filter:</span>
              <Badge variant="outline" className="capitalize">
                {filter}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFilter('all')}
                className="text-xs"
              >
                Clear Filter
              </Button>
            </div>
          )}

          {/* Bids List */}
          {filteredBids.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  {filter === 'all' 
                    ? 'No bids submitted yet. Browse service requests to start bidding!' 
                    : `No ${filter} bids found.`}
                </p>
                {filter === 'all' && (
                  <Link href="/helper/jobs">
                    <Button className="mt-4">
                      Browse Service Requests
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBids.map((bid) => (
                <Card key={bid.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {bid.service_request?.title || 'Request Deleted'}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          {bid.service_request?.service_city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {bid.service_request.service_city}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Bid on {new Date(bid.created_at).toLocaleDateString()}
                          </span>
                          {bid.service_request?.profiles && (
                            <span className="text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                              Customer: {(bid.service_request.profiles as any).full_name}
                            </span>
                          )}
                        </div>
                        
                        {/* Job Created & Bids Count Info */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          {bid.service_request?.created_at && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
                              <Timer className="h-3.5 w-3.5" />
                              Job Posted: {new Date(bid.service_request.created_at).toLocaleDateString()} 
                              <span className="text-amber-500 dark:text-amber-300 ml-1">
                                ({Math.floor((new Date().getTime() - new Date(bid.service_request.created_at).getTime()) / (1000 * 60 * 60 * 24))}d ago)
                              </span>
                            </span>
                          )}
                          {(bid.total_bids_count ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md">
                              <Users className="h-3.5 w-3.5" />
                              {bid.total_bids_count} {bid.total_bids_count === 1 ? 'helper' : 'helpers'} bid
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(bid.status)}
                        {bid.status !== bid.status && bid.updated_at !== bid.created_at && (
                          <p className="text-xs text-slate-500 mt-1">
                            Updated {new Date(bid.updated_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Bid Amount */}
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Your Bid</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ₹{bid.proposed_rate.toLocaleString()}
                      </span>
                    </div>

                    {/* Budget Comparison */}
                    {bid.service_request?.budget_min && bid.service_request?.budget_max && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Customer Budget: ₹{bid.service_request.budget_min.toLocaleString()} - ₹{bid.service_request.budget_max.toLocaleString()}
                        </span>
                        {bid.proposed_rate < bid.service_request.budget_min && (
                          <span className="text-green-600 dark:text-green-400 text-xs ml-5">
                            ✓ Below minimum budget
                          </span>
                        )}
                      </div>
                    )}

                    {/* Cover Note */}
                    {bid.cover_note && (
                      <div className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Your Message:</p>
                        <p className="text-slate-600 dark:text-slate-400">{bid.cover_note}</p>
                      </div>
                    )}

                    {/* Request Status */}
                    {bid.service_request && (
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-xs text-slate-500">
                          Request Status: <span className="font-medium capitalize">{bid.service_request.status}</span>
                        </span>
                      <Link href={`/helper/jobs`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Request
                          </Button>
                        </Link>
                      </div>
                    )}
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

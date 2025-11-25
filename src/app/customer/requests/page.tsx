'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Clock, MapPin, Calendar, CheckCircle2, XCircle, 
  Loader2, Plus, Filter, Search, AlertCircle 
} from 'lucide-react'

interface ServiceRequest {
  id: string
  title: string
  description: string
  status: string
  category_id: string
  service_address?: string
  service_city?: string
  budget_min?: number
  budget_max?: number
  created_at: string
  application_count?: number
  service_categories?: {
    name: string
  }
}

type FilterType = 'all' | 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  open: { label: 'Open', color: 'bg-blue-500', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-purple-500', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
}

export default function CustomerRequestsList() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
    subscribeToRequests()
  }, [])

  async function loadRequests() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        title,
        description,
        status,
        category_id,
        service_address,
        service_city,
        budget_min,
        budget_max,
        created_at,
        application_count,
        service_categories (
          name
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRequests(data as any)
    }
    setLoading(false)
  }

  function subscribeToRequests() {
    const supabase = createClient()
    
    const channel = supabase
      .channel('customer-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
        },
        () => {
          loadRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts = {
    all: requests.length,
    draft: requests.filter(r => r.status === 'draft').length,
    open: requests.filter(r => r.status === 'open').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Service Requests
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Manage your service requests and track their progress
            </p>
          </div>
          <Link
            href="/customer/requests/new"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5" />
            New Request
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {(['all', 'draft', 'open', 'in_progress', 'completed', 'cancelled'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              {f === 'all' ? 'All' : statusConfig[f as keyof typeof statusConfig].label}
              <span className="ml-2 text-xs opacity-75">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {searchQuery ? 'No matching requests' : 'No requests yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchQuery ? 'Try adjusting your search or filters' : 'Create your first service request to get started'}
            </p>
            {!searchQuery && (
              <Link
                href="/customer/requests/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5" />
                Create Request
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => {
              const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock
              const statusColor = statusConfig[request.status as keyof typeof statusConfig]?.color || 'bg-gray-500'
              
              return (
                <Link
                  key={request.id}
                  href={`/customer/requests/${request.id}`}
                  className="block bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {request.title}
                        </h3>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {request.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                        {request.service_categories && (
                          <div className="flex items-center gap-1">
                            <Filter className="h-4 w-4" />
                            {(request.service_categories as any).name}
                          </div>
                        )}
                        {request.service_address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {request.service_city || request.service_address}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {request.budget_min && request.budget_max && (
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">
                          ₹{request.budget_min} - ₹{request.budget_max}
                        </div>
                      )}
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {request.application_count || 0} Applications
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

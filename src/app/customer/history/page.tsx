'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  MapPin, Calendar, DollarSign, Star, Clock, 
  Loader2, Map as MapIcon, List, Filter 
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ServiceHistory {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  service_address: string | null
  service_city: string | null
  service_location_lat: number | null
  service_location_lng: number | null
  budget_min: number | null
  budget_max: number | null
  assigned_helper_id: string | null
  profiles?: {
    full_name: string
    avatar_url: string | null
  }
}

export default function CustomerHistoryPage() {
  const [history, setHistory] = useState<ServiceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filterYear, setFilterYear] = useState<string>('all')

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // First fetch ALL service requests, then filter for completed/cancelled
    const { data: allData, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        title,
        description,
        status,
        broadcast_status,
        created_at,
        service_address,
        service_city,
        service_location_lat,
        service_location_lng,
        budget_min,
        budget_max,
        assigned_helper_id
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100) // 🟢 SAFE: Filter applied after, but prevents loading entire history
    
    // Filter for completed or cancelled (check both status and broadcast_status)
    const data = allData?.filter(b => 
      b.status === 'completed' || 
      b.status === 'cancelled' || 
      b.broadcast_status === 'completed' || 
      b.broadcast_status === 'cancelled'
    ) || []

    if (!error && data.length > 0) {
      // Fetch helper profiles separately
      const helperIds = data
        .map(d => d.assigned_helper_id)
        .filter((id): id is string => id !== null)
      
      let helperProfiles: Record<string, { full_name: string; avatar_url: string | null }> = {}
      
      if (helperIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', helperIds)
        
        if (profiles) {
          profiles.forEach(p => {
            helperProfiles[p.id] = {
              full_name: p.full_name || 'Helper',
              avatar_url: p.avatar_url
            }
          })
        }
      }
      
      // Transform data to include profiles
      const transformedData = data.map(item => ({
        ...item,
        profiles: item.assigned_helper_id ? helperProfiles[item.assigned_helper_id] : undefined
      }))
      
      setHistory(transformedData as any)
    }
    setLoading(false)
  }

  const years = Array.from(new Set(history.map(h => new Date(h.created_at).getFullYear().toString())))
  const filteredHistory = filterYear === 'all' 
    ? history 
    : history.filter(h => new Date(h.created_at).getFullYear().toString() === filterYear)

  const completedServices = filteredHistory.filter(h => h.status === 'completed')
  const totalSpent = completedServices.reduce((sum, h) => sum + (h.budget_max || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Service History
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            View your past service requests and locations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Services</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredHistory.length}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Completed</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {completedServices.length}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Spent</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    ₹{totalSpent.toLocaleString()}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              <List className="h-4 w-4" />
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              <MapIcon className="h-4 w-4" />
              Map View
            </button>
          </div>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No service history
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                You haven't completed any services yet
              </p>
              <Link
                href="/customer/requests/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Create New Request
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          <div className="grid gap-4">
            {filteredHistory.map((service) => (
              <Link
                key={service.id}
                href={`/customer/requests/${service.id}`}
                className="block"
              >
                <Card className="border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-400 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {service.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            service.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {service.status}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                          {service.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(service.created_at).toLocaleDateString()}
                          </div>
                          {service.service_address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {service.service_city || service.service_address}
                            </div>
                          )}
                          {service.budget_max && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ₹{service.budget_max.toLocaleString()}
                            </div>
                          )}
                        </div>

                        {service.profiles && (
                          <div className="mt-3 flex items-center gap-2 text-sm">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                              {(service.profiles as any).full_name?.[0]}
                            </div>
                            <span className="text-slate-700 dark:text-slate-300">
                              Served by {(service.profiles as any).full_name}
                            </span>
                          </div>
                        )}
                      </div>

                      {service.service_location_lat && service.service_location_lng && (
                        <a
                          href={`https://www.google.com/maps?q=${service.service_location_lat},${service.service_location_lng}`}
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all text-sm font-medium"
                        >
                          <MapPin className="h-4 w-4" />
                          View
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Map placeholder - In production, integrate Google Maps API or Mapbox */}
                <div className="absolute inset-0 p-4 overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredHistory
                      .filter(h => h.service_location_lat && h.service_location_lng)
                      .map((service) => (
                        <div
                          key={service.id}
                          className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                {service.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                {service.service_city}
                              </p>
                              <div className="text-xs text-slate-500 dark:text-slate-500 font-mono mt-1">
                                {service.service_location_lat?.toFixed(4)}, {service.service_location_lng?.toFixed(4)}
                              </div>
                              <a
                                href={`https://www.google.com/maps?q=${service.service_location_lat},${service.service_location_lng}`}
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <MapIcon className="h-3 w-3" />
                                Open in Maps
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {filteredHistory.filter(h => h.service_location_lat && h.service_location_lng).length === 0 && (
                  <div className="text-center">
                    <MapIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No services with location data
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

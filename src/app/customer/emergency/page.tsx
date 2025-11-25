'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import EmergencySOSButton from '@/components/emergency-sos-button'
import { 
  AlertTriangle, MapPin, Clock, User, CheckCircle2, 
  XCircle, Loader2, Shield, Phone 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SOSAlert {
  id: string
  request_id: string | null
  sos_type: string
  description: string | null
  location_lat: number | null
  location_lng: number | null
  status: string
  created_at: string
  acknowledged_at: string | null
  resolved_at: string | null
  service_requests?: {
    title: string
  }
}

export default function CustomerEmergencyPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')

  useEffect(() => {
    loadAlerts()
    subscribeToAlerts()
  }, [])

  async function loadAlerts() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('sos_alerts')
      .select(`
        id,
        request_id,
        sos_type,
        description,
        location_lat,
        location_lng,
        status,
        created_at,
        acknowledged_at,
        resolved_at,
        service_requests (
          title
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAlerts(data as any)
    }
    setLoading(false)
  }

  function subscribeToAlerts() {
    const supabase = createClient()
    
    const channel = supabase
      .channel('customer-sos-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts',
        },
        () => {
          loadAlerts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    if (filter === 'active') return alert.status === 'active' || alert.status === 'acknowledged'
    if (filter === 'resolved') return alert.status === 'resolved' || alert.status === 'cancelled'
    return true
  })

  const counts = {
    all: alerts.length,
    active: alerts.filter(a => a.status === 'active' || a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved' || a.status === 'cancelled').length,
  }

  const sosTypeConfig = {
    safety: { label: 'Safety Emergency', icon: '🚨', color: 'text-red-600' },
    medical: { label: 'Medical Emergency', icon: '🏥', color: 'text-orange-600' },
    dispute: { label: 'Dispute/Conflict', icon: '⚠️', color: 'text-yellow-600' },
  }

  const statusConfig = {
    active: { label: 'Active', color: 'bg-red-500', icon: AlertTriangle },
    acknowledged: { label: 'Acknowledged', color: 'bg-yellow-500', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-green-500', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'bg-gray-500', icon: XCircle },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Emergency Center
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Manage emergency alerts and safety features
            </p>
          </div>
          <EmergencySOSButton />
        </div>

        {/* Safety Info Card */}
        <Card className="mb-8 border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-300">
              <Shield className="h-5 w-5" />
              Emergency Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="tel:100"
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Police</div>
                  <div className="text-2xl font-bold text-blue-600">100</div>
                </div>
              </a>
              <a
                href="tel:102"
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Ambulance</div>
                  <div className="text-2xl font-bold text-red-600">102</div>
                </div>
              </a>
              <a
                href="tel:101"
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Fire</div>
                  <div className="text-2xl font-bold text-orange-600">101</div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {(['all', 'active', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-red-400'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-2 text-xs opacity-75">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                {filter === 'all' ? 'No emergency alerts' : `No ${filter} alerts`}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {filter === 'all' 
                  ? "You haven't sent any emergency alerts yet"
                  : `No ${filter} emergency alerts found`
                }
              </p>
              {filter === 'all' && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Use the Emergency SOS button above if you need immediate help
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAlerts.map((alert) => {
              const typeConfig = sosTypeConfig[alert.sos_type as keyof typeof sosTypeConfig]
              const StatusIcon = statusConfig[alert.status as keyof typeof statusConfig]?.icon || AlertTriangle
              const statusColor = statusConfig[alert.status as keyof typeof statusConfig]?.color || 'bg-gray-500'

              return (
                <Card
                  key={alert.id}
                  className={`border-2 ${
                    alert.status === 'active' 
                      ? 'border-red-500 dark:border-red-600' 
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{typeConfig?.icon}</span>
                          <div>
                            <h3 className={`font-semibold text-lg ${typeConfig?.color || 'text-slate-900'}`}>
                              {typeConfig?.label || 'Emergency'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Clock className="h-3 w-3" />
                              {new Date(alert.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {alert.description && (
                          <p className="text-slate-700 dark:text-slate-300 mb-3">
                            {alert.description}
                          </p>
                        )}

                        {alert.service_requests && (
                          <div className="mb-3">
                            <Link
                              href={`/customer/requests/${alert.request_id}`}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Related to: {(alert.service_requests as any).title}
                            </Link>
                          </div>
                        )}

                        {alert.location_lat && alert.location_lng && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                            <MapPin className="h-4 w-4" />
                            Location: {alert.location_lat.toFixed(6)}, {alert.location_lng.toFixed(6)}
                            <a
                              href={`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View on Map
                            </a>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                          {alert.acknowledged_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-yellow-600" />
                              Acknowledged: {new Date(alert.acknowledged_at).toLocaleString()}
                            </div>
                          )}
                          {alert.resolved_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              Resolved: {new Date(alert.resolved_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white ${statusColor}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[alert.status as keyof typeof statusConfig]?.label || alert.status}
                        </span>
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

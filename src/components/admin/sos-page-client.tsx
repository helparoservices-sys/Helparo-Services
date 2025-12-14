'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Clock, MapPin, CheckCircle, Phone, Users, Loader2, AlertCircle } from 'lucide-react'
import { acknowledgeSOS, resolveSOS } from '@/app/actions/sos'

interface SOSAlert {
  id: string
  alert_type: string
  status: string
  description: string | null
  latitude: number
  longitude: number
  address: string | null
  time_elapsed_minutes: number
}

interface SOSPageClientProps {
  alerts: SOSAlert[]
  stats: {
    totalAlerts: number
    pendingAlerts: number
    acknowledgedAlerts: number
    avgResponseTime: number
  }
  error?: string
}

export function SOSPageClient({ alerts, stats, error: initialError }: SOSPageClientProps) {
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState<{ id: string; action: string } | null>(null)
  const [error, setError] = useState(initialError || '')

  const handleAcknowledge = useCallback(async (alertId: string) => {
    setLoadingAction({ id: alertId, action: 'acknowledge' })
    setError('')

    const result = await acknowledgeSOS(alertId)
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }

    setLoadingAction(null)
  }, [router])

  const handleResolve = useCallback(async (alertId: string) => {
    setLoadingAction({ id: alertId, action: 'resolve' })
    setError('')

    const result = await resolveSOS(alertId)
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }

    setLoadingAction(null)
  }, [router])

  const handleCall = useCallback(() => {
    // Use tel: protocol for emergency call
    window.location.href = `tel:911`
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            Active SOS Alerts
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor and respond to safety incidents in real-time</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Alerts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalAlerts}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.pendingAlerts}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Acknowledged</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.acknowledgedAlerts}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Response</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.avgResponseTime}m</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Emergency Alerts</h2>
          </div>
          
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white capitalize">
                          {alert.alert_type.replace('_', ' ')}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            alert.status === 'pending' 
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                              : alert.status === 'acknowledged'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          }`}>
                            {alert.status === 'pending' && <Clock className="h-3 w-3" />}
                            {alert.status === 'acknowledged' && <Users className="h-3 w-3" />}
                            {alert.status === 'resolved' && <CheckCircle className="h-3 w-3" />}
                            {alert.status}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <Clock className="h-4 w-4" />
                            {alert.time_elapsed_minutes} min ago
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-13 space-y-2">
                      {alert.description && (
                        <p className="text-sm text-slate-700 dark:text-slate-300">{alert.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin className="h-4 w-4" />
                        {alert.address || `${alert.latitude}, ${alert.longitude}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.status === 'pending' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={loadingAction?.id === alert.id && loadingAction?.action === 'acknowledge'}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction?.id === alert.id && loadingAction?.action === 'acknowledge' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={loadingAction?.id === alert.id && loadingAction?.action === 'resolve'}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction?.id === alert.id && loadingAction?.action === 'resolve' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={handleCall}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {alerts.length === 0 && (
              <div className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-300 dark:text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Active Alerts</h3>
                <p className="text-slate-500 dark:text-slate-400">All emergency situations are currently resolved.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

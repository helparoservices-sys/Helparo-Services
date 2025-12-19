'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { getMySOSAlerts, cancelSOS } from '@/app/actions/sos'
import { AlertTriangle, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface SOSAlert {
  id: string
  alert_type: string
  status: string
  description: string
  latitude: number | null
  longitude: number | null
  created_at: string
  acknowledged_at: string | null
  resolved_at: string | null
  resolution_note: string | null
}

export default function CustomerSOSPage() {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    setLoading(true)
    const result = await getMySOSAlerts()
    
    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setAlerts(result.data.alerts)
    }
    
    setLoading(false)
  }

  const handleCancel = async (alertId: string) => {
    setCancellingId(alertId)
    const result = await cancelSOS(alertId, 'Cancelled by customer')
    
    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('SOS alert cancelled')
      loadAlerts()
    }
    
    setCancellingId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            Active
          </span>
        )
      case 'acknowledged':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Acknowledged
          </span>
        )
      case 'resolved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Resolved
          </span>
        )
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
            {status}
          </span>
        )
    }
  }

  const getAlertTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      emergency: 'bg-red-500 text-white',
      safety_concern: 'bg-orange-500 text-white',
      dispute: 'bg-yellow-500 text-black',
      harassment: 'bg-purple-500 text-white',
      other: 'bg-slate-500 text-white'
    }
    
    const labels: Record<string, string> = {
      emergency: 'Emergency',
      safety_concern: 'Safety Concern',
      dispute: 'Dispute',
      harassment: 'Harassment',
      other: 'Other'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.other}`}>
        {labels[type] || type}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My SOS Alerts</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Track your emergency requests
            </p>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
              No SOS Alerts
            </h3>
            <p className="text-slate-500 dark:text-slate-500 text-sm mb-4">
              You haven't created any emergency alerts yet
            </p>
            <Link href="/customer/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={alert.status === 'active' ? 'border-red-300 dark:border-red-800' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getAlertTypeBadge(alert.alert_type)}
                    {getStatusBadge(alert.status)}
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-slate-700 dark:text-slate-300">
                  {alert.description}
                </p>
                
                {alert.latitude && alert.longitude && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <a 
                      href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Location
                    </a>
                  </div>
                )}

                {alert.acknowledged_at && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
                    <Clock className="h-4 w-4" />
                    Acknowledged {formatDistanceToNow(new Date(alert.acknowledged_at), { addSuffix: true })}
                  </div>
                )}

                {alert.resolved_at && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Resolved {formatDistanceToNow(new Date(alert.resolved_at), { addSuffix: true })}
                    {alert.resolution_note && (
                      <span className="text-slate-500">- {alert.resolution_note}</span>
                    )}
                  </div>
                )}

                {alert.status === 'active' && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(alert.id)}
                      disabled={cancellingId === alert.id}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      {cancellingId === alert.id ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Alert
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

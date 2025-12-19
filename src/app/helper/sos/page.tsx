'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperSOSAlerts } from '@/app/actions/helper-sos'
import { AlertTriangle, Phone, MapPin, Clock, CheckCircle, User, Navigation, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface SOSAlert {
  id: string
  alert_type: string
  status: string
  description: string
  created_at: string
  latitude: number | null
  longitude: number | null
  acknowledged_at: string | null
  resolved_at: string | null
  user_id: string
  profiles: {
    full_name: string | null
    phone: string | null
  } | null
}

export default function HelperSOSPage() {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<SOSAlert[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const result = await getHelperSOSAlerts()

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setAlerts(result.data.alerts as SOSAlert[])
    }

    setLoading(false)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            Active - Needs Help
          </span>
        )
      case 'acknowledged':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            You're Responding
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
          <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full text-xs font-medium">
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

  const openNavigation = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    )
  }

  const callCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const messageCustomer = (phone: string) => {
    window.open(`https://wa.me/91${phone}`, '_blank')
  }

  // Separate active and past alerts
  const activeAlerts = alerts.filter(a => a.status === 'acknowledged' || a.status === 'active')
  const pastAlerts = alerts.filter(a => a.status === 'resolved' || a.status === 'cancelled')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
          <AlertTriangle className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">SOS Responses</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Customer emergencies you're responding to
          </p>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            Active Responses ({activeAlerts.length})
          </h2>
          
          {activeAlerts.map((alert) => (
            <Card key={alert.id} className="border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="pt-6 space-y-4">
                {/* Alert Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getAlertTypeBadge(alert.alert_type)}
                    {getStatusBadge(alert.status)}
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{alert.profiles?.full_name || 'Customer'}</p>
                    <p className="text-sm text-slate-500">Needs your help urgently</p>
                  </div>
                </div>

                {/* Description */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Emergency Description</p>
                  <p className="text-slate-700 dark:text-slate-300">{alert.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {alert.profiles?.phone && (
                    <>
                      <Button
                        onClick={() => callCustomer(alert.profiles!.phone!)}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                      <Button
                        onClick={() => messageCustomer(alert.profiles!.phone!)}
                        variant="outline"
                        className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    </>
                  )}
                  {alert.latitude && alert.longitude && (
                    <Button
                      onClick={() => openNavigation(alert.latitude!, alert.longitude!)}
                      variant="outline"
                      className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Navigation className="h-4 w-4" />
                      Navigate
                    </Button>
                  )}
                </div>

                {/* View Details Link */}
                <Link href={`/helper/sos/${alert.id}`}>
                  <Button variant="secondary" className="w-full">
                    View Full Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State for Active */}
      {activeAlerts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-300 dark:text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
              No Active SOS Responses
            </h3>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              You're not currently responding to any emergencies
            </p>
          </CardContent>
        </Card>
      )}

      {/* Past Alerts */}
      {pastAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
            Past Responses ({pastAlerts.length})
          </h2>
          
          {pastAlerts.map((alert) => (
            <Card key={alert.id} className="bg-slate-50 dark:bg-slate-900/50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium">{alert.profiles?.full_name || 'Customer'}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {alert.alert_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(alert.status)}
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

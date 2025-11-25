'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperSOSAlerts, createSOSAlert, cancelSOSAlert } from '@/app/actions/helper-sos'
import { AlertTriangle, Phone, MapPin, Clock, Shield, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SOSAlert {
  id: string
  alert_type: string
  status: string
  description: string
  created_at: string
  latitude: number | null
  longitude: number | null
}

export default function HelperSOSPage() {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [alertType, setAlertType] = useState('emergency')
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const result = await getHelperSOSAlerts()

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setAlerts(result.data.alerts)
    }

    setLoading(false)
  }

  const handleCreateAlert = async () => {
    if (!description.trim()) {
      toast.error('Please describe the situation')
      return
    }

    setCreating(true)

    // Get current location
    let latitude: number | null = null
    let longitude: number | null = null

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      } catch (error) {
        console.log('Location not available')
      }
    }

    const result = await createSOSAlert({
      alert_type: alertType,
      description: description.trim(),
      latitude,
      longitude,
    })

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('SOS alert created')
      setDescription('')
      setShowForm(false)
      loadData()
    }

    setCreating(false)
  }

  const handleCancelAlert = async (alertId: string) => {
    const result = await cancelSOSAlert(alertId)

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Alert cancelled')
      loadData()
    }
  }

  const getAlertColor = (type: string) => {
    const colors: Record<string, string> = {
      emergency: 'from-red-600 to-red-400',
      safety_concern: 'from-orange-600 to-orange-400',
      dispute: 'from-yellow-600 to-yellow-400',
      harassment: 'from-purple-600 to-purple-400',
      other: 'from-gray-600 to-gray-400',
    }
    return colors[type] || colors.other
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      active: { text: 'Active', color: 'bg-red-100 text-red-700' },
      resolved: { text: 'Resolved', color: 'bg-green-100 text-green-700' },
      cancelled: { text: 'Cancelled', color: 'bg-gray-100 text-gray-700' },
    }
    return badges[status] || badges.active
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            SOS & Safety Alerts
          </h1>
          <p className="text-gray-600 mt-1">Emergency assistance and safety reporting</p>
        </div>

        {/* Emergency Button */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center animate-pulse">
                <AlertTriangle className="h-12 w-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Emergency Assistance</h3>
                <p className="text-sm text-gray-600 mt-2">
                  In case of emergency, create an alert to notify support immediately
                </p>
              </div>
              {!showForm ? (
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 gap-2"
                >
                  <AlertTriangle className="h-5 w-5" />
                  Create SOS Alert
                </Button>
              ) : (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Alert Type</label>
                    <select
                      value={alertType}
                      onChange={e => setAlertType(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="emergency">Emergency</option>
                      <option value="safety_concern">Safety Concern</option>
                      <option value="dispute">Dispute</option>
                      <option value="harassment">Harassment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe the situation..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleCreateAlert}
                      disabled={creating || !description.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 gap-2"
                    >
                      {creating ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4" />
                          Submit Alert
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setDescription('')
                      }}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Safety Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-white/50">
            <CardContent className="pt-6 text-center">
              <Phone className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <h4 className="font-semibold text-gray-900 mb-1">24/7 Support</h4>
              <p className="text-xs text-gray-600">Immediate assistance available</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-white/50">
            <CardContent className="pt-6 text-center">
              <MapPin className="h-10 w-10 mx-auto mb-3 text-green-600" />
              <h4 className="font-semibold text-gray-900 mb-1">Location Tracking</h4>
              <p className="text-xs text-gray-600">Share your location for safety</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-white/50">
            <CardContent className="pt-6 text-center">
              <Shield className="h-10 w-10 mx-auto mb-3 text-purple-600" />
              <h4 className="font-semibold text-gray-900 mb-1">Incident Reporting</h4>
              <p className="text-xs text-gray-600">Report safety concerns</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert History */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonCard />
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">No alerts created</p>
                <p className="text-sm text-gray-500 mt-2">Your safety alerts will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => {
                  const statusBadge = getStatusBadge(alert.status)

                  return (
                    <div
                      key={alert.id}
                      className="p-4 rounded-xl border bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAlertColor(alert.alert_type)} flex items-center justify-center`}>
                            <AlertTriangle className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {alert.alert_type.replace('_', ' ')}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                {statusBadge.text}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          </div>
                        </div>
                        {alert.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelAlert(alert.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.created_at).toLocaleString()}
                        </div>
                        {alert.latitude && alert.longitude && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Location shared
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

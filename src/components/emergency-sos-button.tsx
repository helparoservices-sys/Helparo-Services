'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'
import { useLocation } from '@/lib/use-location'
import { AlertTriangle, Phone, MapPin, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from './ui/toast-notification'

// Haversine formula to calculate distance between two points
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Notify nearby helpers about the emergency
async function notifyNearbyHelpers(
  supabase: SupabaseClient,
  customerId: string,
  alertId: string,
  lat: number,
  lng: number,
  sosType: string
) {
  try {
    // Get nearby available helpers (within 15km)
    const { data: helpers } = await supabase
      .from('helper_profiles')
      .select('id, latitude, longitude, profiles!inner(full_name)')
      .eq('verification_status', 'approved')
      .eq('is_available_now', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (!helpers || helpers.length === 0) {
      console.log('No nearby helpers found for SOS alert')
      return
    }

    // Filter helpers within 15km radius
    const nearbyHelpers = helpers.filter(helper => {
      if (!helper.latitude || !helper.longitude || lat === 0 || lng === 0) return true // Include all if no location
      const distance = getDistanceKm(lat, lng, helper.latitude, helper.longitude)
      return distance <= 15 // 15km radius
    }).slice(0, 10) // Limit to 10 nearest helpers

    // Create notifications for each nearby helper
    const notifications = nearbyHelpers.map(helper => ({
      user_id: helper.id,
      channel: 'push',
      title: '🚨 EMERGENCY: Customer needs help!',
      body: `A customer nearby needs ${sosType} assistance. Please respond if you can help.`,
      data: JSON.stringify({ alert_id: alertId, type: 'sos_alert', link: '/helper/sos' }),
      status: 'sent',
      created_at: new Date().toISOString(),
    }))

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
      console.log(`Notified ${notifications.length} helpers about SOS alert`)
    }

    // Also notify admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.id,
        channel: 'push',
        title: '🚨 SOS ALERT: Customer Emergency',
        body: `A customer has triggered a ${sosType} emergency alert. Immediate attention required.`,
        data: JSON.stringify({ alert_id: alertId, type: 'sos_alert', link: '/admin/sos' }),
        status: 'sent',
        created_at: new Date().toISOString(),
      }))
      await supabase.from('notifications').insert(adminNotifications)
    }
  } catch (error) {
    console.error('Failed to notify helpers:', error)
    // Don't throw - alert was already created successfully
  }
}

interface EmergencySOSButtonProps {
  requestId?: string
  className?: string
}

export default function EmergencySOSButton({ requestId, className = '' }: EmergencySOSButtonProps) {
  const { showSuccess, showError } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sosType, setSosType] = useState<'safety' | 'medical' | 'dispute'>('safety')
  const [description, setDescription] = useState('')
  const { coordinates, requestLocation } = useLocation()

  async function createSOSAlert() {
    setCreating(true)

    try {
      // Get current location
      let lat = coordinates?.latitude
      let lng = coordinates?.longitude

      if (!lat || !lng) {
        try {
          const location = await requestLocation()
          if (location?.coords) {
            lat = location.coords.latitude
            lng = location.coords.longitude
          }
        } catch (locError) {
          console.error('Location error:', locError)
        }
      }

      // If still no location, use a default or allow without location
      if (!lat || !lng) {
        // Use last known location from browser if available
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000 // Accept 5 minute old location
              })
            })
            lat = position.coords.latitude
            lng = position.coords.longitude
          } catch {
            // Continue without location - emergency is more important
            lat = 0
            lng = 0
          }
        } else {
          lat = 0
          lng = 0
        }
      }

      const supabase = createClient()
      
      // Try to get user - first from getUser, then from session
      let user = null
      try {
        const { data: userData } = await supabase.auth.getUser()
        user = userData?.user
      } catch {
        // If getUser fails, try getSession
        const { data: sessionData } = await supabase.auth.getSession()
        user = sessionData?.session?.user
      }
      
      if (!user) {
        // Last resort: check if we have a session
        const { data: sessionData } = await supabase.auth.getSession()
        user = sessionData?.session?.user
      }
      
      if (!user) {
        throw new Error('Please log in to send an SOS alert')
      }

      // Map SOS type to database alert_type
      const alertTypeMap: Record<string, string> = {
        'safety': 'safety_concern',
        'medical': 'emergency',
        'dispute': 'dispute'
      }

      // Create SOS alert using database function
      const { data: alertId, error } = await supabase.rpc('create_sos_alert', {
        p_alert_type: alertTypeMap[sosType] || 'emergency',
        p_latitude: lat,
        p_longitude: lng,
        p_description: description || `${sosType} emergency - immediate assistance needed`,
        p_request_id: requestId || null,
      })

      if (error) throw error

      // Notify nearby helpers about the emergency
      await notifyNearbyHelpers(supabase, user.id, alertId, lat, lng, sosType)

      showSuccess('🚨 Emergency Alert Sent', 'Help is on the way!')
      setShowModal(false)
      setDescription('')
    } catch (error) {
      showError('Alert Failed', (error as Error).message)
    } finally {
      setCreating(false)
    }
  }

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 relative">
          {/* Close Button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Emergency SOS
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Send an immediate alert with your location
            </p>
          </div>

          {/* SOS Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Emergency Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSosType('safety')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  sosType === 'safety'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                🚨 Safety
              </button>
              <button
                onClick={() => setSosType('medical')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  sosType === 'medical'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                🏥 Medical
              </button>
              <button
                onClick={() => setSosType('dispute')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  sosType === 'dispute'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                ⚠️ Dispute
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the emergency..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Location Info */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-blue-900 dark:text-blue-300">
              {coordinates ? (
                <span>Your current location will be shared: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</span>
              ) : (
                <span>Location will be requested when you send the alert</span>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-900 dark:text-red-300">
            <strong>⚠️ Warning:</strong> This will immediately notify admins and nearby helpers. Only use in genuine emergencies.
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => setShowModal(false)}
              variant="outline"
              className="flex-1"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={createSOSAlert}
              disabled={creating}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Send SOS Alert
                </>
              )}
            </Button>
          </div>

          {/* Emergency Contacts */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
              Or call emergency services directly:
            </div>
            <div className="mt-2 flex justify-center gap-4">
              <a
                href="tel:100"
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Phone className="h-3 w-3" />
                Police (100)
              </a>
              <a
                href="tel:102"
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Phone className="h-3 w-3" />
                Ambulance (102)
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowModal(true)}
      className={`group relative flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
      title="Emergency SOS - Send immediate alert"
    >
      {/* Pulsing ring effect */}
      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
      <span className="absolute inset-0 rounded-full bg-red-600 animate-pulse opacity-30"></span>
      
      <AlertTriangle className="h-5 w-5 relative z-10" />
      <span className="relative z-10 hidden sm:inline">SOS</span>
    </button>
  )
}

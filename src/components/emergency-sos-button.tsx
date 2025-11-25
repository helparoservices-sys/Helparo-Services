'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocation } from '@/lib/use-location'
import { AlertTriangle, Phone, MapPin, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmergencySOSButtonProps {
  requestId?: string
  className?: string
}

export default function EmergencySOSButton({ requestId, className = '' }: EmergencySOSButtonProps) {
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
        const location = await requestLocation()
        lat = location.coords.latitude
        lng = location.coords.longitude
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Create SOS alert using database function
      const { error } = await supabase.rpc('create_sos_alert', {
        p_request_id: requestId || null,
        p_customer_id: user.id,
        p_sos_type: sosType,
        p_description: description || null,
        p_location_lat: lat,
        p_location_lng: lng,
      })

      if (error) throw error

      alert('🚨 Emergency alert sent! Help is on the way.')
      setShowModal(false)
      setDescription('')
    } catch (error) {
      alert('Failed to send emergency alert: ' + (error as Error).message)
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
      className={`flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all ${className}`}
      title="Emergency SOS - Send immediate alert"
    >
      <AlertTriangle className="h-5 w-5" />
      <span className="hidden sm:inline">Emergency SOS</span>
    </button>
  )
}

/**
 * EMERGENCY SOS SYSTEM
 * Real-time emergency assistance for customers in danger
 * Critical feature for user safety during service
 */

'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Phone, MapPin, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface SOSAlert {
  id: string
  userId: string
  location: { lat: number; lng: number }
  address: string
  situation: string
  timestamp: Date
  status: 'active' | 'acknowledged' | 'resolved'
  helper_id?: string
  request_id?: string
}

/**
 * Emergency SOS Button - Visible on all customer pages during active service
 */
export function EmergencySOSButton({ 
  userId, 
  requestId,
  helperId 
}: { 
  userId: string
  requestId?: string
  helperId?: string
}) {
  const [showPanel, setShowPanel] = useState(false)
  const [activating, setActivating] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const handleSOSActivation = async () => {
    setActivating(true)
    setCountdown(5)

    // 5-second countdown to prevent accidental activation
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          triggerSOS()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const triggerSOS = async () => {
    try {
      // Get user's current location
      const position = await getCurrentLocation()
      
      // Create SOS alert
      const response = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          request_id: requestId,
          helper_id: helperId,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        // Alert triggered successfully
        alert('🚨 EMERGENCY ALERT SENT!\n\nHelp is on the way. Police and emergency contacts notified.')
        
        // Vibrate phone
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200])
        }
        
        // Play loud alarm sound
        playAlarmSound()
        
        // Show emergency instructions
        showEmergencyInstructions()
      }
    } catch (error) {
      console.error('SOS activation failed:', error)
      alert('Failed to send SOS. Please call 100 (Police) immediately.')
    } finally {
      setActivating(false)
    }
  }

  const cancelSOS = () => {
    setActivating(false)
    setCountdown(5)
  }

  return (
    <>
      {/* Floating SOS Button - Always visible during service */}
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl animate-pulse"
        aria-label="Emergency SOS"
      >
        <Shield className="h-8 w-8" />
      </button>

      {/* SOS Activation Panel */}
      {showPanel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              {!activating ? (
                <>
                  <div className="text-center mb-6">
                    <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Emergency SOS</h2>
                    <p className="text-gray-600">
                      Activate if you feel unsafe or need immediate help
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <p className="text-sm font-medium">What happens when you activate SOS:</p>
                      <ul className="mt-2 text-sm text-gray-700 space-y-1">
                        <li>✓ Police (100) gets immediate alert with your location</li>
                        <li>✓ Your emergency contacts are notified</li>
                        <li>✓ Helparo support team is alerted</li>
                        <li>✓ Live location tracking starts</li>
                        <li>✓ Loud alarm plays on your phone</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPanel(false)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSOSActivation}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Activate SOS
                    </Button>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      For immediate danger, call 100 (Police)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <div className="text-6xl font-bold text-red-600 animate-pulse">
                        {countdown}
                      </div>
                      <div className="absolute inset-0 animate-ping">
                        <div className="h-full w-full rounded-full bg-red-600 opacity-20"></div>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold mt-4">Activating SOS...</h2>
                    <p className="text-gray-600 mt-2">
                      Emergency alert will be sent in {countdown} seconds
                    </p>
                  </div>

                  <Button
                    onClick={cancelSOS}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

/**
 * Emergency Contact Management
 */
export function EmergencyContactsManager({ userId }: { userId: string }) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [adding, setAdding] = useState(false)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Emergency Contacts</h3>
            <p className="text-sm text-gray-600">
              These contacts will be notified if you activate SOS
            </p>
          </div>
          <Button onClick={() => setAdding(true)} size="sm">
            Add Contact
          </Button>
        </div>

        <div className="space-y-3">
          {contacts.map((contact, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-gray-600">{contact.relationship}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-sm">{contact.phone}</p>
              </div>
            </div>
          ))}

          {contacts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No emergency contacts added yet</p>
              <p className="text-sm mt-1">Add contacts for better safety</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Live Location Tracking (for active SOS)
 */
export function LiveLocationTracker({ sosId }: { sosId: string }) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Start watching location every 10 seconds
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocation(newLocation)

        // Send location update to server
        updateSOSLocation(sosId, newLocation)
      },
      (error) => console.error('Location error:', error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [sosId])

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-red-600 animate-pulse" />
        <div>
          <p className="font-medium text-red-900">Live Location Tracking Active</p>
          <p className="text-sm text-red-700">
            Your location is being shared with authorities
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper functions
async function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
    })
  })
}

function playAlarmSound() {
  try {
    const audio = new Audio('/emergency-alarm.mp3')
    audio.loop = true
    audio.volume = 1.0
    audio.play()
  } catch (error) {
    console.error('Failed to play alarm:', error)
  }
}

function showEmergencyInstructions() {
  // Show modal with safety instructions
  alert(`
🚨 EMERGENCY INSTRUCTIONS:

1. Stay in a public place if possible
2. Keep your phone charged and accessible
3. Police are being dispatched to your location
4. Helparo support is monitoring your situation
5. Your emergency contacts have been notified

If you're in immediate danger, call 100 (Police) now!
  `)
}

async function updateSOSLocation(sosId: string, location: { lat: number; lng: number }) {
  try {
    await fetch('/api/emergency/update-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sos_id: sosId, location }),
    })
  } catch (error) {
    console.error('Failed to update SOS location:', error)
  }
}

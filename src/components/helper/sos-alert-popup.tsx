'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Phone, MapPin, Heart, Navigation, Volume2, VolumeX, User } from 'lucide-react'
import { toast } from 'sonner'

interface SOSAlertData {
  id: string
  alert_id: string
  title: string
  body: string
  sos_type: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_lat: number
  customer_lng: number
  created_at: string
}

export default function SOSAlertPopup() {
  const router = useRouter()
  const [alert, setAlert] = useState<SOSAlertData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Play urgent SOS alarm sound
  const playSOSSound = useCallback(() => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      audioContextRef.current = audioContext
      
      const playBeep = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return
        
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Urgent siren-like pattern
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.15)
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.3)
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.45)
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.6)
        oscillatorRef.current = oscillator
      }
      
      // Play immediately
      playBeep()
      
      // Repeat every 1.5 seconds
      intervalRef.current = setInterval(() => {
        playBeep()
      }, 1500)
      
      setIsPlaying(true)
    } catch (error) {
      console.error('Failed to play SOS sound:', error)
    }
  }, [])

  // Stop the alarm
  const stopSound = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop()
      } catch {}
      oscillatorRef.current = null
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch {}
      audioContextRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Handle accept - helper will respond to SOS
  const handleAccept = async () => {
    stopSound()
    if (countdownRef.current) clearInterval(countdownRef.current)
    
    if (alert) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Update the SOS alert to show this helper is responding
          await supabase
            .from('sos_alerts')
            .update({ 
              acknowledged_by: user.id,
              acknowledged_at: new Date().toISOString(),
              status: 'acknowledged'
            })
            .eq('id', alert.alert_id)
          
          // Mark notification as read
          await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', alert.id)
        }
        
        toast.success('🙏 Thank you for responding! Redirecting to SOS details...')
        
        // Redirect to SOS response page with all details
        router.push(`/helper/sos/${alert.alert_id}`)
      } catch (error) {
        console.error('Failed to acknowledge SOS:', error)
      }
    }
    
    setAlert(null)
  }

  // Handle decline
  const handleDecline = async () => {
    stopSound()
    if (countdownRef.current) clearInterval(countdownRef.current)
    
    if (alert) {
      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', alert.id)
    }
    
    setAlert(null)
  }

  // Subscribe to SOS notifications
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let pollingInterval: NodeJS.Timeout | null = null

    const checkForSOSAlerts = async (userId: string) => {
      // Check for any existing unread SOS notifications (identify by data.is_sos)
      // EGRESS FIX: Select only needed columns instead of '*'
      const { data: existingAlerts, error } = await supabase
        .from('notifications')
        .select('id, title, body, data, created_at')
        .eq('user_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(10) // Check last 10 to find SOS

      if (error) {
        console.error('🚨 SOS Popup: Error checking alerts:', error)
        return
      }

      // Find first SOS notification
      const sosNotif = existingAlerts?.find(notif => {
        try {
          const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data
          return data?.is_sos === true
        } catch {
          return false
        }
      })

      if (sosNotif && !alert) {
        console.log('🚨 SOS Popup: Found SOS alert!', sosNotif)
        try {
          const data = typeof sosNotif.data === 'string' ? JSON.parse(sosNotif.data) : sosNotif.data
          setAlert({
            id: sosNotif.id,
            alert_id: data.alert_id,
            title: sosNotif.title,
            body: sosNotif.body,
            sos_type: data.sos_type || 'emergency',
            customer_id: data.customer_id || '',
            customer_name: data.customer_name || 'Customer',
            customer_phone: data.customer_phone || '',
            customer_lat: data.customer_lat,
            customer_lng: data.customer_lng,
            created_at: sosNotif.created_at
          })
        } catch (e) {
          console.error('🚨 SOS Popup: Error parsing alert data:', e)
        }
      }
    }

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('🚨 SOS Popup: No user found')
        return
      }

      console.log('🚨 SOS Popup: Setting up for user:', user.id)

      // Check immediately on load
      await checkForSOSAlerts(user.id)

      // Subscribe to new SOS notifications via realtime
      channel = supabase
        .channel(`sos-notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🚨 SOS Popup: Realtime notification received!', payload)
            const notif = payload.new as { id: string; channel: string; title: string; body: string; data: string | object; created_at: string }
            try {
              const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data
              // Check if this is an SOS notification by data.is_sos
              if (data?.is_sos === true) {
                console.log('🚨 SOS Popup: This is an SOS alert! Showing popup...')
                setAlert({
                  id: notif.id,
                  alert_id: data.alert_id,
                  title: notif.title,
                  body: notif.body,
                  sos_type: data.sos_type || 'emergency',
                  customer_id: data.customer_id || '',
                  customer_name: data.customer_name || 'Customer',
                  customer_phone: data.customer_phone || '',
                  customer_lat: data.customer_lat,
                  customer_lng: data.customer_lng,
                  created_at: notif.created_at
                })
              }
            } catch (e) {
              console.error('🚨 SOS Popup: Error parsing realtime data:', e)
            }
          }
        )
        .subscribe((status) => {
          console.log('🚨 SOS Popup: Realtime subscription status:', status)
        })
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      stopSound()
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, stopSound])

  // When alert appears, start sound and countdown
  useEffect(() => {
    if (alert) {
      playSOSSound()
      setCountdown(60)
      
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Auto decline when countdown reaches 0
            stopSound()
            setAlert(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [alert, playSOSSound, stopSound])

  if (!alert) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-pulse-slow">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-bounce-gentle">
        {/* Red emergency header */}
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          
          <div className="relative text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">🚨 EMERGENCY SOS</h2>
            <p className="text-red-100 text-sm mt-1">Someone needs your help RIGHT NOW!</p>
            
            {/* Countdown */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white text-sm">
              <span>Auto-dismiss in</span>
              <span className="font-bold text-yellow-300">{countdown}s</span>
            </div>
          </div>
          
          {/* Sound toggle */}
          <button
            onClick={() => isPlaying ? stopSound() : playSOSSound()}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Emergency type badge */}
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              alert.sos_type === 'safety' ? 'bg-red-100 text-red-700' :
              alert.sos_type === 'medical' ? 'bg-blue-100 text-blue-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {alert.sos_type === 'safety' && '🚨 Safety Emergency'}
              {alert.sos_type === 'medical' && '🏥 Medical Emergency'}
              {alert.sos_type === 'dispute' && '⚠️ Dispute Emergency'}
              {!['safety', 'medical', 'dispute'].includes(alert.sos_type) && '🆘 Emergency'}
            </span>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl p-4 border-2 border-red-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{alert.customer_name}</p>
                <p className="text-xs text-gray-500">Needs your help urgently</p>
              </div>
            </div>
            
            {/* Phone number - clickable */}
            {alert.customer_phone && (
              <a 
                href={`tel:${alert.customer_phone}`}
                className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Tap to call customer</p>
                  <p className="font-bold text-green-800 text-lg">{alert.customer_phone}</p>
                </div>
              </a>
            )}
          </div>

          {/* Humanity message */}
          <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 border border-pink-200">
            <div className="flex items-start gap-3">
              <Heart className="w-6 h-6 text-pink-500 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-gray-800 font-medium">
                  Everything is not about money.
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  A fellow human is in trouble and needs help. Show your humanity and respond if you can. Your action could save someone! 🙏
                </p>
              </div>
            </div>
          </div>

          {/* Location info */}
          {alert.customer_lat && alert.customer_lng && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-800">
                Location shared - directions will open on accept
              </span>
            </div>
          )}

          {/* Call emergency */}
          <div className="flex justify-center gap-3 text-sm">
            <a href="tel:100" className="flex items-center gap-1 text-blue-600 hover:underline">
              <Phone className="w-4 h-4" /> Police (100)
            </a>
            <a href="tel:102" className="flex items-center gap-1 text-blue-600 hover:underline">
              <Phone className="w-4 h-4" /> Ambulance (102)
            </a>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-colors"
          >
            Can&apos;t Help Now
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
          >
            <Navigation className="w-5 h-5" />
            I&apos;ll Help!
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 1s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

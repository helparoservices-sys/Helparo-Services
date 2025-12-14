'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { 
  MapPin, 
  IndianRupee, 
  Clock, 
  X,
  Navigation,
  Zap,
  User,
  Camera,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Phone,
  Video,
  Play
} from 'lucide-react'
import { toast } from 'sonner'

interface JobNotification {
  id: string
  request_id: string
  customer_name: string
  customer_phone?: string // Customer phone for calling
  category: string
  description: string
  address: string
  estimated_price: number
  urgency: string
  distance_km: number
  expires_in: number // seconds
  sent_at: string
  photos?: string[] // Customer uploaded photos
  videos?: string[] // Customer uploaded videos with audio
  expected_time?: string // When customer expects resolution
  // AI estimation details
  estimated_duration?: number // in minutes
  confidence?: number // 0-100
  helper_brings?: string[]
  customer_provides?: string[]
  work_overview?: string
  materials_needed?: string[]
}

interface JobNotificationPopupProps {
  notification: JobNotification | null
  onAccept: (requestId: string) => void
  onDecline: (requestId: string) => void
  onClose: () => void
}

export function JobNotificationPopup({ 
  notification, 
  onAccept, 
  onDecline, 
  onClose 
}: JobNotificationPopupProps) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [videoUrls, setVideoUrls] = useState<string[]>([])

  // Cleanup blob URLs when notification changes or component unmounts
  useEffect(() => {
    return () => {
      if (videoUrls && videoUrls.length > 0) {
        videoUrls.forEach(u => {
          try { URL.revokeObjectURL(u) } catch { }
        })
      }
    }
  }, [videoUrls])

  // No timer - helper can take their time to decide
  if (!notification) return null

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await onAccept(notification.request_id)
    } finally {
      setAccepting(false)
    }
  }

  const urgencyConfig = {
    normal: { color: 'bg-blue-500', text: 'Normal' },
    urgent: { color: 'bg-orange-500', text: 'Urgent' },
    emergency: { color: 'bg-red-500', text: 'Emergency' }
  }

  const urgency = urgencyConfig[notification.urgency as keyof typeof urgencyConfig] || urgencyConfig.normal

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Popup Card */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header - Alert Style */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">New Job Alert!</h3>
                  <p className="text-emerald-100 text-sm">Tap to accept this job</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Customer & Category */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{notification.customer_name}</p>
                  <p className="text-sm text-gray-500">needs your help</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Call Customer Button */}
                {notification.customer_phone && (
                  <a
                    href={`tel:${notification.customer_phone}`}
                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors group"
                    title="Call customer to clarify doubts"
                  >
                    <Phone className="h-5 w-5 text-blue-600 group-hover:animate-pulse" />
                  </a>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${urgency.color}`}>
                  {urgency.text}
                </span>
              </div>
            </div>

            {/* Service Type & Full Description */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-600 font-medium mb-2">{notification.category}</p>
              <p className="text-gray-800 font-medium whitespace-pre-wrap">{notification.description}</p>
            </div>

            {/* Customer Photos */}
            {notification.photos && notification.photos.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4 text-gray-600" />
                  <p className="text-xs text-gray-600 font-medium">Photos from Customer (tap to view)</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {notification.photos.map((photo, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors group"
                    >
                      <Image 
                        src={photo} 
                        alt={`Problem photo ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Lightbox Modal */}
            {selectedPhotoIndex !== null && notification.photos && (
              <div 
                className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
                onClick={() => setSelectedPhotoIndex(null)}
              >
                {/* Close button */}
                <button 
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                >
                  <X className="h-6 w-6 text-white" />
                </button>

                {/* Photo counter */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full">
                  <span className="text-white text-sm font-medium">
                    {selectedPhotoIndex + 1} / {notification.photos.length}
                  </span>
                </div>

                {/* Previous button */}
                {notification.photos.length > 1 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPhotoIndex(prev => 
                        prev !== null 
                          ? (prev - 1 + notification.photos!.length) % notification.photos!.length 
                          : 0
                      )
                    }}
                    className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                )}

                {/* Image */}
                <div 
                  className="relative w-full h-full max-w-4xl max-h-[80vh] mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={notification.photos[selectedPhotoIndex]}
                    alt={`Problem photo ${selectedPhotoIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 80vw"
                    priority
                  />
                </div>

                {/* Next button */}
                {notification.photos.length > 1 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPhotoIndex(prev => 
                        prev !== null 
                          ? (prev + 1) % notification.photos!.length 
                          : 0
                      )
                    }}
                    className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                )}

                {/* Thumbnail strip */}
                {notification.photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/10 rounded-xl">
                    {notification.photos.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPhotoIndex(idx)
                        }}
                        className={`relative w-12 h-12 rounded-lg overflow-hidden transition-all ${
                          idx === selectedPhotoIndex 
                            ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-black/50' 
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={photo}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Customer Videos with Audio */}
            {(videoUrls.length > 0 || (notification.videos && notification.videos.length > 0)) && (
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-blue-600 font-medium">Videos from Customer (with audio)</p>
                </div>
                <div className="space-y-2">
                  {(videoUrls.length > 0 ? videoUrls : (notification.videos || [])).map((video, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        src={video}
                        controls
                        className="w-full h-32 object-contain bg-black"
                        preload="metadata"
                        playsInline
                        onError={(e) => console.error('Notification video error', { idx, src: video, e })}
                      />
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        <span>Video {idx + 1}</span>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <a href={video} download={`notification-${notification?.request_id}-video-${idx + 1}.mp4`} className="text-xs bg-white/20 text-white px-2 py-1 rounded">Download</a>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-500 mt-2">
                  🔊 Customer explains the problem in the video — if playback fails, download and play locally
                </p>
              </div>
            )}

            {/* Details Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Price */}
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-lg">
                  <IndianRupee className="h-4 w-4" />
                  {notification.estimated_price}
                </div>
                <p className="text-xs text-gray-500 mt-1">Earnings</p>
              </div>

              {/* Distance */}
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600 font-bold text-lg">
                  <Navigation className="h-4 w-4" />
                  {notification.distance_km.toFixed(1)}
                </div>
                <p className="text-xs text-gray-500 mt-1">km away</p>
              </div>

              {/* Travel Time */}
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-600 font-bold text-lg">
                  <Clock className="h-4 w-4" />
                  ~{Math.max(5, Math.round(notification.distance_km * 3))}
                </div>
                <p className="text-xs text-gray-500 mt-1">min travel</p>
              </div>
            </div>

            {/* Expected Resolution Time */}
            {notification.expected_time && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-600 font-medium">Customer Expects</p>
                  <p className="text-sm text-amber-800 font-semibold">{notification.expected_time}</p>
                </div>
              </div>
            )}

            {/* AI Estimation Details - Always Visible */}
            {(notification.work_overview || (notification.helper_brings && notification.helper_brings.length > 0)) && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-emerald-100/50">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-emerald-800 text-sm">📋 Job Details (AI Analysis)</span>
                </div>
                
                <div className="px-3 pb-3 space-y-3">
                  {/* Work Overview */}
                  {notification.work_overview && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs font-medium text-emerald-700 mb-1">What You'll Do</p>
                      <p className="text-sm text-gray-700">{notification.work_overview}</p>
                    </div>
                  )}

                  {/* Helper Brings & Customer Provides - Side by Side */}
                  <div className="grid grid-cols-2 gap-2">
                    {notification.helper_brings && notification.helper_brings.length > 0 && (
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-xs font-medium text-blue-600 mb-1 flex items-center gap-1">
                          🛠️ You Bring
                        </p>
                        <ul className="space-y-0.5">
                          {notification.helper_brings.slice(0, 4).map((item, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                              <span className="text-emerald-500 mt-0.5">✓</span>
                              <span className="line-clamp-1">{item}</span>
                            </li>
                          ))}
                          {notification.helper_brings.length > 4 && (
                            <li className="text-xs text-gray-400">+{notification.helper_brings.length - 4} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {notification.customer_provides && notification.customer_provides.length > 0 && (
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-xs font-medium text-orange-600 mb-1 flex items-center gap-1">
                          👤 Customer Has
                        </p>
                        <ul className="space-y-0.5">
                          {notification.customer_provides.slice(0, 4).map((item, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                              <span className="text-orange-500 mt-0.5">✓</span>
                              <span className="line-clamp-1">{item}</span>
                            </li>
                          ))}
                          {notification.customer_provides.length > 4 && (
                            <li className="text-xs text-gray-400">+{notification.customer_provides.length - 4} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Materials Needed */}
                  {notification.materials_needed && notification.materials_needed.length > 0 && (
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs font-medium text-purple-600 mb-1">📦 Materials May Be Needed</p>
                      <div className="flex flex-wrap gap-1">
                        {notification.materials_needed.slice(0, 5).map((item, idx) => (
                          <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {item}
                          </span>
                        ))}
                        {notification.materials_needed.length > 5 && (
                          <span className="text-xs text-gray-400">+{notification.materials_needed.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Duration & Confidence */}
                  {(notification.estimated_duration || notification.confidence) && (
                    <div className="flex gap-2">
                      {notification.estimated_duration && (
                        <div className="flex-1 bg-white rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-emerald-600">~{notification.estimated_duration}</p>
                          <p className="text-xs text-gray-500">min est.</p>
                        </div>
                      )}
                      {notification.confidence && (
                        <div className="flex-1 bg-white rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-blue-600">{notification.confidence}%</p>
                          <p className="text-xs text-gray-500">AI confidence</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address */}
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <MapPin className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Service Location</p>
                <p className="text-sm text-gray-800 font-medium">{notification.address}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 p-5 pt-0">
            <Button
              variant="outline"
              onClick={() => onDecline(notification.request_id)}
              className="flex-1 h-14 text-base font-semibold border-2 border-gray-200 hover:bg-gray-100"
              disabled={accepting}
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-[2] h-14 text-base font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200"
            >
              {accepting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accepting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Accept Job
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// Hook to listen for job notifications in real-time
export function useJobNotifications() {
  const [notification, setNotification] = useState<JobNotification | null>(null)
  const [helperProfile, setHelperProfile] = useState<{ id: string } | null>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const seenNotificationIds = useRef<Set<string>>(new Set())
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // Use refs to track current values for realtime callbacks (avoids stale closures)
  const notificationRef = useRef<JobNotification | null>(null)
  const authUserIdRef = useRef<string | null>(null)
  
  // Keep refs in sync with state
  useEffect(() => { notificationRef.current = notification }, [notification])
  useEffect(() => { authUserIdRef.current = authUserId }, [authUserId])

  // Function to play alert sound once
  const playAlertSoundOnce = useCallback(() => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const audioContext = audioContextRef.current
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        osc.type = 'square'
        osc.frequency.value = freq
        gain.gain.value = 0.5
        osc.connect(gain)
        gain.connect(audioContext.destination)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      
      const now = audioContext.currentTime
      // Play urgent 3-tone pattern
      playTone(880, now, 0.12)
      playTone(660, now + 0.15, 0.12)
      playTone(880, now + 0.30, 0.12)
      
      // Vibrate on mobile
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
    } catch (err) {
      console.log('Audio not supported', err)
    }
  }, [])

  // Continuous sound loop when notification is active
  useEffect(() => {
    if (notification) {
      console.log('🔔 Starting continuous notification sound')
      // Play immediately
      playAlertSoundOnce()
      
      // Then play every 2.5 seconds until dismissed
      soundIntervalRef.current = setInterval(() => {
        playAlertSoundOnce()
      }, 2500)
      
      return () => {
        console.log('🔔 Stopping notification sound')
        if (soundIntervalRef.current) {
          clearInterval(soundIntervalRef.current)
          soundIntervalRef.current = null
        }
      }
    } else {
      // Clear interval if notification is dismissed
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current)
        soundIntervalRef.current = null
      }
    }
  }, [notification, playAlertSoundOnce])

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current)
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Cleanup video blob URLs when notification changes
  useEffect(() => {
    return () => {
      if (videoUrls && videoUrls.length > 0) {
        videoUrls.forEach(u => {
          try { URL.revokeObjectURL(u) } catch { }
        })
      }
    }
  }, [videoUrls])

  useEffect(() => {
    // Get helper profile
    async function getProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('🔔 No user found for job notifications')
        return
      }

      setAuthUserId(user.id)

      const { data: profile, error } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.log('🔔 Error getting helper profile:', error)
        return
      }

      const typedProfile = profile as { id: string } | null
      if (typedProfile) {
        console.log('🔔 Helper profile found:', typedProfile.id)
        setHelperProfile(typedProfile)
      }
    }
    getProfile()
  }, [])

  // Poll for new notifications as backup (every 5 seconds)
  useEffect(() => {
    if (!helperProfile) return

    console.log('🔔 Starting polling fallback for helper:', helperProfile.id)

    const checkForNewNotifications = async () => {
      try {
        const supabase = createClient()
        const { data: rawData, error } = await supabase
          .from('broadcast_notifications')
          .select(`
            *,
            service_request:request_id (
              id,
              title,
              description,
              service_address,
              address_line1,
              estimated_price,
              urgency_level,
              images,
              status,
              service_type_details,
              category:category_id (name),
              customer:customer_id (full_name, phone)
            )
          `)
          .eq('helper_id', helperProfile.id)
          .in('status', ['sent', 'pending']) // Match 'sent' status from broadcast API
          .order('sent_at', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.log('🔔 Poll check error:', error.message)
          return
        }
        
        // Type assertion for the query result
        const data = rawData as {
          id: string
          request_id: string
          distance_km: string
          sent_at: string
          service_request: Record<string, unknown> | null
        } | null
        
        const currentNotification = notificationRef.current

        // Skip if already showing a notification or already seen this one
        if (data && !currentNotification && !seenNotificationIds.current.has(data.id)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const req = data.service_request as Record<string, any>
          if (!req) {
            console.log('🔔 [POLL] No service request data for notification:', data.id)
            return
          }
          
          // Skip if job is already cancelled or assigned
          const jobStatus = req.status || ''
          if (jobStatus === 'cancelled' || jobStatus === 'assigned' || jobStatus === 'completed') {
            console.log('🔔 [POLL] Skipping notification - job status:', jobStatus)
            seenNotificationIds.current.add(data.id)
            return
          }

          seenNotificationIds.current.add(data.id)
          console.log('🔔 [POLL] Found new notification:', data.id, 'for request:', data.request_id)
          
          const serviceDetails = req.service_type_details || {}
          let expectedTime = serviceDetails.preferred_time || ''
          if (expectedTime === 'asap') expectedTime = 'As soon as possible'
          else if (expectedTime === 'today') expectedTime = 'Today'
          else if (expectedTime === 'tomorrow') expectedTime = 'Tomorrow'
          else if (expectedTime === 'this_week') expectedTime = 'This week'
          
          const images = serviceDetails.images || req.images || []
          const videos = serviceDetails.videos || []
          
          setNotification({
            id: data.id,
            request_id: data.request_id,
            customer_name: req.customer?.full_name || 'Customer',
            customer_phone: req.customer?.phone || undefined,
            category: req.category?.name || 'Service',
            description: req.description || req.title,
            address: req.service_address || req.address_line1 || 'Address not provided',
            estimated_price: req.estimated_price || 0,
            urgency: req.urgency_level || 'normal',
            distance_km: parseFloat(data.distance_km) || 0,
            expires_in: 30,
            sent_at: data.sent_at,
            photos: images,
            videos: videos,
            expected_time: expectedTime || undefined,
            estimated_duration: serviceDetails.estimated_duration,
            confidence: serviceDetails.confidence,
            helper_brings: serviceDetails.helper_brings || [],
            customer_provides: serviceDetails.customer_provides || [],
            work_overview: serviceDetails.work_overview || '',
            materials_needed: serviceDetails.materials_needed || []
          })

          // Prepare video URLs
          try {
            const prepared: string[] = await Promise.all(videos.map(async (v: string) => {
              if (v.startsWith('data:')) {
                const r = await fetch(v)
                const b = await r.blob()
                return URL.createObjectURL(b)
              }
              return v
            }))
            setVideoUrls(prepared)
          } catch (err) {
            console.error('Failed to prepare notification videos', err)
          }
          // Sound is now handled by the continuous sound loop useEffect
        }
      } catch (err) {
        console.error('🔔 Poll error:', err)
      }
    }

    // Also poll to check if currently shown job was taken by someone else
    const checkIfJobTaken = async () => {
      const currentNotification = notificationRef.current
      if (!currentNotification) return
      
      try {
        const supabase = createClient()
        const { data: rawRequest } = await supabase
          .from('service_requests')
          .select('status, assigned_helper_id')
          .eq('id', currentNotification.request_id)
          .single()
        
        const request = rawRequest as { status: string; assigned_helper_id: string | null } | null
        
        if (request) {
          const currentUserId = authUserIdRef.current
          // Job was assigned to someone else
          if (request.status === 'assigned' && request.assigned_helper_id && request.assigned_helper_id !== currentUserId) {
            console.log('🔔 [POLL] Job taken by another helper, dismissing')
            toast.error('Ooops, you are late — better luck next time! 😅')
            setNotification(null)
          }
          // Job was cancelled
          if (request.status === 'cancelled') {
            console.log('🔔 [POLL] Job cancelled, dismissing')
            toast.info('This job has been cancelled by the customer')
            setNotification(null)
          }
        }
      } catch (err) {
        console.error('🔔 Error checking job status:', err)
      }
    }

    // Initial check
    checkForNewNotifications()

    // Poll every 3 seconds for new notifications and job status
    const pollInterval = setInterval(() => {
      checkForNewNotifications()
      checkIfJobTaken()
    }, 3000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [helperProfile])

  useEffect(() => {
    if (!helperProfile) {
      console.log('🔔 No helper profile yet, not subscribing')
      return
    }
    
    console.log('🔔 Setting up realtime subscription for helper:', helperProfile.id)
    const supabase = createClient()

    // Subscribe to real-time notifications (new job broadcast)
    const channel = supabase
      .channel(`job-notifications-${helperProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broadcast_notifications',
          filter: `helper_id=eq.${helperProfile.id}`
        },
        async (payload) => {
          console.log('🔔 New job notification received:', payload)
          
          // Fetch full notification details
          const { data: rawData, error } = await supabase
            .from('broadcast_notifications')
            .select(`
              *,
              service_request:request_id (
                id,
                title,
                description,
                service_address,
                address_line1,
                estimated_price,
                urgency_level,
                images,
                status,
                service_type_details,
                category:category_id (name),
                customer:customer_id (full_name, phone)
              )
            `)
            .eq('id', payload.new.id)
            .single()
          
          if (error) {
            console.error('🔔 Error fetching notification details:', error)
            return
          }
          
          // Type assertion for the query result
          const data = rawData as {
            id: string
            request_id: string
            distance_km: string
            sent_at: string
            service_request: Record<string, unknown> | null
          } | null

          if (data && data.service_request) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const req = data.service_request as Record<string, any>
            
            // Parse expected time from service_type_details
            const serviceDetails = req.service_type_details || {}
            let expectedTime = serviceDetails.preferred_time || ''
            if (expectedTime === 'asap') expectedTime = 'As soon as possible'
            else if (expectedTime === 'today') expectedTime = 'Today'
            else if (expectedTime === 'tomorrow') expectedTime = 'Tomorrow'
            else if (expectedTime === 'this_week') expectedTime = 'This week'
            
            // Get images and videos from service_type_details (or fallback to req.images)
            const images = serviceDetails.images || req.images || []
            const videos = serviceDetails.videos || []
            
            setNotification({
              id: data.id,
              request_id: data.request_id,
              customer_name: req.customer?.full_name || 'Customer',
              customer_phone: req.customer?.phone || undefined,
              category: req.category?.name || 'Service',
              description: req.description || req.title,
              address: req.service_address || req.address_line1 || 'Address not provided',
              estimated_price: req.estimated_price || 0,
              urgency: req.urgency_level || 'normal',
              distance_km: parseFloat(data.distance_km) || 0,
              expires_in: 30,
              sent_at: data.sent_at,
              photos: images,
              videos: videos,
              expected_time: expectedTime || undefined,
              // AI estimation details
              estimated_duration: serviceDetails.estimated_duration,
              confidence: serviceDetails.confidence,
              helper_brings: serviceDetails.helper_brings || [],
              customer_provides: serviceDetails.customer_provides || [],
              work_overview: serviceDetails.work_overview || '',
              materials_needed: serviceDetails.materials_needed || []
            })

            // Prepare video blob URLs for playback (convert data: URLs to blob object URLs)
            try {
              const rawVideos = videos || []
              const prepared: string[] = await Promise.all(rawVideos.map(async (v: string) => {
                try {
                  if (v.startsWith('blob:') || v.startsWith('http') || v.startsWith('data:')) {
                    // If it's data: URL or already blob/http, attempt to convert data: to blob URL; leave http/blob as-is
                    if (v.startsWith('data:')) {
                      const r = await fetch(v)
                      const b = await r.blob()
                      return URL.createObjectURL(b)
                    }
                    return v
                  }
                  return v
                } catch (err) {
                  console.error('Error preparing single notification video', err)
                  return v
                }
              }))
              // store prepared URLs in a stateful variable (so rendering can use blob URLs)
              setVideoUrls(prepared)
            } catch (err) {
              console.error('Failed to prepare notification videos', err)
            }
            // Sound is now handled by the continuous sound loop useEffect
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status)
      })

    // If another helper accepts, our broadcast_notification row is marked 'expired'
    // We must listen to UPDATEs to dismiss any currently open popup.
    const statusChannel = supabase
      .channel(`job-notification-status-${helperProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'broadcast_notifications',
          filter: `helper_id=eq.${helperProfile.id}`
        },
        (payload) => {
          const updated = payload.new as { id?: string; request_id?: string; status?: string }
          if (!updated?.request_id) return
          
          const currentNotification = notificationRef.current

          // If the currently shown job is no longer available for this helper
          if (currentNotification?.request_id === updated.request_id && updated.status === 'expired') {
            console.log('🔔 Notification expired (accepted by another helper), dismissing popup')
            toast.error('Ooops, you are late — better luck next time! 😅')
            setNotification(null)
            if (updated.id) seenNotificationIds.current.add(updated.id)
          }
        }
      )
      .subscribe()

    // Also subscribe to service_request changes to detect cancellations/assignment by others
    const cancellationChannel = supabase
      .channel(`job-cancellations-${helperProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests'
        },
        (payload) => {
          console.log('🔔 Service request update received:', payload)
          const newData = payload.new as { id: string; status?: string; broadcast_status?: string; assigned_helper_id?: string | null }
          
          const currentNotification = notificationRef.current
          const currentUserId = authUserIdRef.current
          
          // Check if this is the currently displayed notification being cancelled
          if (currentNotification && currentNotification.request_id === newData.id) {
            if (newData.status === 'cancelled') {
              console.log('🔔 Current notification cancelled, dismissing popup')
              toast.info('This job has been cancelled by the customer')
              setNotification(null)
              return
            }

            // If this job was assigned (accepted) and it wasn't assigned to this logged-in helper,
            // show the "late" message and dismiss.
            if (newData.status === 'assigned') {
              if (newData.assigned_helper_id && currentUserId && newData.assigned_helper_id !== currentUserId) {
                console.log('🔔 Job assigned to another helper, dismissing popup')
                toast.error('Ooops, you are late — better luck next time! 😅')
                setNotification(null)
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      console.log('🔔 Cleaning up subscription')
      supabase.removeChannel(channel)
      supabase.removeChannel(statusChannel)
      supabase.removeChannel(cancellationChannel)
    }
  }, [helperProfile])

  const acceptJob = useCallback(async (requestId: string) => {
    if (!helperProfile) return

    try {
      // Get fresh location before accepting
      let helperLat: number | null = null
      let helperLng: number | null = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            })
          })
          helperLat = position.coords.latitude
          helperLng = position.coords.longitude
          console.log('📍 Got fresh location for accept:', helperLat, helperLng)
          
          // Update helper_profiles with fresh location
          const supabase = createClient()
          await supabase
            .from('helper_profiles')
            .update({
              current_location_lat: helperLat,
              current_location_lng: helperLng,
              location_updated_at: new Date().toISOString()
            } as never)
            .eq('id', helperProfile.id)
        } catch (err) {
          console.log('⚠️ Could not get fresh location:', err)
        }
      }
      
      const response = await fetch('/api/requests/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          helperId: helperProfile.id,
          helperLat,
          helperLng
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Another helper already took it / job no longer available
        if (response.status === 409) {
          toast.error('Ooops, you are late — better luck next time! 😅')
          setNotification(null)
          return
        }
        throw new Error(data.error || 'Failed to accept job')
      }

      toast.success('🎉 Job accepted! Contact details shared.')
      setNotification(null)
      
      // Redirect to job details
      router.push(`/helper/jobs/${requestId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept job'
      toast.error(message)
    }
  }, [helperProfile])

  const declineJob = useCallback(async (requestId: string) => {
    if (!helperProfile) return

    // Simply close the notification
    setNotification(null)
    
    // Fire and forget the update
    try {
      const supabase = createClient()
      void supabase
        .from('broadcast_notifications')
        .update({ status: 'declined', responded_at: new Date().toISOString() } as never)
        .eq('request_id', requestId)
        .eq('helper_id', helperProfile.id)
    } catch {
      // Ignore errors - just dismiss UI
    }
  }, [helperProfile])

  const closeNotification = useCallback(() => {
    setNotification(null)
  }, [])

  return {
    notification,
    acceptJob,
    declineJob,
    closeNotification
  }
}

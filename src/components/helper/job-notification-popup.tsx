'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [accepting, setAccepting] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

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
            {notification.videos && notification.videos.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-blue-600 font-medium">Videos from Customer (with audio)</p>
                </div>
                <div className="space-y-2">
                  {notification.videos.map((video, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden bg-black">
                      <video 
                        src={video}
                        controls
                        className="w-full h-32 object-contain"
                        preload="metadata"
                      />
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        <span>Video {idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-500 mt-2">
                  🔊 Customer explains the problem in the video
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

  useEffect(() => {
    // Get helper profile
    async function getProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('🔔 No user found for job notifications')
        return
      }

      const { data: profile, error } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.log('🔔 Error getting helper profile:', error)
        return
      }

      if (profile) {
        console.log('🔔 Helper profile found:', profile.id)
        setHelperProfile(profile)
      }
    }
    getProfile()
  }, [])

  useEffect(() => {
    if (!helperProfile) {
      console.log('🔔 No helper profile yet, not subscribing')
      return
    }
    
    console.log('🔔 Setting up realtime subscription for helper:', helperProfile.id)
    const supabase = createClient()

    // Subscribe to real-time notifications
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
          const { data, error } = await supabase
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
              expected_time: expectedTime || undefined
            })

            // Play notification sound
            try {
              const audio = new Audio('/sounds/notification.mp3')
              audio.play()
            } catch {
              console.log('Could not play notification sound')
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status)
      })

    return () => {
      console.log('🔔 Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [helperProfile])

  const acceptJob = useCallback(async (requestId: string) => {
    if (!helperProfile) return

    try {
      const response = await fetch('/api/requests/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, helperId: helperProfile.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept job')
      }

      toast.success('🎉 Job accepted! Contact details shared.')
      setNotification(null)
      
      // Redirect to job details
      window.location.href = `/helper/jobs/${requestId}`
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept job'
      toast.error(message)
    }
  }, [helperProfile])

  const declineJob = useCallback(async (requestId: string) => {
    if (!helperProfile) return

    try {
      const supabase = createClient()
      await supabase
        .from('broadcast_notifications')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('request_id', requestId)
        .eq('helper_id', helperProfile.id)

      setNotification(null)
    } catch (error) {
      console.error('Failed to decline job:', error)
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

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  IndianRupee, 
  Clock, 
  Navigation,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Star,
  Shield,
  Copy,
  RefreshCw,
  PartyPopper,
  Banknote,
  CreditCard,
  ThumbsUp,
  Smartphone,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

// Job Completion Popup for Customer
function JobCompletionPopup({
  isOpen,
  job,
  onRate,
  onClose,
  onQuickRate,
  onPayNow
}: {
  isOpen: boolean
  job: JobDetails
  onRate: () => void
  onClose: () => void
  onQuickRate: (rating: number) => void
  onPayNow?: () => void
}) {
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  
  if (!isOpen) return null

  const isCash = job.payment_method === 'cash'
  const helperName = job.assigned_helper?.profile?.full_name || 'Helper'
  const displayRating = hoveredRating || selectedRating

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating)
    // Submit quick rating after a small delay
    setTimeout(() => {
      onQuickRate(rating)
    }, 300)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Popup Card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Job Completed! 🎉</h2>
          <p className="text-emerald-100">
            Hope you got the help you needed!
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Helper Info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{helperName}</p>
              <p className="text-sm text-gray-500">completed your service</p>
            </div>
            <ThumbsUp className="h-6 w-6 text-emerald-500 ml-auto" />
          </div>

          {/* Payment Info */}
          <div className={`rounded-xl p-4 ${isCash ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              {isCash ? (
                <Banknote className="h-5 w-5 text-amber-600" />
              ) : (
                <CreditCard className="h-5 w-5 text-blue-600" />
              )}
              <span className={`text-sm font-medium ${isCash ? 'text-amber-700' : 'text-blue-700'}`}>
                {isCash ? 'Cash Payment' : 'Online Payment'}
              </span>
            </div>
            
            <div className="text-center">
              <p className={`text-sm ${isCash ? 'text-amber-600' : 'text-blue-600'} mb-1`}>
                {isCash ? 'Please pay cash to the helper' : 'Payment will be processed'}
              </p>
              <div className={`flex items-center justify-center gap-1 ${isCash ? 'text-amber-700' : 'text-blue-700'}`}>
                <IndianRupee className="h-8 w-8" />
                <span className="text-4xl font-bold">{job.estimated_price}</span>
              </div>
            </div>
          </div>

          {/* Interactive Rating */}
          <div className="text-center bg-emerald-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-3">How was your experience?</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-125 active:scale-110"
                >
                  <Star 
                    className={`h-8 w-8 transition-colors ${
                      star <= displayRating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {displayRating === 0 && 'Tap a star to rate'}
              {displayRating === 5 && '⭐ Excellent!'}
              {displayRating === 4 && '😊 Great!'}
              {displayRating === 3 && '👍 Good'}
              {displayRating === 2 && '😐 Fair'}
              {displayRating === 1 && '😞 Poor'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Pay Now Button for Online Payments */}
            {!isCash && onPayNow && (
              <Button 
                onClick={onPayNow}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 text-lg font-semibold rounded-xl"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ₹{job.estimated_price} Now
              </Button>
            )}
            <Button 
              onClick={onRate}
              className={`w-full ${isCash ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} py-6 text-lg font-semibold rounded-xl`}
            >
              <Star className="h-5 w-5 mr-2" />
              {selectedRating > 0 ? 'Add Detailed Review' : `Rate ${helperName}`}
            </Button>
            <button
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Google Maps Live Tracking Component
function LiveTrackingMap({ 
  customerLat, 
  customerLng, 
  helperLat, 
  helperLng,
  helperName,
  nearbyHelpers,
  isBroadcasting
}: { 
  customerLat: number
  customerLng: number
  helperLat: number | null
  helperLng: number | null
  helperName?: string
  nearbyHelpers?: Array<{
    id: string
    lat: number
    lng: number
    name: string
    rating: number
    isOnline: boolean
    isOnJob: boolean
    distance: number
  }>
  isBroadcasting?: boolean
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const helperMarkerRef = useRef<google.maps.Marker | null>(null)
  const customerMarkerRef = useRef<google.maps.Marker | null>(null)
  const nearbyMarkersRef = useRef<google.maps.Marker[]>([])
  const hasFitBoundsRef = useRef(false) // Track if we've already fit bounds
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const hasHelperLocation = helperLat !== null && helperLng !== null && helperLat !== 0 && helperLng !== 0
  
  // Calculate distance and ETA
  let distance = 0
  let eta = 0
  if (hasHelperLocation) {
    const R = 6371
    const dLat = (helperLat - customerLat) * Math.PI / 180
    const dLng = (helperLng - customerLng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(customerLat * Math.PI / 180) * Math.cos(helperLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    distance = R * c
    eta = Math.max(1, Math.round((distance / 25) * 60)) // Assuming 25 km/h average speed
  }

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setMapLoaded(true)
      document.head.appendChild(script)
    } else if (window.google) {
      setMapLoaded(true)
    }
  }, [])

  // Initialize map - only once
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return
    
    // Don't reinitialize if map already exists
    if (mapInstanceRef.current) return

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: customerLat, lng: customerLng },
      zoom: 14, // Start with a reasonable zoom level
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
      ]
    })

    mapInstanceRef.current = map

    // Customer marker - Home icon (destination)
    customerMarkerRef.current = new google.maps.Marker({
      position: { lat: customerLat, lng: customerLng },
      map: map,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
            <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28s20-13 20-28C40 9 31 0 20 0z" fill="#EF4444"/>
            <circle cx="20" cy="20" r="16" fill="white"/>
            <path d="M20 10l-8 7v9h5v-5h6v5h5v-9l-8-7z" fill="#EF4444"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 48),
        anchor: new google.maps.Point(20, 48),
      },
      title: 'Your Location'
    })

    // Add info window for customer location
    const customerInfo = new google.maps.InfoWindow({
      content: '<div style="padding:4px;font-weight:bold;color:#EF4444">🏠 Service Location</div>'
    })
    customerMarkerRef.current.addListener('click', () => {
      customerInfo.open(map, customerMarkerRef.current)
    })

      return () => {
        if (customerMarkerRef.current) customerMarkerRef.current.setMap(null)
        if (helperMarkerRef.current) helperMarkerRef.current.setMap(null)
        // Clear nearby helper markers
        nearbyMarkersRef.current.forEach(marker => marker.setMap(null))
        nearbyMarkersRef.current = []
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, customerLat, customerLng])

  // Show nearby helpers when broadcasting
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !nearbyHelpers || nearbyHelpers.length === 0) {
      // Clear existing markers if no nearby helpers
      nearbyMarkersRef.current.forEach(marker => marker.setMap(null))
      nearbyMarkersRef.current = []
      return
    }

    // Clear existing nearby markers
    nearbyMarkersRef.current.forEach(marker => marker.setMap(null))
    nearbyMarkersRef.current = []

    // Create markers for each nearby helper
    nearbyHelpers.forEach((helper, index) => {
      // Different colors based on status
      const isAvailable = helper.isOnline && !helper.isOnJob
      const markerColor = isAvailable ? '#10B981' : '#6B7280' // Green if available, gray if busy/offline
      
      const marker = new google.maps.Marker({
        position: { lat: helper.lat, lng: helper.lng },
        map: mapInstanceRef.current!,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="${markerColor}" stroke="white" stroke-width="2"/>
              <g fill="white" transform="translate(8, 10)">
                <circle cx="3" cy="11" r="2.5" fill="none" stroke="white" stroke-width="1.5"/>
                <circle cx="17" cy="11" r="2.5" fill="none" stroke="white" stroke-width="1.5"/>
                <path d="M3 11l3-6h4l2 3h4l-2 3" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11 8l2 3h4" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="7" cy="3" r="1.5" fill="white"/>
              </g>
            </svg>
          `),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
        title: helper.name,
        animation: google.maps.Animation.DROP,
        zIndex: 100 - index // Nearest helpers on top
      })

      // Add info window
      const infoContent = `
        <div style="padding:8px;min-width:120px;">
          <p style="font-weight:bold;color:#10B981;margin:0 0 4px 0;">🏍️ ${helper.name}</p>
          <p style="font-size:12px;color:#666;margin:0 0 2px 0;">⭐ ${helper.rating > 0 ? helper.rating.toFixed(1) : 'New'}</p>
          <p style="font-size:12px;color:#666;margin:0 0 2px 0;">📍 ${helper.distance} km away</p>
          <p style="font-size:11px;color:${isAvailable ? '#10B981' : '#6B7280'};margin:0;">
            ${isAvailable ? '🟢 Available' : (helper.isOnJob ? '🟡 On another job' : '⚫ Offline')}
          </p>
        </div>
      `
      const infoWindow = new google.maps.InfoWindow({ content: infoContent })
      
      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker)
      })

      nearbyMarkersRef.current.push(marker)
    })

    // Fit bounds to show all markers ONLY ONCE on initial load
    if (isBroadcasting && nearbyHelpers.length > 0 && !hasFitBoundsRef.current) {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend({ lat: customerLat, lng: customerLng })
      nearbyHelpers.forEach(helper => {
        bounds.extend({ lat: helper.lat, lng: helper.lng })
      })
      mapInstanceRef.current.fitBounds(bounds, { top: 80, right: 60, bottom: 80, left: 60 })
      hasFitBoundsRef.current = true // Mark that we've fit bounds
    }

  }, [nearbyHelpers, customerLat, customerLng, isBroadcasting])

  // Update helper marker when location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !hasHelperLocation) return

    if (helperMarkerRef.current) {
      // Animate marker to new position
      helperMarkerRef.current.setPosition({ lat: helperLat, lng: helperLng })
    } else {
      // Create helper marker - Bike icon (moving)
      helperMarkerRef.current = new google.maps.Marker({
        position: { lat: helperLat, lng: helperLng },
        map: mapInstanceRef.current,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="20" fill="#10B981" stroke="white" stroke-width="3"/>
              <g fill="white" transform="translate(10, 12)">
                <circle cx="4" cy="14" r="3.5" fill="none" stroke="white" stroke-width="2"/>

                <circle cx="20" cy="14" r="3.5" fill="none" stroke="white" stroke-width="2"/>
                <path d="M4 14l4-8h5l2 4h5l-2 4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 10l3 4h4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <circle cx="9" cy="4" r="2" fill="white"/>
              </g>
            </svg>
          `),
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
        title: helperName || 'Helper'
      })

      // Add info window for helper
      const helperInfo = new google.maps.InfoWindow({
        content: `<div style="padding:4px;font-weight:bold;color:#10B981">🏍️ ${helperName || 'Helper'}</div>`
      })
      helperMarkerRef.current.addListener('click', () => {
        helperInfo.open(mapInstanceRef.current, helperMarkerRef.current)
      })

      // Fit bounds ONLY when helper marker is first created (not on every update)
      if (!hasFitBoundsRef.current) {
        const bounds = new google.maps.LatLngBounds()
        bounds.extend({ lat: customerLat, lng: customerLng })
        bounds.extend({ lat: helperLat, lng: helperLng })
        mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })
        hasFitBoundsRef.current = true
      }
    }

  }, [helperLat, helperLng, hasHelperLocation, customerLat, customerLng, helperName])

  return (
    <div className="h-full w-full relative">
      {/* Map container */}
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Fallback if map not loaded */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Live indicator */}
      {hasHelperLocation && (
        <div className="absolute top-4 left-4 bg-white/95 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 z-10">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-700">Live Tracking</span>
        </div>
      )}

      {/* Distance & ETA overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {hasHelperLocation ? `${distance.toFixed(1)} km away` : 'Waiting for location...'}
              </p>
              <p className="text-xs text-gray-500">
                {hasHelperLocation ? `ETA: ~${eta} min` : 'Helper will share location soon'}
              </p>
            </div>
          </div>
          {hasHelperLocation && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Last updated</p>
              <p className="text-xs font-medium text-emerald-600">Just now</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/95 rounded-lg p-2 shadow-lg z-10">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🏠</span>
            <span className="text-xs text-gray-600">Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🏍️</span>
            <span className="text-xs text-gray-600">Helper</span>
          </div>
          {isBroadcasting && nearbyHelpers && nearbyHelpers.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-1"></div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <span className="text-xs text-gray-600">Busy/Offline</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nearby helpers count badge when broadcasting */}
      {isBroadcasting && nearbyHelpers && nearbyHelpers.length > 0 && (
        <div className="absolute top-4 left-4 bg-emerald-500 text-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 z-10">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-semibold">{nearbyHelpers.length} helpers nearby</span>
        </div>
      )}
    </div>
  )
}

interface JobDetails {
  id: string
  title: string
  description: string
  status: string
  broadcast_status: string
  service_address: string
  estimated_price: number
  payment_method: string
  start_otp: string | null
  end_otp: string | null
  urgency_level: string
  service_location_lat: number
  service_location_lng: number
  helper_location_lat: number | null
  helper_location_lng: number | null
  created_at: string
  helper_accepted_at: string | null
  work_started_at: string | null
  work_completed_at: string | null
  assigned_helper?: {
    id: string
    user_id: string
    avg_rating: number
    total_jobs_completed: number
    profile: {
      full_name: string
      phone: string
      avatar_url: string | null
    }
  } | null
  category?: {
    name: string
    icon: string
  }
}

const statusSteps = [
  { key: 'broadcasting', label: 'Finding Helper', icon: RefreshCw },
  { key: 'accepted', label: 'Helper Assigned', icon: User },
  { key: 'on_way', label: 'On the Way', icon: Navigation },
  { key: 'arrived', label: 'Arrived', icon: MapPin },
  { key: 'in_progress', label: 'Work Started', icon: Clock },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
]

export default function JobTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string
  
  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCompletionPopup, setShowCompletionPopup] = useState(false)
  const [completionPopupShown, setCompletionPopupShown] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(false)
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [nearbyHelpers, setNearbyHelpers] = useState<Array<{
    id: string
    lat: number
    lng: number
    name: string
    rating: number
    isOnline: boolean
    isOnJob: boolean
    distance: number
  }>>([])

  // Fetch nearby helpers when broadcasting
  async function fetchNearbyHelpers(lat: number, lng: number, categoryId?: string) {
    try {
      console.log('🔍 Fetching nearby helpers...', { lat, lng, categoryId })
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: '50' // 50km radius for better coverage
      })
      if (categoryId) {
        params.append('categoryId', categoryId)
      }

      const response = await fetch(`/api/helpers/nearby?${params}`)
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`🏍️ Found ${data.count} nearby helpers (total approved: ${data.totalApproved})`, data.helpers)
        setNearbyHelpers(data.helpers || [])
      } else {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
      }
    } catch (error) {
      console.error('❌ Failed to fetch nearby helpers:', error)
    }
  }

  useEffect(() => {
    loadJobDetails()
    
    // Subscribe to real-time updates
    const supabase = createClient()
    const channel = supabase
      .channel(`job-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${requestId}`
        },
        (payload) => {
          console.log('📍 Real-time update received:', payload)
          loadJobDetails()
        }
      )
      .subscribe()

    // Poll for helper location updates more frequently for live tracking
    const locationInterval = setInterval(() => {
      loadJobDetails()
    }, 5000) // Every 5 seconds for smoother live tracking

    return () => {
      supabase.removeChannel(channel)
      clearInterval(locationInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  async function loadJobDetails() {
    try {
      console.log('🔍 Loading job details for:', requestId)
      
      // Use API endpoint to bypass RLS issues
      const response = await fetch(`/api/requests/${requestId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || 'Failed to load job')
      }

      const data = await response.json()
      console.log('✅ Job loaded:', data)

      // Transform the data with fallbacks for missing fields
      const transformedData: JobDetails = {
        id: data.id,
        title: data.title || 'Service Request',
        description: data.description || '',
        status: data.status || 'open',
        broadcast_status: data.broadcast_status || 'broadcasting',
        service_address: data.service_address || data.address_line1 || 'Address not available',
        estimated_price: data.estimated_price || 0,
        payment_method: data.payment_method || 'cash',
        start_otp: data.start_otp || null,
        end_otp: data.end_otp || null,
        urgency_level: data.urgency_level || 'normal',
        service_location_lat: data.service_location_lat || data.latitude || 0,
        service_location_lng: data.service_location_lng || data.longitude || 0,
        helper_location_lat: data.helper_location_lat || null,
        helper_location_lng: data.helper_location_lng || null,
        created_at: data.created_at,
        helper_accepted_at: data.helper_accepted_at || null,
        work_started_at: data.work_started_at || null,
        work_completed_at: data.work_completed_at || null,
        assigned_helper: data.assigned_helper || null,
        category: data.category || undefined
      }

      setJob(transformedData)

      // Fetch nearby helpers when broadcasting (not yet assigned)
      console.log('📊 Job status:', transformedData.broadcast_status, 'Assigned:', !!transformedData.assigned_helper)
      if (transformedData.broadcast_status === 'broadcasting' && !transformedData.assigned_helper) {
        console.log('✅ Broadcasting - fetching nearby helpers')
        if (transformedData.service_location_lat && transformedData.service_location_lng) {
          fetchNearbyHelpers(
            transformedData.service_location_lat,
            transformedData.service_location_lng,
            data.category_id // Pass category to filter relevant helpers
          )
        } else {
          console.log('❌ No service location for job')
        }
      } else {
        console.log('ℹ️ Not broadcasting or already assigned - clearing nearby helpers')
        // Clear nearby helpers once assigned
        setNearbyHelpers([])
      }

      // Show completion popup when job is completed (only once)
      if (transformedData.status === 'completed' && !completionPopupShown) {
        setShowCompletionPopup(true)
        setCompletionPopupShown(true)
      }
    } catch (error) {
      console.error('Failed to load job:', error)
    } finally {
      setLoading(false)
    }
  }

  async function cancelJob() {
    if (!job) return
    
    setCancelling(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'cancelled',
          broadcast_status: 'cancelled',
          cancellation_reason: 'Cancelled by customer',
          cancelled_by: 'customer'
        })
        .eq('id', requestId)

      if (error) throw error

      toast.success('Job cancelled successfully')
      router.push('/customer/requests')
    } catch (error) {
      console.error('Failed to cancel:', error)
      toast.error('Failed to cancel job')
    } finally {
      setCancelling(false)
    }
  }

  async function updatePaymentMethod(method: string) {
    if (!job || job.work_started_at) {
      toast.error('Cannot change payment method after work has started')
      return
    }
    
    setUpdatingPayment(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('service_requests')
        .update({ payment_method: method })
        .eq('id', requestId)

      if (error) throw error

      setJob(prev => prev ? { ...prev, payment_method: method } : null)
      toast.success(`Payment method changed to ${method.toUpperCase()}`)
      setShowPaymentOptions(false)
    } catch (error) {
      console.error('Failed to update payment:', error)
      toast.error('Failed to update payment method')
    } finally {
      setUpdatingPayment(false)
    }
  }

  // Initiate online payment after job completion
  async function initiatePayment() {
    if (!job) return
    
    try {
      // Close the completion popup first
      setShowCompletionPopup(false)
      
      // Redirect to payment page with the request details
      router.push(`/customer/requests/${requestId}/pay`)
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Failed to initiate payment')
    }
  }

  async function submitQuickRating(rating: number) {
    if (!job?.assigned_helper) {
      toast.error('Unable to submit rating')
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get helper_profiles.id
      let helperProfileId = job.assigned_helper.id
      
      if (job.assigned_helper.user_id && job.assigned_helper.id === job.assigned_helper.user_id) {
        const { data: helperProfile } = await supabase
          .from('helper_profiles')
          .select('id')
          .eq('user_id', job.assigned_helper.user_id)
          .single()
        
        if (helperProfile) {
          helperProfileId = helperProfile.id
        }
      }

      // Insert quick rating
      const { error } = await supabase
        .from('reviews')
        .insert({
          request_id: requestId,
          customer_id: user.id,
          helper_id: helperProfileId,
          rating: rating,
          review: null
        })

      if (error) {
        // Check if it's a duplicate
        if (error.code === '23505') {
          toast.info('You have already rated this job')
        } else {
          throw error
        }
      } else {
        // Update helper's average rating
        try {
          await supabase.rpc('update_helper_rating', {
            helper_uuid: helperProfileId
          })
        } catch {
          // Ignore if function doesn't exist
        }

        toast.success(`Thanks for the ${rating}-star rating! ⭐`)
      }
      
      setShowCompletionPopup(false)
    } catch (error) {
      console.error('Failed to submit rating:', error)
      toast.error('Failed to submit rating')
    }
  }

  function copyOTP(otp: string) {
    navigator.clipboard.writeText(otp)
    toast.success('OTP copied to clipboard')
  }

  function callHelper() {
    if (job?.assigned_helper?.profile?.phone) {
      window.location.href = `tel:${job.assigned_helper.profile.phone}`
    }
  }

  function messageHelper() {
    // Open chat or WhatsApp
    if (job?.assigned_helper?.profile?.phone) {
      window.open(`https://wa.me/91${job.assigned_helper.profile.phone}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold">Job not found</p>
          <Button onClick={() => router.push('/customer/requests')} className="mt-4">
            Go to Requests
          </Button>
        </div>
      </div>
    )
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === job.broadcast_status) || 0
  const isJobActive = !['cancelled', 'completed'].includes(job.broadcast_status)
  const isBroadcasting = job.broadcast_status === 'broadcasting' && !job.assigned_helper

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Map Section - Larger for live tracking */}
      <div className="h-80 relative">
        {job.service_location_lat && job.service_location_lng ? (
          <LiveTrackingMap
            customerLat={job.service_location_lat}
            customerLng={job.service_location_lng}
            helperLat={job.helper_location_lat}
            helperLng={job.helper_location_lng}
            helperName={job.assigned_helper?.profile?.full_name}
            nearbyHelpers={isBroadcasting ? nearbyHelpers : undefined}
            isBroadcasting={isBroadcasting}
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-emerald-500" />
          </div>
        )}
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 bg-white shadow-lg rounded-full p-2 z-20"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 relative z-10">
        {/* Status Card */}
        <Card className="mb-4 shadow-lg">
          <CardContent className="p-5">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <Badge className={`
                ${job.broadcast_status === 'broadcasting' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${job.broadcast_status === 'accepted' ? 'bg-blue-100 text-blue-700' : ''}
                ${job.broadcast_status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                ${job.broadcast_status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
              `}>
                {job.broadcast_status === 'broadcasting' && '🔄 Finding Helper...'}
                {job.broadcast_status === 'accepted' && '✓ Helper Assigned'}
                {job.broadcast_status === 'completed' && '✓ Completed'}
                {job.broadcast_status === 'cancelled' && '✗ Cancelled'}
              </Badge>
              <span className="text-sm text-gray-500">
                {job.category?.name}
              </span>
            </div>

            {/* Progress Steps */}
            {isJobActive && (
              <div className="flex items-center justify-between mb-6">
                {statusSteps.slice(0, 4).map((step, idx) => {
                  const isActive = idx <= currentStepIndex
                  const StepIcon = step.icon
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span className={`text-[10px] mt-1 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                      {idx < 3 && (
                        <div className={`absolute h-0.5 w-full ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`} 
                             style={{ transform: 'translateX(50%)' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Broadcasting Animation */}
            {job.broadcast_status === 'broadcasting' && (
              <div className="text-center py-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-300 animate-ping opacity-50" />
                </div>
                <p className="text-gray-700 font-semibold mt-4">Finding nearby helpers...</p>
                <p className="text-sm text-gray-500 mt-1">This usually takes 1-2 minutes</p>
                
                {/* Show nearby helpers count */}
                {nearbyHelpers.length > 0 && (
                  <div className="mt-4 bg-emerald-50 rounded-xl p-3 inline-block">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {nearbyHelpers.slice(0, 4).map((helper, idx) => (
                          <div 
                            key={helper.id}
                            className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                            style={{ zIndex: 4 - idx }}
                          >
                            {helper.name.charAt(0)}
                          </div>
                        ))}
                        {nearbyHelpers.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                            +{nearbyHelpers.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-emerald-700">
                          {nearbyHelpers.filter(h => h.isOnline && !h.isOnJob).length} available nearby
                        </p>
                        <p className="text-xs text-emerald-600">
                          {nearbyHelpers.length} total helpers in your area
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Helper Info (when assigned) */}
            {job.assigned_helper && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden relative">
                      {job.assigned_helper.profile?.avatar_url ? (
                        <Image 
                          src={job.assigned_helper.profile.avatar_url} 
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {job.assigned_helper.profile?.full_name || 'Helper'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span>{job.assigned_helper.avg_rating > 0 ? job.assigned_helper.avg_rating.toFixed(1) : 'New'}</span>
                        </div>
                        <span>•</span>
                        <span>
                          {job.assigned_helper.total_jobs_completed > 0 
                            ? `${job.assigned_helper.total_jobs_completed} jobs` 
                            : 'New Helper'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={callHelper}
                      className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                    >
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </button>
                    <button
                      onClick={messageHelper}
                      className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                    >
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* OTP Section - Always show both OTPs prominently */}
        {(job.start_otp || job.end_otp) && (
          <Card className="mb-4 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="font-bold text-purple-800">Your OTP Codes</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Keep these codes safe. Share with helper only when needed.
              </p>
              
              {/* Start OTP */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    job.work_started_at ? 'text-gray-400' : 'text-emerald-700'
                  }`}>
                    🟢 START OTP {job.work_started_at && '(Used)'}
                  </span>
                </div>
                <div className={`flex items-center justify-between rounded-xl p-4 border-2 ${
                  job.work_started_at 
                    ? 'bg-gray-100 border-gray-200' 
                    : 'bg-white border-emerald-300 shadow-sm'
                }`}>
                  <div className={`text-3xl font-bold tracking-[0.4em] ${
                    job.work_started_at ? 'text-gray-400' : 'text-emerald-600'
                  }`}>
                    {job.start_otp || '------'}
                  </div>
                  {job.start_otp && !job.work_started_at && (
                    <button
                      onClick={() => copyOTP(job.start_otp!)}
                      className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <Copy className="h-5 w-5 text-emerald-600" />
                    </button>
                  )}
                </div>
                {!job.work_started_at && job.assigned_helper && (
                  <p className="text-xs text-emerald-600 mt-2">👆 Share this when helper arrives to start work</p>
                )}
              </div>

              {/* End OTP */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    job.work_completed_at ? 'text-gray-400' : !job.work_started_at ? 'text-gray-400' : 'text-blue-700'
                  }`}>
                    🔵 END OTP {job.work_completed_at && '(Used)'}
                  </span>
                </div>
                <div className={`flex items-center justify-between rounded-xl p-4 border-2 ${
                  job.work_completed_at 
                    ? 'bg-gray-100 border-gray-200'
                    : !job.work_started_at
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-blue-300 shadow-sm'
                }`}>
                  <div className={`text-3xl font-bold tracking-[0.4em] ${
                    job.work_completed_at 
                      ? 'text-gray-400' 
                      : !job.work_started_at
                      ? 'text-gray-400'
                      : 'text-blue-600'
                  }`}>
                    {job.end_otp || '------'}
                  </div>
                  {job.end_otp && job.work_started_at && !job.work_completed_at && (
                    <button
                      onClick={() => copyOTP(job.end_otp!)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Copy className="h-5 w-5 text-blue-600" />
                    </button>
                  )}
                </div>
                {job.work_started_at && !job.work_completed_at && (
                  <p className="text-xs text-blue-600 mt-2">👆 Share this when work is done to complete the job</p>
                )}
                {!job.work_started_at && (
                  <p className="text-xs text-gray-400 mt-2">Available after work starts</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Details */}
        <Card className="mb-4">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Job Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Service Address</p>
                  <p className="text-gray-800">{job.service_address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IndianRupee className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-gray-800 font-semibold">₹{job.estimated_price}</p>
                </div>
              </div>

              {/* Payment Method with Change Option */}
              <div className="flex items-start gap-3">
                {job.payment_method === 'upi' ? (
                  <Smartphone className="h-5 w-5 text-gray-400 mt-0.5" />
                ) : job.payment_method === 'card' ? (
                  <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                ) : (
                  <Banknote className="h-5 w-5 text-gray-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800 capitalize font-medium">{job.payment_method || 'Cash'}</p>
                    {!job.work_started_at && (
                      <button
                        onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                      >
                        Change <ChevronDown className={`h-3 w-3 transition-transform ${showPaymentOptions ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  
                  {/* Payment Options Dropdown */}
                  {showPaymentOptions && !job.work_started_at && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => updatePaymentMethod('cash')}
                        disabled={updatingPayment || job.payment_method === 'cash'}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all ${
                          job.payment_method === 'cash'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <Banknote className="h-4 w-4" />
                        <span className="text-sm font-medium">Cash</span>
                      </button>
                      <button
                        onClick={() => updatePaymentMethod('upi')}
                        disabled={updatingPayment || job.payment_method === 'upi'}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all ${
                          job.payment_method === 'upi'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <Smartphone className="h-4 w-4" />
                        <span className="text-sm font-medium">UPI</span>
                      </button>
                      <button
                        onClick={() => updatePaymentMethod('card')}
                        disabled={updatingPayment || job.payment_method === 'card'}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all ${
                          job.payment_method === 'card'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm font-medium">Card</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Problem Description */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Problem</p>
              <p className="text-gray-800">{job.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Cancel Button (only when job is active) */}
        {isJobActive && job.broadcast_status !== 'in_progress' && (
          <Button
            variant="outline"
            onClick={cancelJob}
            disabled={cancelling}
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Cancel Job
          </Button>
        )}

        {/* Rate Helper Button (when completed) */}
        {job.broadcast_status === 'completed' && (
          <Button
            onClick={() => router.push(`/customer/requests/${requestId}/rate`)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Star className="h-4 w-4 mr-2" />
            Rate Helper
          </Button>
        )}
      </div>

      {/* Job Completion Popup */}
      {job && (
        <JobCompletionPopup
          isOpen={showCompletionPopup}
          job={job}
          onRate={() => {
            setShowCompletionPopup(false)
            router.push(`/customer/requests/${requestId}/rate`)
          }}
          onClose={() => setShowCompletionPopup(false)}
          onQuickRate={submitQuickRating}
          onPayNow={job.payment_method !== 'cash' ? initiatePayment : undefined}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  Navigation,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Star,
  Copy,
  PartyPopper,
  Banknote,
  CreditCard,
  ThumbsUp,
  Sparkles,
  ArrowLeft,
  BadgeCheck,
  Timer,
  Package,
  Camera,
  Wrench,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  Info,
  Shield,
  Zap,
  MapPinned,
  CircleDot,
  Route
} from 'lucide-react'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════════
// CLEAN SEARCHING ANIMATION - SIMPLE & ELEGANT
// ═══════════════════════════════════════════════════════════════════════════
function SearchingAnimation({ nearbyHelpers, onRefresh }: { nearbyHelpers: any[]; onRefresh: () => void }) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 500)
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Simple pulsing circle */}
      <div className="relative w-32 h-32 mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
        <div className="absolute inset-2 rounded-full bg-emerald-50 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <MapPin className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      {/* Status text */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Finding helpers nearby...
      </h3>
      <p className="text-gray-500 text-sm text-center mb-6 max-w-xs">
        You&apos;ll receive a notification when a helper accepts your request
      </p>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 font-medium transition-colors disabled:opacity-50"
      >
        <Loader2 className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Checking...' : 'Check for updates'}
      </button>

      {/* Helper count */}
      {nearbyHelpers.length > 0 && (
        <p className="mt-4 text-sm text-gray-400">
          {nearbyHelpers.length} helpers in your area
        </p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETION POPUP - CELEBRATION STYLE WITH CONFETTI RAIN
// ═══════════════════════════════════════════════════════════════════════════
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

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-500 max-h-[90vh] overflow-auto">
        {/* Header with animated confetti */}
        <div className="relative h-40 bg-gradient-to-br from-slate-600 to-slate-700 rounded-t-[2rem] overflow-hidden">
          {/* Animated confetti pieces */}
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                width: `${4 + Math.random() * 6}px`,
                height: `${8 + Math.random() * 8}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#fff', '#ffd700', '#ff6b6b', '#4ade80', '#60a5fa', '#f472b6'][i % 6],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.6 + Math.random() * 0.4}s`,
                opacity: 0.9
              }}
            />
          ))}
          
          {/* Success icon with glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-50 animate-pulse" style={{ transform: 'scale(1.5)' }} />
              <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <PartyPopper className="w-10 h-10 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 -mt-5 relative bg-white rounded-t-3xl">
          <h2 className="text-xl font-black text-center text-gray-800 mb-1">
            Service Complete! 🎉
          </h2>
          <p className="text-center text-gray-500 mb-4 text-sm">
            Your {job.category?.name?.toLowerCase() || 'service'} has been completed
          </p>

          {/* Helper - Compact */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-3 border border-gray-200">
            <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center shadow-md">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{helperName}</p>
              <p className="text-xs text-gray-500">Completed your service</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-green-600" />
            </div>
          </div>

          {/* Payment - Clean style */}
          <div className={`rounded-2xl p-4 mb-4 text-center relative overflow-hidden ${
            isCash ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-x-8 -translate-y-12" />
            <p className={`text-xs font-semibold mb-1 ${isCash ? 'text-amber-600' : 'text-blue-600'}`}>
              {isCash ? '💵 Pay Cash to Helper' : '💳 Online Payment'}
            </p>
            <div className={`text-3xl font-black ${isCash ? 'text-amber-600' : 'text-blue-600'}`}>
              ₹{job.estimated_price}
            </div>
          </div>

          {/* Rating - Larger stars */}
          <div className="text-center mb-4">
            <p className="text-gray-600 font-medium mb-2 text-sm">How was your experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => { setSelectedRating(star); setTimeout(() => onQuickRate(star), 300) }}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-all duration-200 hover:scale-125 active:scale-95"
                >
                  <Star className={`w-10 h-10 drop-shadow-sm ${
                    star <= displayRating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Buttons - Clean styling */}
          <div className="space-y-2">
            {!isCash && onPayNow && (
              <Button onClick={onPayNow} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors">
                <CreditCard className="w-5 h-5 mr-2" /> Pay ₹{job.estimated_price}
              </Button>
            )}
            <Button onClick={onRate} className="w-full h-12 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm transition-colors">
              <Star className="w-5 h-5 mr-2" /> Write Review
            </Button>
            <button onClick={onClose} className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors">
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE MAP - CLEAN & MODERN
// ═══════════════════════════════════════════════════════════════════════════
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
  nearbyHelpers?: any[]
  isBroadcasting?: boolean
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const helperMarkerRef = useRef<google.maps.Marker | null>(null)
  const customerMarkerRef = useRef<google.maps.Marker | null>(null)
  const nearbyMarkersRef = useRef<google.maps.Marker[]>([])
  const hasFitBoundsRef = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const hasHelperLocation = helperLat !== null && helperLng !== null && helperLat !== 0 && helperLng !== 0
  
  // If helper is assigned but no location, generate a nearby position for display
  const showHelperMarker = hasHelperLocation || (!isBroadcasting && helperName)
  const displayHelperLat = hasHelperLocation ? helperLat! : (customerLat + 0.01) // ~1km north
  const displayHelperLng = hasHelperLocation ? helperLng! : (customerLng + 0.005) // slight east



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

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google || mapInstanceRef.current) return

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: customerLat, lng: customerLng },
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#b3e5fc' }] },
        { featureType: 'landscape', stylers: [{ color: '#f5f5f5' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
        { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#fff3e0' }] }
      ]
    })

    mapInstanceRef.current = map

    // Customer marker - Floating heart design
    customerMarkerRef.current = new google.maps.Marker({
      position: { lat: customerLat, lng: customerLng },
      map,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FF6B8A"/>
                <stop offset="100%" style="stop-color:#EF4444"/>
              </linearGradient>
              <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#EF4444" flood-opacity="0.4"/>
              </filter>
            </defs>
            <g filter="url(#shadow)">
              <path d="M24 44C24 44 42 30 42 18C42 10.27 35.73 4 28 4C25.03 4 24 6.5 24 6.5C24 6.5 22.97 4 20 4C12.27 4 6 10.27 6 18C6 30 24 44 24 44Z" fill="url(#heartGrad)" stroke="white" stroke-width="2"/>
            </g>
          </svg>
        `),
        scaledSize: new google.maps.Size(48, 48),
        anchor: new google.maps.Point(24, 44),
      }
    })

    return () => {
      customerMarkerRef.current?.setMap(null)
      helperMarkerRef.current?.setMap(null)
      nearbyMarkersRef.current.forEach(m => m.setMap(null))
    }
  }, [mapLoaded, customerLat, customerLng])

  // Nearby helpers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !nearbyHelpers) return
    nearbyMarkersRef.current.forEach(m => m.setMap(null))
    nearbyMarkersRef.current = []

    nearbyHelpers.forEach((helper, idx) => {
      const color = '#10B981'
      
      const marker = new google.maps.Marker({
        position: { lat: helper.lat, lng: helper.lng },
        map: mapInstanceRef.current!,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="3"/>
              <circle cx="18" cy="14" r="4" fill="white"/>
              <path d="M10 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" stroke-width="2.5" fill="none"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
        animation: google.maps.Animation.DROP
      })
      nearbyMarkersRef.current.push(marker)
    })

    if (isBroadcasting && nearbyHelpers.length > 0 && !hasFitBoundsRef.current) {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend({ lat: customerLat, lng: customerLng })
      nearbyHelpers.slice(0, 5).forEach(h => bounds.extend({ lat: h.lat, lng: h.lng }))
      mapInstanceRef.current.fitBounds(bounds, 60)
      hasFitBoundsRef.current = true
    }
  }, [nearbyHelpers, customerLat, customerLng, isBroadcasting])

  // Helper marker - show when helper is assigned (even if location not yet available)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || typeof window === 'undefined' || !window.google || !showHelperMarker) {
      return
    }

    const markerColor = hasHelperLocation ? '#10B981' : '#F59E0B' // Green if live, amber if estimated
    
    if (helperMarkerRef.current) {
      helperMarkerRef.current.setPosition({ lat: displayHelperLat, lng: displayHelperLng })
    } else {
      helperMarkerRef.current = new google.maps.Marker({
        position: { lat: displayHelperLat, lng: displayHelperLng },
        map: mapInstanceRef.current,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="23" fill="${markerColor}" stroke="white" stroke-width="4"/>
              <circle cx="26" cy="20" r="7" fill="white"/>
              <path d="M14 38c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="white" stroke-width="3" fill="none"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(52, 52),
          anchor: new google.maps.Point(26, 26),
        },
        title: helperName || 'Helper'
      })

      if (!hasFitBoundsRef.current) {
        const bounds = new google.maps.LatLngBounds()
        bounds.extend({ lat: customerLat, lng: customerLng })
        bounds.extend({ lat: displayHelperLat, lng: displayHelperLng })
        mapInstanceRef.current.fitBounds(bounds, 60)
        hasFitBoundsRef.current = true
      }
    }
  }, [mapLoaded, displayHelperLat, displayHelperLng, showHelperMarker, hasHelperLocation, customerLat, customerLng, helperName])

  return (
    <div className="absolute inset-0">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
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
  assigned_helper_id: string | null
  images?: string[]
  service_type_details?: {
    estimated_duration?: number
    confidence?: number
    helper_brings?: string[]
    customer_provides?: string[]
    work_overview?: string
    materials_needed?: string[]
    problem_duration?: string
    error_code?: string
    videos?: string[]
  }
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE - UBER/RAPIDO STYLE FULL SCREEN MAP + BOTTOM SHEET
// ═══════════════════════════════════════════════════════════════════════════
export default function JobTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string
  
  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCompletionPopup, setShowCompletionPopup] = useState(false)
  const completionPopupShownRef = useRef(false) // Use ref for synchronous check
  const [updatingPayment, setUpdatingPayment] = useState(false)
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [nearbyHelpers, setNearbyHelpers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'track' | 'details'>('track')
  const [showImageModal, setShowImageModal] = useState<string | null>(null)

  // Check localStorage on mount to see if popup was already shown for this job
  useEffect(() => {
    const shownKey = `completion_popup_shown_${requestId}`
    if (localStorage.getItem(shownKey) === 'true') {
      completionPopupShownRef.current = true
    }
  }, [requestId])

  async function fetchNearbyHelpers(lat: number, lng: number, categoryId?: string) {
    try {
      const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString(), radius: '50' })
      if (categoryId) params.append('categoryId', categoryId)
      const response = await fetch(`/api/helpers/nearby?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNearbyHelpers(data.helpers || [])
      }
    } catch (err) { console.error(err) }
  }

  // Debounce ref to prevent rapid refetches (egress optimization)
  const lastFetchRef = useRef<number>(0)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const debouncedLoadJobDetails = useCallback(() => {
    const now = Date.now()
    // Minimum 2 seconds between fetches to reduce egress
    if (now - lastFetchRef.current < 2000) {
      // If already scheduled, skip
      if (fetchTimeoutRef.current) return
      // Schedule for later
      fetchTimeoutRef.current = setTimeout(() => {
        fetchTimeoutRef.current = null
        lastFetchRef.current = Date.now()
        loadJobDetails()
      }, 2000 - (now - lastFetchRef.current))
      return
    }
    lastFetchRef.current = now
    loadJobDetails()
  }, [])

  useEffect(() => {
    loadJobDetails()
    
    // Supabase Realtime for instant updates (no additional egress - already subscribed)
    const supabase = createClient()
    const channel = supabase
      .channel(`job-${requestId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `id=eq.${requestId}` }, (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          const newData = payload.new as Record<string, any>
          console.log('🔄 Realtime update received:', {
            status: newData.status,
            broadcast_status: newData.broadcast_status,
            work_started_at: newData.work_started_at,
            work_completed_at: newData.work_completed_at
          })
          
          // Check for completion and show popup instantly
          const isCompleted = newData.status === 'completed' || newData.broadcast_status === 'completed'
          if (isCompleted && !completionPopupShownRef.current) {
            completionPopupShownRef.current = true
            localStorage.setItem(`completion_popup_shown_${requestId}`, 'true')
            setShowCompletionPopup(true)
          }
          
          // Update job state directly from realtime data (NO extra API call needed!)
          setJob(prev => {
            if (!prev) return prev
            return {
              ...prev,
              work_started_at: newData.work_started_at !== undefined ? newData.work_started_at : prev.work_started_at,
              work_completed_at: newData.work_completed_at !== undefined ? newData.work_completed_at : prev.work_completed_at,
              status: newData.status !== undefined ? newData.status : prev.status,
              broadcast_status: newData.broadcast_status !== undefined ? newData.broadcast_status : prev.broadcast_status,
              assigned_helper_id: newData.assigned_helper_id !== undefined ? newData.assigned_helper_id : prev.assigned_helper_id,
              helper_location_lat: newData.helper_location_lat !== undefined ? (newData.helper_location_lat !== null ? Number(newData.helper_location_lat) : null) : prev.helper_location_lat,
              helper_location_lng: newData.helper_location_lng !== undefined ? (newData.helper_location_lng !== null ? Number(newData.helper_location_lng) : null) : prev.helper_location_lng,
            }
          })
          
          // Only fetch full details if helper was just assigned (need helper profile info)
          if (newData.assigned_helper_id && newData.broadcast_status === 'accepted') {
            debouncedLoadJobDetails()
          }
        }
      })
      .subscribe()
    
    return () => { 
      supabase.removeChannel(channel)
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
    }
  }, [requestId, debouncedLoadJobDetails])

  async function loadJobDetails() {
    try {
      // Add cache-busting to ensure fresh data after realtime updates
      const response = await fetch(`/api/requests/${requestId}?t=${Date.now()}`, {
        cache: 'no-store'
      })
      if (!response.ok) throw new Error('Failed')
      const data = await response.json()

      const toNumberOrNull = (v: any): number | null => {
        if (v === null || v === undefined) return null
        if (typeof v === 'number' && Number.isFinite(v)) return v
        if (typeof v === 'string' && v.trim() !== '') {
          const n = Number(v)
          return Number.isFinite(n) ? n : null
        }
        return null
      }

      const toNumberOrZero = (v: any): number => {
        const n = toNumberOrNull(v)
        return n ?? 0
      }
      
      console.log('📍 Track page received helper location:', {
        helper_location_lat: data.helper_location_lat,
        helper_location_lng: data.helper_location_lng,
        assigned_helper: data.assigned_helper?.profile?.full_name,
        raw_data_keys: Object.keys(data)
      })

      const helperLatParsed = toNumberOrNull(data.helper_location_lat)
      const helperLngParsed = toNumberOrNull(data.helper_location_lng)
      
      const transformed: JobDetails = {
        id: data.id, title: data.title || 'Service Request', description: data.description || '',
        status: data.status || 'open', broadcast_status: data.broadcast_status || 'broadcasting',
        service_address: data.service_address || data.address_line1 || '',
        estimated_price: data.estimated_price || 0, payment_method: data.payment_method || 'cash',
        start_otp: data.start_otp, end_otp: data.end_otp, urgency_level: data.urgency_level || 'normal',
        service_location_lat: toNumberOrZero(data.service_location_lat ?? data.latitude),
        service_location_lng: toNumberOrZero(data.service_location_lng ?? data.longitude),
        helper_location_lat: helperLatParsed,
        helper_location_lng: helperLngParsed,
        created_at: data.created_at, helper_accepted_at: data.helper_accepted_at,
        work_started_at: data.work_started_at, work_completed_at: data.work_completed_at,
        assigned_helper_id: data.assigned_helper_id || null,
        assigned_helper: data.assigned_helper, category: data.category,
        images: data.images || [],
        service_type_details: data.service_type_details || {}
      }
      setJob(transformed)
      
      if (transformed.broadcast_status === 'broadcasting' && !transformed.assigned_helper) {
        if (transformed.service_location_lat && transformed.service_location_lng) {
          fetchNearbyHelpers(transformed.service_location_lat, transformed.service_location_lng, data.category_id)
        }
      } else { setNearbyHelpers([]) }

      // Show completion popup only ONCE - use ref for synchronous check + localStorage for persistence
      if ((transformed.status === 'completed' || transformed.broadcast_status === 'completed') && !completionPopupShownRef.current) {
        completionPopupShownRef.current = true // Set immediately to prevent duplicate triggers
        localStorage.setItem(`completion_popup_shown_${requestId}`, 'true')
        setShowCompletionPopup(true)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function cancelJob() {
    if (!job) return
    setCancelling(true)
    try {
      const supabase = createClient()
      await supabase.from('service_requests').update({
        status: 'cancelled', broadcast_status: 'cancelled',
        cancellation_reason: 'Cancelled by customer', cancelled_by: 'customer'
      }).eq('id', requestId)
      
      // Reset helper's is_on_job flag if they were assigned
      if (job.assigned_helper?.id) {
        await supabase.from('helper_profiles').update({ is_on_job: false }).eq('id', job.assigned_helper.id)
      }
      
      toast.success('Cancelled')
      router.push('/customer/requests')
    } catch { toast.error('Failed') }
    finally { setCancelling(false) }
  }

  async function updatePaymentMethod(method: string) {
    if (!job || job.work_started_at) return
    setUpdatingPayment(true)
    try {
      const supabase = createClient()
      await supabase.from('service_requests').update({ payment_method: method }).eq('id', requestId)
      setJob(prev => prev ? { ...prev, payment_method: method } : null)
      toast.success(`Payment: ${method}`)
      setShowPaymentOptions(false)
    } catch { toast.error('Failed') }
    finally { setUpdatingPayment(false) }
  }

  async function submitQuickRating(rating: number) {
    if (!job?.assigned_helper) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let helperProfileId = job.assigned_helper.id
      if (job.assigned_helper.user_id && job.assigned_helper.id === job.assigned_helper.user_id) {
        const { data } = await supabase.from('helper_profiles').select('id').eq('user_id', job.assigned_helper.user_id).single()
        if (data) helperProfileId = data.id
      }
      await supabase.from('reviews').insert({ request_id: requestId, customer_id: user.id, helper_id: helperProfileId, rating })
      toast.success(`${rating} stars!`)
      setShowCompletionPopup(false)
    } catch { toast.error('Failed') }
  }

  function copyOTP(otp: string) { navigator.clipboard.writeText(otp); toast.success('Copied!') }

  // ═══════════ LOADING STATE - PREMIUM ═══════════
  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center relative overflow-hidden">
        {/* Background animated circles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-teal-500/10 animate-pulse"
              style={{
                width: `${100 + i * 50}px`,
                height: `${100 + i * 50}px`,
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + i * 0.3}s`
              }}
            />
          ))}
        </div>
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500 rounded-full blur-2xl opacity-30 animate-pulse" style={{ transform: 'scale(1.5)' }} />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-teal-500/50 animate-bounce">
              <Route className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-white/90 font-semibold text-lg">Loading your booking...</p>
          <p className="text-white/50 text-sm mt-1">Please wait</p>
        </div>
      </div>
    )
  }

  // ═══ NOT FOUND STATE ═══
  if (!job) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-gray-200/50 text-center max-w-sm border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-100">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-black mb-2 text-gray-800">Booking Not Found</h2>
          <p className="text-gray-500 mb-6 text-sm">This booking doesn&apos;t exist or has been removed</p>
          <Button onClick={() => router.push('/customer/requests')} className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // A job is broadcasting if status is 'broadcasting' AND no helper is assigned yet
  const isBroadcasting = job.broadcast_status === 'broadcasting' && !job.assigned_helper_id && !job.assigned_helper
  const isActive = !['cancelled', 'completed'].includes(job.broadcast_status)
  const hasHelper = job.helper_location_lat !== null && job.helper_location_lng !== null && job.helper_location_lat !== 0 && job.helper_location_lng !== 0
  const helperAssigned = !!job.assigned_helper_id || !!job.assigned_helper
  
  const hasImages = job.images && job.images.length > 0
  const hasMaterials = job.service_type_details?.materials_needed && job.service_type_details.materials_needed.length > 0
  const hasHelperBrings = job.service_type_details?.helper_brings && job.service_type_details.helper_brings.length > 0
  const hasCustomerProvides = job.service_type_details?.customer_provides && job.service_type_details.customer_provides.length > 0

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* ═══════════ FULL SCREEN MAP ═══════════ */}
      <div className={`relative transition-all duration-500 ease-out ${activeTab === 'details' ? 'h-28' : 'flex-1'}`} style={{ minHeight: activeTab === 'details' ? '7rem' : '40vh' }}>
        <LiveTrackingMap
          customerLat={job.service_location_lat}
          customerLng={job.service_location_lng}
          helperLat={job.helper_location_lat}
          helperLng={job.helper_location_lng}
          helperName={job.assigned_helper?.profile?.full_name}
          nearbyHelpers={isBroadcasting ? nearbyHelpers : undefined}
          isBroadcasting={isBroadcasting}
        />

        {/* Top Nav - Floating glass effect */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <button onClick={() => router.back()} className="w-11 h-11 bg-white/90 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-center border border-white/50 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2 border border-white/50">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="font-bold text-gray-800 text-sm">{job.category?.name || 'Service'}</span>
          </div>
        </div>

        {/* Live Tracking Badge */}
        {hasHelper && activeTab === 'track' && (
          <div className="absolute top-16 left-4 z-10">
            <div className="bg-slate-700 text-white rounded-full px-3 py-1.5 shadow-md flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-xs font-semibold">LIVE</span>
            </div>
          </div>
        )}

        {/* ETA Badge when helper is on way */}
        {job.broadcast_status === 'on_way' && activeTab === 'track' && (
          <div className="absolute top-16 right-4 z-10">
            <div className="bg-white rounded-xl px-3 py-2 shadow-md border border-gray-200">
              <p className="text-[10px] font-semibold text-gray-500 uppercase">Arriving in</p>
              <p className="text-lg font-bold text-gray-800">5-10 min</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ BOTTOM SHEET - PREMIUM ═══════════ */}
      <div className={`bg-white rounded-t-[2rem] shadow-[0_-10px_50px_rgba(0,0,0,0.12)] relative -mt-6 z-20 overflow-hidden flex flex-col transition-all duration-500 ease-out ${activeTab === 'details' ? 'flex-1' : 'max-h-[60vh]'}`}>
        {/* Handle with subtle animation */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full" />
        </div>

        {/* Tab Switcher */}
        <div className="px-4 mb-3">
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'track' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Navigation className="w-4 h-4" />
              Track
              {hasHelper && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'details' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Details
              {(hasImages || hasMaterials) && (
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        <div className="px-4 pb-6 overflow-y-auto flex-1 scrollbar-hide">
          {/* ═══════════ TRACK TAB ═══════════ */}
          {activeTab === 'track' && (
            <>
              {/* BROADCASTING - Search Animation */}
              {isBroadcasting && <SearchingAnimation nearbyHelpers={nearbyHelpers} onRefresh={loadJobDetails} />}

              {/* HELPER ASSIGNED - Premium Card */}
              {helperAssigned && job.assigned_helper && (
                <>
                  {/* Status Banner - Soft gradient */}
                  <div className={`rounded-2xl p-4 mb-4 relative overflow-hidden ${
                    job.broadcast_status === 'in_progress' ? 'bg-gradient-to-r from-slate-600 to-slate-700'
                    : job.broadcast_status === 'completed' ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                    : job.broadcast_status === 'arrived' ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                    : 'bg-gradient-to-r from-teal-600 to-slate-600'
                  }`}>
                    {/* Background pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-x-8 -translate-y-16" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-x-4 translate-y-8" />
                    
                    <div className="flex items-center gap-3 relative">
                      <div className="w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        {job.broadcast_status === 'in_progress' ? <Timer className="w-6 h-6 text-white" />
                        : job.broadcast_status === 'completed' ? <CheckCircle2 className="w-6 h-6 text-white" />
                        : job.broadcast_status === 'arrived' ? <MapPin className="w-6 h-6 text-white" />
                        : <Navigation className="w-6 h-6 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-black text-base">
                          {job.broadcast_status === 'accepted' && '🚀 Helper Assigned'}
                          {job.broadcast_status === 'on_way' && '🛵 On the Way'}
                          {job.broadcast_status === 'arrived' && '📍 Helper Arrived'}
                          {job.broadcast_status === 'in_progress' && '⚡ Work in Progress'}
                          {job.broadcast_status === 'completed' && '✅ Job Completed'}
                        </p>
                        <p className="text-white/80 text-sm">
                          {job.broadcast_status === 'accepted' && 'Preparing to come to you'}
                          {job.broadcast_status === 'on_way' && 'Arriving soon at your location'}
                          {job.broadcast_status === 'arrived' && 'Share START OTP to begin'}
                          {job.broadcast_status === 'in_progress' && 'Your service is ongoing'}
                          {job.broadcast_status === 'completed' && 'All done! Rate your experience'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Helper Card */}
                  <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center overflow-hidden shadow-md">
                          {job.assigned_helper.profile?.avatar_url ? (
                            <Image src={job.assigned_helper.profile.avatar_url} alt="" fill className="object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-white">
                          <BadgeCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-base">{job.assigned_helper.profile?.full_name || 'Helper'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-amber-600">{job.assigned_helper.avg_rating > 0 ? job.assigned_helper.avg_rating.toFixed(1) : 'New'}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-lg">
                            <Wrench className="w-3 h-3 text-gray-600" />
                            <span className="text-xs font-semibold text-gray-600">{job.assigned_helper.total_jobs_completed || 0} jobs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contact Buttons */}
                    <div className="flex gap-2 mt-4">
                      <a href={`tel:${job.assigned_helper.profile?.phone}`} className="flex-1 h-11 rounded-xl bg-slate-700 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform">
                        <Phone className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-semibold">Call</span>
                      </a>
                      <a href={`https://wa.me/91${job.assigned_helper.profile?.phone}`} target="_blank" className="flex-1 h-11 rounded-xl bg-emerald-600 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform">
                        <MessageSquare className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-semibold">WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* OTP Cards - Premium design */}
                  {(job.start_otp || job.end_otp) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Start OTP */}
                      <div className={`rounded-2xl p-3 relative overflow-hidden transition-all duration-300 ${
                        job.work_started_at 
                          ? 'bg-gray-100 opacity-60' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gray-100 rounded-full -translate-x-4 -translate-y-8" />
                        <div className="flex items-center gap-1.5 mb-2">
                          <CircleDot className={`w-4 h-4 ${job.work_started_at ? 'text-gray-400' : 'text-slate-600'}`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${job.work_started_at ? 'text-gray-400' : 'text-slate-700'}`}>Start OTP</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-2xl font-black font-mono tracking-widest ${job.work_started_at ? 'text-gray-400' : 'text-slate-800'}`}>{job.start_otp || '----'}</span>
                          {!job.work_started_at && job.start_otp && (
                            <button onClick={() => copyOTP(job.start_otp!)} className="p-2 bg-slate-600 rounded-xl shadow-sm active:scale-95 transition-transform">
                              <Copy className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>
                        {job.work_started_at && (
                          <div className="flex items-center gap-1 mt-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[10px] text-gray-400 font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                      
                      {/* End OTP */}
                      <div className={`rounded-2xl p-3 relative overflow-hidden transition-all duration-300 ${
                        job.work_completed_at 
                          ? 'bg-gray-100 opacity-60' 
                          : !job.work_started_at 
                            ? 'bg-gray-100 opacity-50' 
                            : 'bg-slate-50 border border-slate-200'
                      }`}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100/50 rounded-full -translate-x-4 -translate-y-8" />
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className={`w-4 h-4 ${job.work_completed_at ? 'text-gray-400' : !job.work_started_at ? 'text-gray-400' : 'text-slate-600'}`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${job.work_completed_at ? 'text-gray-400' : !job.work_started_at ? 'text-gray-400' : 'text-slate-700'}`}>End OTP</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-2xl font-black font-mono tracking-widest ${job.work_completed_at ? 'text-gray-400' : !job.work_started_at ? 'text-gray-300' : 'text-slate-800'}`}>{job.end_otp || '----'}</span>
                          {job.work_started_at && !job.work_completed_at && job.end_otp && (
                            <button onClick={() => copyOTP(job.end_otp!)} className="p-2 bg-slate-600 rounded-xl shadow-sm active:scale-95 transition-transform">
                              <Copy className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>
                        {job.work_completed_at && (
                          <div className="flex items-center gap-1 mt-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[10px] text-gray-400 font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Quick Info - Modern card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
                {/* Price header */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="font-semibold text-gray-600 text-sm">Service Fee</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-800">₹{job.estimated_price}</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</p>
                      <p className="text-gray-700 text-sm font-medium">{job.service_address || 'Not set'}</p>
                    </div>
                  </div>
                  
                  {/* Payment */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${job.payment_method === 'cash' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                      {job.payment_method === 'cash' ? <Banknote className="w-4 h-4 text-amber-500" /> : <CreditCard className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payment</p>
                      <p className="text-gray-700 text-sm font-medium capitalize">{job.payment_method || 'Cash'}</p>
                    </div>
                    {!job.work_started_at && (
                      <button onClick={() => setShowPaymentOptions(!showPaymentOptions)} className="text-gray-600 text-xs font-semibold bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                        Change
                      </button>
                    )}
                  </div>
                  
                  {/* Payment Options */}
                  {showPaymentOptions && (
                    <div className="flex gap-2 pt-2">
                      {['cash', 'upi', 'card'].map((m) => (
                        <button 
                          key={m} 
                          onClick={() => updatePaymentMethod(m)} 
                          disabled={updatingPayment}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            job.payment_method === m 
                              ? 'bg-slate-700 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {m === 'cash' && '💵'} {m === 'upi' && '📱'} {m === 'card' && '💳'} {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* View Details Button */}
              <button 
                onClick={() => setActiveTab('details')}
                className="w-full py-3 bg-gray-100 rounded-xl flex items-center justify-center gap-2 text-gray-600 font-medium hover:bg-gray-200 transition-all mb-4 border border-gray-200"
              >
                <Eye className="w-4 h-4" />
                View Full Details
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Cancel Button - Only when appropriate */}
              {isActive && job.broadcast_status !== 'in_progress' && (
                <Button 
                  variant="outline" 
                  onClick={cancelJob} 
                  disabled={cancelling} 
                  className="w-full h-12 border-2 border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors"
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Cancel Booking
                </Button>
              )}
              {job.broadcast_status === 'completed' && (
                <Button onClick={() => router.push(`/customer/requests/${requestId}/rate`)} className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 transition-shadow">
                  <Star className="w-4 h-4 mr-2" /> Rate Your Helper
                </Button>
              )}
            </>
          )}

          {/* ═══════════ DETAILS TAB - PREMIUM ═══════════ */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Price & Time Summary - Premium gradient card */}
              <div className="bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-xl shadow-teal-500/30">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-x-10 -translate-y-20" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-x-4 translate-y-8" />
                
                <div className="flex items-center justify-between mb-4 relative">
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Estimated Cost</p>
                    <p className="text-4xl font-black">₹{job.estimated_price}</p>
                  </div>
                  {job.service_type_details?.estimated_duration && (
                    <div className="text-right bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Duration</p>
                      <p className="text-2xl font-black">{job.service_type_details.estimated_duration} <span className="text-sm font-medium">min</span></p>
                    </div>
                  )}
                </div>
                {job.service_type_details?.confidence && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2 relative">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span className="text-sm font-semibold">AI Confidence: {job.service_type_details.confidence}%</span>
                    <div className="flex-1 h-2 bg-white/20 rounded-full ml-2 overflow-hidden">
                      <div 
                        className="h-full bg-amber-300 rounded-full" 
                        style={{ width: `${job.service_type_details.confidence}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Uploaded Photos - Gallery style */}
              {hasImages && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 text-sm">Your Photos</span>
                      <p className="text-xs text-gray-500">{job.images!.length} images attached</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {job.images!.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setShowImageModal(img)}
                          className="aspect-square rounded-xl overflow-hidden relative bg-gray-100 hover:opacity-90 transition-all hover:scale-[1.02] shadow-sm"
                        >
                          <Image src={img} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Problem Description */}
              {job.description && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">Problem Description</span>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{job.description}</p>
                  </div>
                </div>
              )}

              {/* Work Overview */}
              {job.service_type_details?.work_overview && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Info className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">AI Work Overview</span>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{job.service_type_details.work_overview}</p>
                  </div>
                </div>
              )}

              {/* Materials Needed */}
              {hasMaterials && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 text-sm">Materials May Be Needed</span>
                      <p className="text-xs text-gray-500">Additional items for the job</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {job.service_type_details!.materials_needed!.map((material, idx) => (
                        <span key={idx} className="bg-orange-50 text-orange-700 border border-orange-200 rounded-xl px-3 py-2 text-sm font-medium">
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* What Helper Brings */}
              {hasHelperBrings && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 text-sm">Helper Will Bring</span>
                      <p className="text-xs text-gray-500">Tools and equipment</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2.5">
                      {job.service_type_details!.helper_brings!.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                          <div className="w-5 h-5 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* What Customer Should Provide */}
              {hasCustomerProvides && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 text-sm">You Should Provide</span>
                      <p className="text-xs text-gray-500">Items to keep ready</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2.5">
                      {job.service_type_details!.customer_provides!.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                          <div className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs text-blue-600 font-bold">{idx + 1}</span>
                          </div>
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Address & Payment Info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">Service Location</span>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-gray-700 text-sm font-medium">{job.service_address}</p>
                  <div className="flex flex-wrap gap-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${job.payment_method === 'cash' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                      {job.payment_method === 'cash' ? <Banknote className="w-4 h-4 text-amber-500" /> : <CreditCard className="w-4 h-4 text-blue-500" />}
                      <span className={`text-sm font-semibold capitalize ${job.payment_method === 'cash' ? 'text-amber-700' : 'text-blue-700'}`}>{job.payment_method}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {new Date(job.created_at).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back to Track Button */}
              <button 
                onClick={() => setActiveTab('track')}
                className="w-full py-4 bg-slate-700 rounded-2xl flex items-center justify-center gap-2 text-white font-semibold shadow-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                <ChevronUp className="w-5 h-5" />
                Back to Tracking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal - Premium fullscreen */}
      {showImageModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setShowImageModal(null)}>
          <button className="absolute top-5 right-5 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative w-full max-w-lg aspect-square animate-in zoom-in-95 duration-300">
            <Image src={showImageModal} alt="Full view" fill className="object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {/* Completion Popup */}
      {job && (
        <JobCompletionPopup
          isOpen={showCompletionPopup}
          job={job}
          onRate={() => { setShowCompletionPopup(false); router.push(`/customer/requests/${requestId}/rate`) }}
          onClose={() => {
            setShowCompletionPopup(false)
            // Ensure we don't show again even if state somehow resets
            completionPopupShownRef.current = true
            localStorage.setItem(`completion_popup_shown_${requestId}`, 'true')
          }}
          onQuickRate={submitQuickRating}
          onPayNow={job.payment_method !== 'cash' ? () => router.push(`/customer/requests/${requestId}/pay`) : undefined}
        />
      )}
    </div>
  )
}

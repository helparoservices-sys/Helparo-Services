'use client'

import { useState, useEffect, useRef } from 'react'
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
  Info
} from 'lucide-react'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════════
// RAPIDO-STYLE SEARCHING ANIMATION - ULTRA PREMIUM
// ═══════════════════════════════════════════════════════════════════════════
function SearchingAnimation({ nearbyHelpers }: { nearbyHelpers: any[] }) {
  const availableCount = nearbyHelpers.filter(h => h.isOnline && !h.isOnJob).length
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {/* Radar Animation - Like Rapido/Uber */}
      <div className="relative w-52 h-52 mb-6">
        {/* Rotating gradient ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute inset-1 rounded-full bg-white" />
        </div>
        
        {/* Pulse rings */}
        <div className="absolute inset-4 rounded-full border-2 border-teal-300/50 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-8 rounded-full border-2 border-teal-400/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        <div className="absolute inset-12 rounded-full border-2 border-teal-500/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
        
        {/* Center - Main icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-teal-500/40">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Floating helper avatars */}
        {nearbyHelpers.slice(0, 5).map((helper, idx) => {
          const angle = (idx * 72 - 90) * (Math.PI / 180)
          const radius = 90
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const isAvailable = helper.isOnline && !helper.isOnJob
          
          return (
            <div
              key={helper.id}
              className="absolute transition-all duration-500"
              style={{
                left: `calc(50% + ${x}px - 18px)`,
                top: `calc(50% + ${y}px - 18px)`,
                animation: `float ${2 + idx * 0.3}s ease-in-out infinite`,
                animationDelay: `${idx * 0.2}s`
              }}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white ${
                isAvailable 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                  : 'bg-gray-400'
              }`}>
                {helper.name.charAt(0)}
              </div>
              {isAvailable && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
          )
        })}
      </div>

      {/* Text */}
      <h3 className="text-xl font-black text-gray-800 mb-1">
        Searching for helpers{dots}
      </h3>
      <p className="text-gray-500 text-sm mb-5">We&apos;re finding the best match for you</p>
      
      {/* Stats Pills */}
      {nearbyHelpers.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full px-5 py-2.5 shadow-lg shadow-teal-500/30">
            <span className="text-2xl font-black">{availableCount}</span>
            <span className="text-sm ml-1.5 opacity-90">available</span>
          </div>
          <div className="bg-gray-100 text-gray-700 rounded-full px-5 py-2.5">
            <span className="text-2xl font-black">{nearbyHelpers.length}</span>
            <span className="text-sm ml-1.5 opacity-70">nearby</span>
          </div>
        </div>
      )}

      {/* Loading bar */}
      <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full animate-[loading_2s_ease-in-out_infinite]" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 100%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETION POPUP - CELEBRATION STYLE
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-500 max-h-[90vh] overflow-auto">
        {/* Header with confetti */}
        <div className="relative h-44 bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 rounded-t-[2.5rem] sm:rounded-t-[2.5rem] overflow-hidden">
          {/* Confetti dots */}
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-bounce"
              style={{
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#fff', '#ffd700', '#ff6b6b', '#4ade80', '#60a5fa'][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.8 + Math.random() * 0.5}s`,
                opacity: 0.9
              }}
            />
          ))}
          
          {/* Success icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
              <PartyPopper className="w-12 h-12 text-teal-500" />
            </div>
          </div>
        </div>

        <div className="px-6 py-6 -mt-6 relative bg-white rounded-t-3xl">
          <h2 className="text-2xl font-black text-center text-gray-800 mb-1">
            Job Complete! 🎉
          </h2>
          <p className="text-center text-gray-500 mb-5 text-sm">
            Your {job.category?.name?.toLowerCase() || 'service'} has been completed
          </p>

          {/* Helper */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{helperName}</p>
              <p className="text-xs text-gray-500">Completed your service</p>
            </div>
            <ThumbsUp className="w-6 h-6 text-green-500" />
          </div>

          {/* Payment */}
          <div className={`rounded-2xl p-4 mb-5 text-center ${
            isCash ? 'bg-amber-50 border-2 border-amber-200' : 'bg-blue-50 border-2 border-blue-200'
          }`}>
            <p className={`text-sm font-medium mb-1 ${isCash ? 'text-amber-600' : 'text-blue-600'}`}>
              {isCash ? 'Pay Cash to Helper' : 'Online Payment'}
            </p>
            <div className={`text-4xl font-black ${isCash ? 'text-amber-600' : 'text-blue-600'}`}>
              ₹{job.estimated_price}
            </div>
          </div>

          {/* Rating */}
          <div className="text-center mb-5">
            <p className="text-gray-600 font-medium mb-2 text-sm">How was your experience?</p>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => { setSelectedRating(star); setTimeout(() => onQuickRate(star), 300) }}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star className={`w-9 h-9 ${
                    star <= displayRating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2.5">
            {!isCash && onPayNow && (
              <Button onClick={onPayNow} className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl">
                <CreditCard className="w-5 h-5 mr-2" /> Pay ₹{job.estimated_price}
              </Button>
            )}
            <Button onClick={onRate} className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl">
              <Star className="w-5 h-5 mr-2" /> Write Review
            </Button>
            <button onClick={onClose} className="w-full py-2 text-gray-400 text-sm">
              Skip
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
      const isAvailable = helper.isOnline && !helper.isOnJob
      const color = isAvailable ? '#10B981' : '#9CA3AF'
      
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

  // Helper marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !hasHelperLocation) return

    if (helperMarkerRef.current) {
      helperMarkerRef.current.setPosition({ lat: helperLat!, lng: helperLng! })
    } else {
      helperMarkerRef.current = new google.maps.Marker({
        position: { lat: helperLat!, lng: helperLng! },
        map: mapInstanceRef.current,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="23" fill="#10B981" stroke="white" stroke-width="4"/>
              <circle cx="26" cy="20" r="7" fill="white"/>
              <path d="M14 38c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="white" stroke-width="3" fill="none"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(52, 52),
          anchor: new google.maps.Point(26, 26),
        }
      })

      if (!hasFitBoundsRef.current) {
        const bounds = new google.maps.LatLngBounds()
        bounds.extend({ lat: customerLat, lng: customerLng })
        bounds.extend({ lat: helperLat!, lng: helperLng! })
        mapInstanceRef.current.fitBounds(bounds, 60)
        hasFitBoundsRef.current = true
      }
    }
  }, [helperLat, helperLng, hasHelperLocation, customerLat, customerLng])

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
  const [completionPopupShown, setCompletionPopupShown] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(false)
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [nearbyHelpers, setNearbyHelpers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'track' | 'details'>('track')
  const [showImageModal, setShowImageModal] = useState<string | null>(null)

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

  useEffect(() => {
    loadJobDetails()
    const supabase = createClient()
    const channel = supabase
      .channel(`job-${requestId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `id=eq.${requestId}` }, () => loadJobDetails())
      .subscribe()
    const interval = setInterval(loadJobDetails, 5000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [requestId])

  async function loadJobDetails() {
    try {
      const response = await fetch(`/api/requests/${requestId}`)
      if (!response.ok) throw new Error('Failed')
      const data = await response.json()
      const transformed: JobDetails = {
        id: data.id, title: data.title || 'Service Request', description: data.description || '',
        status: data.status || 'open', broadcast_status: data.broadcast_status || 'broadcasting',
        service_address: data.service_address || data.address_line1 || '',
        estimated_price: data.estimated_price || 0, payment_method: data.payment_method || 'cash',
        start_otp: data.start_otp, end_otp: data.end_otp, urgency_level: data.urgency_level || 'normal',
        service_location_lat: data.service_location_lat || data.latitude || 0,
        service_location_lng: data.service_location_lng || data.longitude || 0,
        helper_location_lat: data.helper_location_lat, helper_location_lng: data.helper_location_lng,
        created_at: data.created_at, helper_accepted_at: data.helper_accepted_at,
        work_started_at: data.work_started_at, work_completed_at: data.work_completed_at,
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

      if (transformed.status === 'completed' && !completionPopupShown) {
        setShowCompletionPopup(true)
        setCompletionPopupShown(true)
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

  // ═══ LOADING STATE ═══
  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-2xl shadow-teal-500/50">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <p className="text-white/80 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // ═══ NOT FOUND STATE ═══
  if (!job) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Not Found</h2>
          <p className="text-gray-500 mb-6 text-sm">This booking doesn&apos;t exist</p>
          <Button onClick={() => router.push('/customer/requests')} className="w-full h-11 bg-teal-500 text-white rounded-xl font-semibold">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const isBroadcasting = job.broadcast_status === 'broadcasting' && !job.assigned_helper
  const isActive = !['cancelled', 'completed'].includes(job.broadcast_status)
  const hasHelper = job.helper_location_lat && job.helper_location_lng
  const hasImages = job.images && job.images.length > 0
  const hasMaterials = job.service_type_details?.materials_needed && job.service_type_details.materials_needed.length > 0
  const hasHelperBrings = job.service_type_details?.helper_brings && job.service_type_details.helper_brings.length > 0
  const hasCustomerProvides = job.service_type_details?.customer_provides && job.service_type_details.customer_provides.length > 0

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* ═══════════ FULL SCREEN MAP ═══════════ */}
      <div className={`relative transition-all duration-300 ${activeTab === 'details' ? 'h-32' : 'flex-1'}`} style={{ minHeight: activeTab === 'details' ? '8rem' : '45vh' }}>
        <LiveTrackingMap
          customerLat={job.service_location_lat}
          customerLng={job.service_location_lng}
          helperLat={job.helper_location_lat}
          helperLng={job.helper_location_lng}
          helperName={job.assigned_helper?.profile?.full_name}
          nearbyHelpers={isBroadcasting ? nearbyHelpers : undefined}
          isBroadcasting={isBroadcasting}
        />

        {/* Top Nav */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <button onClick={() => router.back()} className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="bg-white rounded-xl shadow-lg px-4 py-2.5">
            <span className="font-bold text-gray-800 text-sm">{job.category?.name || 'Service'}</span>
          </div>
        </div>

        {/* Live Badge */}
        {hasHelper && activeTab === 'track' && (
          <div className="absolute top-16 left-4 bg-green-500 text-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-xs font-bold">LIVE</span>
          </div>
        )}
      </div>

      {/* ═══════════ BOTTOM SHEET ═══════════ */}
      <div className={`bg-white rounded-t-[1.75rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative -mt-6 z-20 overflow-hidden flex flex-col transition-all duration-300 ${activeTab === 'details' ? 'flex-1' : 'max-h-[55vh]'}`}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Tab Switcher */}
        <div className="px-5 mb-3">
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'track' 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Navigation className="w-4 h-4" />
              Track
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'details' 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Details
              {(hasImages || hasMaterials) && (
                <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 overflow-y-auto flex-1">
          {/* ═══════════ TRACK TAB ═══════════ */}
          {activeTab === 'track' && (
            <>
              {/* BROADCASTING */}
              {isBroadcasting && <SearchingAnimation nearbyHelpers={nearbyHelpers} />}

              {/* HELPER ASSIGNED */}
              {job.assigned_helper && (
                <>
                  {/* Status */}
                  <div className={`rounded-2xl p-4 mb-4 ${
                    job.broadcast_status === 'in_progress' ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                    : job.broadcast_status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                        {job.broadcast_status === 'in_progress' ? <Timer className="w-5 h-5 text-white" />
                        : job.broadcast_status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-white" />
                        : <Navigation className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="text-white font-bold">
                          {job.broadcast_status === 'accepted' && 'Helper Assigned'}
                          {job.broadcast_status === 'on_way' && 'On the Way'}
                          {job.broadcast_status === 'arrived' && 'Arrived'}
                          {job.broadcast_status === 'in_progress' && 'Working'}
                          {job.broadcast_status === 'completed' && 'Completed'}
                        </p>
                        <p className="text-white/70 text-sm">
                          {job.broadcast_status === 'accepted' && 'Getting ready'}
                          {job.broadcast_status === 'on_way' && 'Coming to you'}
                          {job.broadcast_status === 'arrived' && 'Ready to start'}
                          {job.broadcast_status === 'in_progress' && 'Service ongoing'}
                          {job.broadcast_status === 'completed' && 'All done!'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Helper Card */}
                  <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center overflow-hidden">
                          {job.assigned_helper.profile?.avatar_url ? (
                            <Image src={job.assigned_helper.profile.avatar_url} alt="" fill className="object-cover" />
                          ) : (
                            <User className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-md flex items-center justify-center border-2 border-white">
                          <BadgeCheck className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{job.assigned_helper.profile?.full_name || 'Helper'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold text-gray-600">{job.assigned_helper.avg_rating > 0 ? job.assigned_helper.avg_rating.toFixed(1) : 'New'}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">{job.assigned_helper.total_jobs_completed || 0} jobs</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`tel:${job.assigned_helper.profile?.phone}`} className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                          <Phone className="w-4 h-4 text-white" />
                        </a>
                        <a href={`https://wa.me/91${job.assigned_helper.profile?.phone}`} target="_blank" className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* OTPs */}
                  {(job.start_otp || job.end_otp) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className={`rounded-xl p-3 ${job.work_started_at ? 'bg-gray-100' : 'bg-green-50 border border-green-200'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${job.work_started_at ? 'bg-gray-400' : 'bg-green-500'}`} />
                          <span className={`text-[10px] font-bold ${job.work_started_at ? 'text-gray-400' : 'text-green-700'}`}>START</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xl font-black font-mono tracking-wide ${job.work_started_at ? 'text-gray-400' : 'text-green-600'}`}>{job.start_otp || '----'}</span>
                          {!job.work_started_at && job.start_otp && (
                            <button onClick={() => copyOTP(job.start_otp!)} className="p-1.5 bg-green-500 rounded-md">
                              <Copy className="w-3 h-3 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`rounded-xl p-3 ${job.work_completed_at ? 'bg-gray-100' : !job.work_started_at ? 'bg-gray-100' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${job.work_completed_at ? 'bg-gray-400' : !job.work_started_at ? 'bg-gray-400' : 'bg-blue-500'}`} />
                          <span className={`text-[10px] font-bold ${job.work_completed_at ? 'text-gray-400' : !job.work_started_at ? 'text-gray-400' : 'text-blue-700'}`}>END</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xl font-black font-mono tracking-wide ${job.work_completed_at ? 'text-gray-400' : !job.work_started_at ? 'text-gray-300' : 'text-blue-600'}`}>{job.end_otp || '----'}</span>
                          {job.work_started_at && !job.work_completed_at && job.end_otp && (
                            <button onClick={() => copyOTP(job.end_otp!)} className="p-1.5 bg-blue-500 rounded-md">
                              <Copy className="w-3 h-3 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Quick Info */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-sm">Quick Info</span>
                  <span className="text-2xl font-black text-teal-600">₹{job.estimated_price}</span>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{job.service_address || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {job.payment_method === 'cash' ? <Banknote className="w-4 h-4 text-amber-500" /> : <CreditCard className="w-4 h-4 text-blue-500" />}
                    <span className="text-gray-700 text-sm capitalize">{job.payment_method || 'Cash'}</span>
                    {!job.work_started_at && (
                      <button onClick={() => setShowPaymentOptions(!showPaymentOptions)} className="text-teal-600 text-xs font-semibold ml-auto">Change</button>
                    )}
                  </div>
                  {showPaymentOptions && (
                    <div className="flex gap-2">
                      {['cash', 'upi', 'card'].map((m) => (
                        <button key={m} onClick={() => updatePaymentMethod(m)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${job.payment_method === m ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* View Details Button */}
              <button 
                onClick={() => setActiveTab('details')}
                className="w-full py-3 bg-gray-50 rounded-xl flex items-center justify-center gap-2 text-gray-600 font-medium hover:bg-gray-100 transition-colors mb-4"
              >
                <Eye className="w-4 h-4" />
                View Full Details
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Actions */}
              {isActive && job.broadcast_status !== 'in_progress' && (
                <Button variant="outline" onClick={cancelJob} disabled={cancelling} className="w-full h-11 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold">
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Cancel
                </Button>
              )}
              {job.broadcast_status === 'completed' && (
                <Button onClick={() => router.push(`/customer/requests/${requestId}/rate`)} className="w-full h-11 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30">
                  <Star className="w-4 h-4 mr-2" /> Rate Helper
                </Button>
              )}
            </>
          )}

          {/* ═══════════ DETAILS TAB ═══════════ */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Price & Time Summary */}
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white/70 text-sm">Estimated Cost</p>
                    <p className="text-3xl font-black">₹{job.estimated_price}</p>
                  </div>
                  {job.service_type_details?.estimated_duration && (
                    <div className="text-right">
                      <p className="text-white/70 text-sm">Est. Duration</p>
                      <p className="text-2xl font-bold">{job.service_type_details.estimated_duration} min</p>
                    </div>
                  )}
                </div>
                {job.service_type_details?.confidence && (
                  <div className="bg-white/20 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">AI Confidence: {job.service_type_details.confidence}%</span>
                  </div>
                )}
              </div>

              {/* Uploaded Photos */}
              {hasImages && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-gray-800 text-sm">Your Photos ({job.images!.length})</span>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {job.images!.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setShowImageModal(img)}
                          className="aspect-square rounded-lg overflow-hidden relative bg-gray-100 hover:opacity-90 transition-opacity"
                        >
                          <Image src={img} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Problem Description */}
              {job.description && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="font-bold text-gray-800 text-sm">Problem Description</span>
                  </div>
                  <div className="p-3">
                    <p className="text-gray-700 text-sm">{job.description}</p>
                  </div>
                </div>
              )}

              {/* Work Overview */}
              {job.service_type_details?.work_overview && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                    <Info className="w-4 h-4 text-teal-500" />
                    <span className="font-bold text-gray-800 text-sm">Work Overview</span>
                  </div>
                  <div className="p-3">
                    <p className="text-gray-700 text-sm">{job.service_type_details.work_overview}</p>
                  </div>
                </div>
              )}

              {/* Materials Needed */}
              {hasMaterials && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-gray-800 text-sm">Materials May Be Needed</span>
                  </div>
                  <div className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {job.service_type_details!.materials_needed!.map((material, idx) => (
                        <span key={idx} className="bg-orange-50 text-orange-700 rounded-lg px-3 py-1.5 text-sm font-medium">
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* What Helper Brings */}
              {hasHelperBrings && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-gray-800 text-sm">Helper Will Bring</span>
                  </div>
                  <div className="p-3">
                    <ul className="space-y-2">
                      {job.service_type_details!.helper_brings!.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* What Customer Should Provide */}
              {hasCustomerProvides && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-gray-800 text-sm">You Should Provide</span>
                  </div>
                  <div className="p-3">
                    <ul className="space-y-2">
                      {job.service_type_details!.customer_provides!.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs text-blue-600 font-bold">{idx + 1}</span>
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Address & Payment Info */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-gray-800 text-sm">Service Location</span>
                </div>
                <div className="p-3 space-y-3">
                  <p className="text-gray-700 text-sm">{job.service_address}</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    {job.payment_method === 'cash' ? <Banknote className="w-4 h-4 text-amber-500" /> : <CreditCard className="w-4 h-4 text-blue-500" />}
                    <span className="text-gray-700 text-sm capitalize">Payment: {job.payment_method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 text-sm">
                      Requested: {new Date(job.created_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Back to Track Button */}
              <button 
                onClick={() => setActiveTab('track')}
                className="w-full py-3 bg-teal-50 rounded-xl flex items-center justify-center gap-2 text-teal-600 font-semibold hover:bg-teal-100 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
                Back to Tracking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowImageModal(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative w-full max-w-lg aspect-square">
            <Image src={showImageModal} alt="Full view" fill className="object-contain" />
          </div>
        </div>
      )}

      {/* Completion Popup */}
      {job && (
        <JobCompletionPopup
          isOpen={showCompletionPopup}
          job={job}
          onRate={() => { setShowCompletionPopup(false); router.push(`/customer/requests/${requestId}/rate`) }}
          onClose={() => setShowCompletionPopup(false)}
          onQuickRate={submitQuickRating}
          onPayNow={job.payment_method !== 'cash' ? () => router.push(`/customer/requests/${requestId}/pay`) : undefined}
        />
      )}
    </div>
  )
}

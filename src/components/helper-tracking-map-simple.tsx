'use client'

import { MapPin, Navigation, Clock, User } from 'lucide-react'

interface HelperTrackingMapSimpleProps {
  customerLat: number
  customerLng: number
  helperLat: number | null
  helperLng: number | null
  className?: string
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default function HelperTrackingMapSimple({ 
  customerLat, 
  customerLng, 
  helperLat, 
  helperLng,
  className = '' 
}: HelperTrackingMapSimpleProps) {
  const hasHelperLocation = helperLat !== null && helperLng !== null
  
  // Calculate distance and ETA if helper location available
  let distance = 0
  let eta = 0
  if (hasHelperLocation) {
    distance = calculateDistanceKm(customerLat, customerLng, helperLat, helperLng)
    // Assume average speed of 25 km/h in city
    eta = Math.round((distance / 25) * 60)
    if (eta < 1) eta = 1
  }

  // Generate static map URL using OpenStreetMap
  const getStaticMapUrl = () => {
    const markers = []
    // Customer marker (red)
    markers.push(`${customerLat},${customerLng}`)
    // Helper marker (blue)
    if (hasHelperLocation) {
      markers.push(`${helperLat},${helperLng}`)
    }
    
    // Use a static map tile service
    const zoom = hasHelperLocation ? 14 : 15
    const centerLat = hasHelperLocation ? (customerLat + helperLat) / 2 : customerLat
    const centerLng = hasHelperLocation ? (customerLng + helperLng) / 2 : customerLng
    
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=${zoom}&size=600x300&maptype=osmarenderer&markers=${customerLat},${customerLng},red|${hasHelperLocation ? `${helperLat},${helperLng},blue` : ''}`
  }

  // Generate Google Maps directions URL
  const getDirectionsUrl = () => {
    if (!hasHelperLocation) return null
    return `https://www.google.com/maps/dir/${helperLat},${helperLng}/${customerLat},${customerLng}`
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Map Background - Using static map or gradient fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-blue-100">
        {/* Try to load static map */}
        <img 
          src={getStaticMapUrl()}
          alt="Map"
          className="w-full h-full object-cover opacity-90"
          onError={(e) => {
            // Hide broken image
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>

      {/* Overlay with location info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

      {/* Location Markers Info */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center justify-between gap-3">
          {/* Customer Location */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-medium">Your Location</p>
              <p className="text-xs font-bold text-gray-900">Service Point</p>
            </div>
          </div>

          {/* Helper Location (if available) */}
          {hasHelperLocation && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium">Helper</p>
                <p className="text-xs font-bold text-gray-900">{distance.toFixed(1)} km</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ETA Badge (if helper is assigned) */}
      {hasHelperLocation && (
        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-bold">~{eta} min away</span>
        </div>
      )}

      {/* Live indicator */}
      {hasHelperLocation && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-medium text-gray-700">Live</span>
        </div>
      )}

      {/* Open in Maps button */}
      {getDirectionsUrl() && (
        <a
          href={getDirectionsUrl()!}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
        >
          <Navigation className="h-4 w-4" />
          <span className="text-xs font-semibold">Directions</span>
        </a>
      )}
    </div>
  )
}

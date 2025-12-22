'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, X, Navigation } from 'lucide-react'

interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
  address?: {
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    pincode?: string
  }
}

interface AddressInteractiveMapProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect?: (address: {
    display_name: string
    city: string
    state: string
    pincode: string
    lat: number
    lng: number
  }) => void
  placeholder?: string
  required?: boolean
  className?: string
  showMap?: boolean
  mapHeight?: string
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }

declare global {
  interface Window {
    google: typeof google
    initGoogleMapsCallback?: () => void
  }
}

// Global state for Google Maps loading
let googleMapsLoadPromise: Promise<void> | null = null
let googleMapsLoaded = false

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  // Already fully loaded
  if (googleMapsLoaded && window.google?.maps) {
    return Promise.resolve()
  }

  // Already loading - return existing promise
  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise
  }

  // Check if script already exists in DOM
  const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
  if (existingScript && window.google?.maps) {
    googleMapsLoaded = true
    return Promise.resolve()
  }

  // Create loading promise
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    // Double check after creating promise
    if (window.google?.maps) {
      googleMapsLoaded = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&region=IN&callback=initGoogleMapsCallback`
    script.async = true
    script.defer = true

    // Setup callback
    window.initGoogleMapsCallback = () => {
      console.log('✅ Google Maps API loaded via callback')
      googleMapsLoaded = true
      resolve()
    }

    script.onerror = (error) => {
      console.error('❌ Google Maps script failed to load', error)
      googleMapsLoadPromise = null
      reject(new Error('Failed to load Google Maps script'))
    }

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (!googleMapsLoaded) {
        console.error('❌ Google Maps load timeout')
        googleMapsLoadPromise = null
        reject(new Error('Google Maps load timeout'))
      }
    }, 15000)

    script.onload = () => {
      clearTimeout(timeout)
      // Callback will handle the resolve
    }

    document.head.appendChild(script)
  })

  return googleMapsLoadPromise
}

export function AddressInteractiveMap({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Search location',
  required = false,
  className = '',
  showMap = true,
  mapHeight = '350px'
}: AddressInteractiveMapProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)
  
  const searchTimeout = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const mapInitialized = useRef(false)
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Load Google Maps script on mount
  useEffect(() => {
    if (!apiKey) {
      setMapError('Google Maps API key is missing')
      return
    }

    let cancelled = false

    const loadMaps = async () => {
      try {
        await loadGoogleMapsScript(apiKey)
        if (!cancelled) {
          setScriptReady(true)
          setMapError(null)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load Google Maps:', error)
          setMapError('Failed to load Google Maps. Please refresh the page.')
        }
      }
    }

    loadMaps()

    return () => {
      cancelled = true
    }
  }, [apiKey])

  // Initialize map once script is ready
  useEffect(() => {
    if (!scriptReady || !mapContainerRef.current || mapInitialized.current) {
      return
    }

    if (!window.google?.maps) {
      console.log('Waiting for Google Maps...')
      return
    }

    mapInitialized.current = true
    
    try {
      console.log('🗺️ Creating Google Map instance...')
      
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 5,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      })

      // Mark loaded when tiles are ready
      const tilesHandler = mapInstanceRef.current.addListener('tilesloaded', () => {
        setMapLoaded(true)
        console.log('✅ Map tiles loaded')
        google.maps.event.removeListener(tilesHandler)
      })

      // Also check idle as backup
      const idleHandler = mapInstanceRef.current.addListener('idle', () => {
        if (!mapLoaded) {
          setMapLoaded(true)
        }
        google.maps.event.removeListener(idleHandler)
      })

      // Click to place marker
      mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          placeMarker({ lat, lng })
          reverseGeocode(lat, lng)
        }
      })

      console.log('✅ Map initialized')
    } catch (error) {
      console.error('❌ Map initialization error:', error)
      setMapError('Failed to initialize map')
    }
  }, [scriptReady])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const placeMarker = useCallback((position: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return

    setSelectedLocation(position)

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    // Create marker with default icon
    markerRef.current = new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    })

    // Drag end handler
    markerRef.current.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setSelectedLocation({ lat, lng })
        reverseGeocode(lat, lng)
      }
    })

    // Center and zoom
    mapInstanceRef.current.setCenter(position)
    mapInstanceRef.current.setZoom(15)
  }, [])

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/address/reverse?lat=${lat}&lng=${lng}`, { 
        cache: 'no-store' 
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.address) {
          onChange(data.address.display_name)
          onAddressSelect?.({
            display_name: data.address.display_name,
            city: data.address.city || '',
            state: data.address.state || '',
            pincode: data.address.pincode || '',
            lat,
            lng
          })
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/address/search?q=${encodeURIComponent(query)}`, { 
        cache: 'no-store' 
      })
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data?.results || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Address search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      searchAddress(newValue)
    }, 500)
  }

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address || {}
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    
    const selectedAddress = {
      display_name: suggestion.display_name,
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || '',
      pincode: addr.postcode || addr.pincode || '',
      lat,
      lng
    }

    onChange(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])
    placeMarker({ lat, lng })
    onAddressSelect?.(selectedAddress)
  }

  const clearAddress = () => {
    onChange('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedLocation(null)
    
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(DEFAULT_CENTER)
      mapInstanceRef.current.setZoom(5)
    }
  }

  const getStoredCoordinates = () => {
    try {
      if (typeof window === 'undefined') return null
      const latString = localStorage.getItem('userLatitude') ?? localStorage.getItem('lastKnownLatitude')
      const lngString = localStorage.getItem('userLongitude') ?? localStorage.getItem('lastKnownLongitude')
      const lat = latString ? parseFloat(latString) : NaN
      const lng = lngString ? parseFloat(lngString) : NaN
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { lat, lng }
    } catch {
      return null
    }
  }

  const persistCoordinates = (lat: number, lng: number) => {
    try {
      if (typeof window === 'undefined') return
      const latString = lat.toString()
      const lngString = lng.toString()
      localStorage.setItem('userLatitude', latString)
      localStorage.setItem('userLongitude', lngString)
      localStorage.setItem('lastKnownLatitude', latString)
      localStorage.setItem('lastKnownLongitude', lngString)
    } catch {
      // Ignore storage failures to avoid blocking the flow
    }
  }

  const fallbackToKnownLocation = (reason: string) => {
    console.warn('Using fallback location:', reason)
    const stored = getStoredCoordinates()
    const coords = stored || DEFAULT_CENTER
    setSelectedLocation(coords)
    placeMarker(coords)
    reverseGeocode(coords.lat, coords.lng)
    setGettingLocation(false)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      fallbackToKnownLocation('Geolocation unsupported')
      return
    }

    setGettingLocation(true)
    let settled = false

    const handleFallback = (message: string) => {
      if (settled) return
      settled = true
      fallbackToKnownLocation(message)
    }

    const timeoutId = window.setTimeout(() => {
      handleFallback('Geolocation timed out')
    }, 12000)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (settled) return
        settled = true
        clearTimeout(timeoutId)
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setSelectedLocation({ lat, lng })
        placeMarker({ lat, lng })
        reverseGeocode(lat, lng)
        persistCoordinates(lat, lng)
        setGettingLocation(false)
      },
      (error) => {
        clearTimeout(timeoutId)
        console.warn('Geolocation error:', error.code, error.message)
        handleFallback(error.message || 'Geolocation error')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  return (
    <div ref={wrapperRef} className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            title={value || ''}
            className={`w-full px-4 py-3 pl-10 pr-14 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base font-semibold text-gray-900 placeholder:text-gray-400 bg-white/95 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 border-gray-200 dark:border-slate-700 whitespace-nowrap overflow-hidden text-ellipsis ${className}`}
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          
          {(isSearching || gettingLocation) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600 animate-spin" />
          )}

          {value && !isSearching && !gettingLocation && (
            <button type="button" onClick={clearAddress} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {gettingLocation ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
          <span className="hidden sm:inline">Current</span>
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{suggestion.display_name}</p>
                  {(suggestion.address?.postcode || suggestion.address?.pincode) && (
                    <p className="text-xs text-gray-500 mt-0.5">PIN: {suggestion.address.postcode || suggestion.address.pincode}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showMap && (
        <div className="space-y-2">
          {mapError ? (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-8 text-center" style={{ height: mapHeight }}>
              <p className="text-red-600 font-semibold">⚠️ {mapError}</p>
              <p className="text-red-500 text-sm mt-2">Please check your Google Maps API key and refresh.</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <div 
                  ref={mapContainerRef} 
                  className="rounded-lg overflow-hidden border-2 border-purple-200" 
                  style={{ height: mapHeight, width: '100%' }} 
                />
                {!mapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
              {selectedLocation && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <MapPin className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="font-medium">✅ Location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</span>
                </div>
              )}
              <p className="text-xs text-gray-600 flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <span className="text-red-500 text-base">📍</span> 
                <span><strong>Tip:</strong> Click map or drag red pin to adjust location</span>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressInteractiveMap

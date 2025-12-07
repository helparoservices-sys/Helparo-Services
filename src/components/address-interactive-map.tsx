'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, X, Navigation } from 'lucide-react'
import Script from 'next/script'

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

declare global {
  interface Window {
    google: any
  }
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
  const searchTimeout = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Handle Google Maps load
  const handleGoogleMapsLoad = () => {
    console.log('✅ Google Maps loaded!')
    if (mapRef.current && !googleMapRef.current) {
      setTimeout(initializeMap, 100)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize map when script is loaded
  useEffect(() => {
    if (!scriptLoaded) {
      console.log('⏳ Script not loaded yet')
      return
    }

    if (!mapRef.current) {
      console.log('⏳ Map ref not ready')
      return
    }

    if (googleMapRef.current) {
      console.log('✓ Map already initialized')
      return
    }

    if (!window.google?.maps) {
      console.log('⚠️ Script loaded but google.maps not available')
      return
    }

    console.log('🗺️ All conditions met - initializing map!')
    
    // Small delay to ensure everything is ready
    const timer = setTimeout(() => {
      try {
        initializeMap()
      } catch (error) {
        console.error('Error in initializeMap:', error)
        setMapError('Failed to initialize map')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [scriptLoaded])

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps || googleMapRef.current) {
      console.log('Cannot initialize map', { 
        hasMapRef: !!mapRef.current, 
        hasGoogle: !!window.google?.maps,
        hasGoogleMapRef: !!googleMapRef.current 
      })
      return
    }

    console.log('🗺️ Initializing map...')

    try {
      const defaultCenter = selectedLocation || { lat: 20.5937, lng: 78.9629 }
      
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: selectedLocation ? 15 : 5,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      })

      // Force resize
      setTimeout(() => {
        window.google.maps.event.trigger(googleMapRef.current, 'resize')
        googleMapRef.current.setCenter(defaultCenter)
        setMapLoaded(true)
        console.log('✅ Map loaded and ready')
      }, 300)ons/red-dot.png'
      }
    })

    markerRef.current.addListener('dragend', (e: any) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setSelectedLocation({ lat, lng })
      reverseGeocode(lat, lng)
    })
  }

  const updateMarkerPosition = (position: { lat: number; lng: number }) => {
    setSelectedLocation(position)
    
    if (markerRef.current) {
      markerRef.current.setPosition(position)
    } else {
      createMarker(position)
    }

    if (googleMapRef.current) {
      googleMapRef.current.setCenter(position)
      googleMapRef.current.setZoom(15)
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/address/reverse?lat=${lat}&lng=${lng}`, { cache: 'no-store' })
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
      const response = await fetch(`/api/address/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
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
    updateMarkerPosition({ lat, lng })
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
    
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: 20.5937, lng: 78.9629 })
      googleMapRef.current.setZoom(5)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        updateMarkerPosition({ lat, lng })
        reverseGeocode(lat, lng)
        setGettingLocation(false)
      },
      () => {
        alert('Unable to get your location')
        setGettingLocation(false)
      }
    )
  }

  return (
    <div ref={wrapperRef} className="space-y-4">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyDCS0wAuS7OMSgByRvM2HdQ80YC4CLDR4s&libraries=places`}
        strategy="afterInteractive"
        onLoad={handleGoogleMapsLoad}
        onError={() => {
          console.error('❌ Failed to load Google Maps')
          setMapError('Failed to load map')
        }}
      />
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            className={`w-full px-4 py-3 pl-10 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          
          {(isSearching || gettingLocation) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600 animate-spin" />
          )}

          {value && !isSearching && !gettingLocation && (
            <button type="button" onClick={clearAddress} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
            </div>
          ) : (
            <>
              <div className="relative">
                <div ref={mapRef} className="rounded-lg overflow-hidden border-2 border-purple-200" style={{ height: mapHeight, width: '100%' }} />
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

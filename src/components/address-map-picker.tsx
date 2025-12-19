'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, Navigation, X } from 'lucide-react'
import { useLocation } from '@/lib/use-location'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'

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

interface AddressMapPickerProps {
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

const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 20.5937, // India center
  lng: 78.9629
}

export function AddressMapPicker({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Enter address or drop a pin on the map',
  required = false,
  className = '',
  showMap = true,
  mapHeight = '400px'
}: AddressMapPickerProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [mapZoom, setMapZoom] = useState(5)
  const [isGettingAddress, setIsGettingAddress] = useState(false)
  const [mapLoadError, setMapLoadError] = useState<string | null>(null)
  
  const { requestLocation, isLoading: locationLoading, address, coordinates } = useLocation()
  const searchTimeout = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  // Check if Google Maps API key is available
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set')
      setMapLoadError('Google Maps API key is missing')
    } else {
      console.log('✅ Google Maps API key is configured')
    }
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-fill when location is detected
  useEffect(() => {
    if (address && coordinates && !value) {
      onChange(address.formatted_address)
      setSelectedLocation({ lat: coordinates.latitude, lng: coordinates.longitude })
      setMapCenter({ lat: coordinates.latitude, lng: coordinates.longitude })
      setMapZoom(15)
      
      if (onAddressSelect) {
        onAddressSelect({
          display_name: address.formatted_address,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          lat: coordinates.latitude,
          lng: coordinates.longitude
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, coordinates])

  // Search for address suggestions
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

    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      searchAddress(newValue)
    }, 500)
  }

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    const addr = suggestion.address || {}
    const selectedAddress = {
      display_name: suggestion.display_name,
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || '',
      pincode: addr.postcode || addr.pincode || '',
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    }

    onChange(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedLocation({ lat: selectedAddress.lat, lng: selectedAddress.lng })
    setMapCenter({ lat: selectedAddress.lat, lng: selectedAddress.lng })
    setMapZoom(15)
    
    console.log('✅ Address selected:', selectedAddress)
    onAddressSelect?.(selectedAddress)
  }

  const handleUseCurrentLocation = async () => {
    const coords = await requestLocation()
    if (coords && address) {
      onChange(address.formatted_address)
      setSelectedLocation({ lat: coords.latitude, lng: coords.longitude })
      setMapCenter({ lat: coords.latitude, lng: coords.longitude })
      setMapZoom(15)
      
      onAddressSelect?.({
        display_name: address.formatted_address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        lat: coords.latitude,
        lng: coords.longitude
      })
    }
  }

  // Reverse geocode when map is clicked
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsGettingAddress(true)
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
    } finally {
      setIsGettingAddress(false)
    }
  }

  const handleMapClick = useCallback((e: any) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setSelectedLocation({ lat, lng })
      getAddressFromCoordinates(lat, lng)
    }
  }, [])

  const handleMarkerDragEnd = useCallback((e: any) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setSelectedLocation({ lat, lng })
      getAddressFromCoordinates(lat, lng)
    }
  }, [])

  const onMapLoad = useCallback((map: any) => {
    mapRef.current = map
  }, [])

  const clearLocation = () => {
    setSelectedLocation(null)
    onChange('')
    setMapZoom(5)
    setMapCenter(defaultCenter)
  }

  return (
    <div ref={wrapperRef} className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            className={`w-full px-4 py-3 pl-10 pr-20 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${className}`}
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          
          {(isSearching || isGettingAddress) && (
            <Loader2 className="absolute right-14 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 animate-spin" />
          )}

          {value && (
            <button
              type="button"
              onClick={clearLocation}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Clear location"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locationLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
            title="Use current location"
          >
            {locationLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {suggestion.display_name}
                    </p>
                    {(suggestion.address?.postcode || suggestion.address?.pincode) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        PIN: {suggestion.address.postcode || suggestion.address.pincode}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Google Map */}
      {showMap && (
        <div className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600" style={{ height: mapHeight }}>
          {mapLoadError ? (
            <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20">
              <div className="text-center p-6">
                <p className="text-red-600 dark:text-red-400 font-semibold mb-2">⚠️ Map Loading Error</p>
                <p className="text-sm text-red-500 dark:text-red-300">{mapLoadError}</p>
              </div>
            </div>
          ) : (
            <LoadScript 
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
              libraries={['places']}
              onLoad={() => console.log('✅ Google Maps loaded successfully')}
              onError={(error) => {
                console.error('❌ Google Maps failed to load:', error)
                setMapLoadError('Failed to load Google Maps. Please check your internet connection.')
              }}
              loadingElement={
                <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading Map...</p>
                  </div>
                </div>
              }
            >
              <GoogleMap
                mapContainerStyle={{ ...mapContainerStyle, height: mapHeight }}
                center={mapCenter}
                zoom={mapZoom}
                onClick={handleMapClick}
                onLoad={onMapLoad}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                  zoomControl: true,
                }}
              >
                {selectedLocation && (
                  <Marker
                    position={selectedLocation}
                    draggable={true}
                    onDragEnd={handleMarkerDragEnd}
                  />
                )}
              </GoogleMap>
            </LoadScript>
          )}
          
          <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-lg text-xs text-slate-600 dark:text-slate-300">
            💡 Click or drag the pin to set your location
          </div>
        </div>
      )}
    </div>
  )
}

export default AddressMapPicker

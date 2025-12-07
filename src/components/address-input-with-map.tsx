'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'

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

interface AddressInputWithMapProps {
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

export function AddressInputWithMap({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Search for your service location',
  required = false,
  className = '',
  showMap = true,
  mapHeight = '350px'
}: AddressInputWithMapProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLIFrameElement>(null)

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
    setSelectedLocation({ lat, lng })
    
    console.log('✅ Address selected:', selectedAddress)
    onAddressSelect?.(selectedAddress)
  }

  const clearAddress = () => {
    onChange('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedLocation(null)
  }

  // Generate map URL with selected location
  const getMapUrl = () => {
    if (!selectedLocation) {
      return `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=20.5937,78.9629&zoom=5`
    }
    return `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${selectedLocation.lat},${selectedLocation.lng}&zoom=15`
  }

  return (
    <div ref={wrapperRef} className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        
        {isSearching && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600 animate-spin" />
        )}

        {value && !isSearching && (
          <button
            type="button"
            onClick={clearAddress}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Clear address"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.display_name}
                  </p>
                  {(suggestion.address?.postcode || suggestion.address?.pincode) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      PIN: {suggestion.address.postcode || suggestion.address.pincode}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Google Map */}
      {showMap && (
        <div className="rounded-lg overflow-hidden border-2 border-purple-200" style={{ height: mapHeight }}>
          <iframe
            ref={mapRef}
            src={getMapUrl()}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Service Location Map"
          />
          {selectedLocation && (
            <div className="relative -mt-12 ml-4 mb-2 bg-white px-3 py-2 rounded-lg shadow-lg text-xs text-gray-700 inline-block">
              📍 {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressInputWithMap

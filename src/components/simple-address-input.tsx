'use client'

import { useState, useEffect, useRef } from 'react'
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

interface SimpleAddressInputProps {
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
}

export function SimpleAddressInput({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Enter your service location',
  required = false,
  className = ''
}: SimpleAddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)

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
    
    console.log('✅ Address selected:', selectedAddress)
    onAddressSelect?.(selectedAddress)
  }

  const clearAddress = () => {
    onChange('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
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
          alert('Failed to get address for your location')
        } finally {
          setGettingLocation(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location. Please enable location services.')
        setGettingLocation(false)
      }
    )
  }

  return (
    <div ref={wrapperRef} className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
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
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600 animate-spin" />
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
        
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Use current location"
        >
          {gettingLocation ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Navigation className="h-5 w-5" />
          )}
          <span className="hidden sm:inline">Current</span>
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
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
    </div>
  )
}

export default SimpleAddressInput

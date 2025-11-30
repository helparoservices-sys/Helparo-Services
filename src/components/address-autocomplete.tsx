'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, Navigation } from 'lucide-react'
import { useLocation } from '@/lib/use-location'

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
  }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect?: (address: {
    formatted_address: string
    city: string
    state: string
    pincode: string
    latitude: number
    longitude: number
  }) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Enter address',
  required = false,
  className = ''
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { requestLocation, isLoading: locationLoading, address, coordinates } = useLocation()
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

  // Auto-fill when location is detected
  useEffect(() => {
    if (address && coordinates && !value) {
      onChange(address.formatted_address)
      if (onAddressSelect) {
        onAddressSelect({
          formatted_address: address.formatted_address,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
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
      formatted_address: suggestion.display_name,
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || '',
      pincode: addr.postcode || '',
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    }

    onChange(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])
    onAddressSelect?.(selectedAddress)
  }

  const handleUseCurrentLocation = async () => {
    const coords = await requestLocation()
    if (coords && address) {
      onChange(address.formatted_address)
      onAddressSelect?.({
        formatted_address: address.formatted_address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        latitude: coords.latitude,
        longitude: coords.longitude
      })
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 pl-10 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${className}`}
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 animate-spin" />
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
                  {suggestion.address?.postcode && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      PIN: {suggestion.address.postcode}
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

export default AddressAutocomplete

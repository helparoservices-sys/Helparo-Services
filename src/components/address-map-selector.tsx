'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, Navigation } from 'lucide-react'
import { useLocation } from '@/lib/use-location'
import { Loader } from '@googlemaps/js-api-loader'

interface PlacePrediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

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

interface AddressMapSelectorProps {
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

export function AddressMapSelector({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Enter address or click on map',
  required = false,
  className = ''
}: AddressMapSelectorProps) {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingAddress, setIsGettingAddress] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const { requestLocation, isLoading: locationLoading, address, coordinates } = useLocation()
  const searchTimeout = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLIFrameElement>(null)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const isGoogleMapsLoaded = useRef(false)

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (isGoogleMapsLoaded.current) return

      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        })

        await loader.load()
        
        autocompleteService.current = new google.maps.places.AutocompleteService()
        const dummyDiv = document.createElement('div')
        placesService.current = new google.maps.places.PlacesService(dummyDiv)
        
        isGoogleMapsLoaded.current = true
      } catch (error) {
        console.error('Failed to load Google Maps:', error)
      }
    }

    loadGoogleMaps()
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

  // Search for address suggestions using Google Places API
  const searchAddress = async (query: string) => {
    if (query.length < 3 || !autocompleteService.current) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' },
          types: ['geocode', 'establishment']
        },
        (predictions, status) => {
          setIsSearching(false)
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions)
            setShowSuggestions(true)
          } else {
            setSuggestions([])
          }
        }
      )
    } catch (error) {
      console.error('Address search error:', error)
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

  const handleSuggestionClick = async (prediction: PlacePrediction) => {
    if (!placesService.current) return

    setIsSearching(true)
    
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'geometry', 'formatted_address']
      },
      (place, status) => {
        setIsSearching(false)
        
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          let city = ''
          let state = ''
          let pincode = ''
          
          place.address_components?.forEach((component) => {
            if (component.types.includes('locality')) {
              city = component.long_name
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name
            }
            if (component.types.includes('postal_code')) {
              pincode = component.long_name
            }
          })

          const selectedAddress = {
            display_name: place.formatted_address || prediction.description,
            city,
            state,
            pincode,
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0
          }

          onChange(selectedAddress.display_name)
          setShowSuggestions(false)
          setSuggestions([])
          setSelectedLocation({ lat: selectedAddress.lat, lng: selectedAddress.lng })
          
          onAddressSelect?.(selectedAddress)
        }
      }
    )
  }

  const handleUseCurrentLocation = async () => {
    const coords = await requestLocation()
    if (coords && address) {
      onChange(address.formatted_address)
      setSelectedLocation({ lat: coords.latitude, lng: coords.longitude })
      
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

  // Generate Google Maps embed URL
  const getMapUrl = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (selectedLocation) {
      // Show specific location with marker
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${selectedLocation.lat},${selectedLocation.lng}&zoom=15`
    } else {
      // Show default map of India
      return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=20.5937,78.9629&zoom=5`
    }
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
            className={`w-full px-4 py-3 pl-10 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${className}`}
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          
          {(isSearching || isGettingAddress) && (
            <Loader2 className="absolute right-14 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 animate-spin" />
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
            {suggestions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSuggestionClick(prediction)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {prediction.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Google Maps Embed */}
      <div className="rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-md">
        <iframe
          ref={mapRef}
          src={getMapUrl()}
          width="100%"
          height="350"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setMapLoaded(true)}
          className="w-full"
        />
        {!mapLoaded && (
          <div className="flex items-center justify-center h-[350px] bg-slate-100 dark:bg-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>Location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</span>
        </div>
      )}
    </div>
  )
}

export default AddressMapSelector

'use client'

import { useState, useEffect, useCallback } from 'react'

export interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface LocationAddress {
  formatted_address: string
  city: string
  state: string
  country: string
  pincode: string
  street?: string
  locality?: string
}

export interface LocationData {
  coordinates: LocationCoordinates | null
  address: LocationAddress | null
  isLoading: boolean
  error: string | null
  hasPermission: boolean | null
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData>({
    coordinates: null,
    address: null,
    isLoading: false,
    error: null,
    hasPermission: null
  })

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (coords: LocationCoordinates) => {
    try {
      let geoData = null

      // Try geocode.maps.co first (CORS-friendly)
      try {
        const response1 = await fetch(
          `https://geocode.maps.co/reverse?lat=${coords.latitude}&lon=${coords.longitude}`
        )
        if (response1.ok) {
          geoData = await response1.json()
        }
      } catch (err) {
        console.log('geocode.maps.co failed, trying nominatim')
      }

      // Fallback to nominatim
      if (!geoData || !geoData.address) {
        const response2 = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'HelparoServices/1.0',
              'Accept-Language': 'en'
            }
          }
        )
        if (response2.ok) {
          geoData = await response2.json()
        }
      }

      if (!geoData) throw new Error('Geocoding failed')

      const addr = geoData.address || {}

      const address: LocationAddress = {
        formatted_address: geoData.display_name || '',
        city: addr.city || addr.town || addr.village || addr.suburb || addr.municipality || '',
        state: addr.state || addr.region || '',
        country: addr.country || 'India',
        pincode: addr.postcode || addr.postal_code || '',
        street: addr.road || addr.street || '',
        locality: addr.suburb || addr.neighbourhood || addr.locality || ''
      }

      setLocation(prev => ({
        ...prev,
        address
      }))

      return address
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }, [])

  // Request location permission and get current location
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        hasPermission: false
      }))
      return null
    }

    setLocation(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const coordinates: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      }

      setLocation(prev => ({
        ...prev,
        coordinates,
        hasPermission: true,
        isLoading: false
      }))

      // Reverse geocode to get address
      await reverseGeocode(coordinates)

      return coordinates
    } catch (err) {
      const error = err as GeolocationPositionError
      let errorMessage = 'Failed to get location'
      
      if (error.code === 1) {
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please check your device settings.'
      } else if (error.code === 3) {
        errorMessage = 'Location request timeout. Please try again.'
      }

      setLocation(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        hasPermission: error.code === 1 ? false : null
      }))

      return null
    }
  }, [reverseGeocode])

  // Forward geocode address string to coordinates
  const geocodeAddress = useCallback(async (addressString: string): Promise<LocationCoordinates | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      )

      if (!response.ok) throw new Error('Geocoding failed')

      const data = await response.json()
      if (data && data.length > 0) {
        const coords: LocationCoordinates = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }
        return coords
      }

      return null
    } catch (error) {
      console.error('Forward geocoding error:', error)
      return null
    }
  }, [])

  // Calculate distance between two coordinates (in km)
  const calculateDistance = useCallback((
    coords1: LocationCoordinates,
    coords2: LocationCoordinates
  ): number => {
    const R = 6371 // Radius of Earth in km
    const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180
    const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coords1.latitude * Math.PI / 180) *
      Math.cos(coords2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  // Check permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setLocation(prev => ({
          ...prev,
          hasPermission: result.state === 'granted'
        }))
      }).catch(() => {
        // Permissions API not supported
      })
    }
  }, [])

  return {
    ...location,
    requestLocation,
    reverseGeocode,
    geocodeAddress,
    calculateDistance
  }
}

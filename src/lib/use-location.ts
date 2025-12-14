'use client'

import { useState, useEffect, useCallback } from 'react'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'

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
      const response = await fetch(`/api/geocode?lat=${coords.latitude}&lng=${coords.longitude}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Geocoding failed')
      const geo = await response.json()

      const address: LocationAddress = {
        formatted_address: geo.formatted_address || '',
        city: geo.city || '',
        state: geo.state || '',
        country: 'India',
        pincode: geo.pincode || '',
        street: '',
        locality: ''
      }

      setLocation(prev => ({
        ...prev,
        address,
        error: null
      }))

      return address
    } catch {
      return null
    }
  }, [])

  // Request location permission and get current location
  const requestLocation = useCallback(async () => {
    setLocation(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      let coordinates: LocationCoordinates

      // Use Capacitor Geolocation for native apps
      if (Capacitor.isNativePlatform()) {
        // Request permission first (this triggers the Android permission dialog)
        const permStatus = await Geolocation.requestPermissions()
        
        if (permStatus.location !== 'granted' && permStatus.coarseLocation !== 'granted') {
          setLocation(prev => ({
            ...prev,
            isLoading: false,
            error: 'Location permission denied. Please enable location access in app settings.',
            hasPermission: false
          }))
          return null
        }

        // Get current position
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000
        })

        coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      } else {
        // Web browser fallback
        if (!navigator.geolocation) {
          setLocation(prev => ({
            ...prev,
            error: 'Geolocation is not supported by your browser',
            hasPermission: false,
            isLoading: false
          }))
          return null
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          })
        })

        coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
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
      let errorMessage = 'Failed to get location'
      
      if (err instanceof Error) {
        if (err.message.includes('denied') || err.message.includes('permission')) {
          errorMessage = 'Location permission denied. Please enable location access in settings.'
        } else if (err.message.includes('unavailable')) {
          errorMessage = 'Location unavailable. Please check your device settings.'
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Location request timeout. Please try again.'
        }
      } else if (typeof err === 'object' && err !== null && 'code' in err) {
        const error = err as GeolocationPositionError
        if (error.code === 1) {
          errorMessage = 'Location permission denied. Please enable location access in settings.'
        } else if (error.code === 2) {
          errorMessage = 'Location unavailable. Please check your device settings.'
        } else if (error.code === 3) {
          errorMessage = 'Location request timeout. Please try again.'
        }
      }

      setLocation(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        hasPermission: false
      }))

      return null
    }
  }, [reverseGeocode])

  // Forward geocode address string to coordinates
  const geocodeAddress = useCallback(async (addressString: string): Promise<LocationCoordinates | null> => {
    try {
      const response = await fetch(`/api/address/search?q=${encodeURIComponent(addressString)}`, { cache: 'no-store' })
      if (!response.ok) return null
      const data = await response.json()
      const first = Array.isArray(data?.results) ? data.results[0] : null
      if (first) {
        const coords: LocationCoordinates = {
          latitude: parseFloat(first.lat),
          longitude: parseFloat(first.lon)
        }
        return coords
      }
      return null
    } catch {
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
    const checkPermission = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Use Capacitor for native apps
          const status = await Geolocation.checkPermissions()
          setLocation(prev => ({
            ...prev,
            hasPermission: status.location === 'granted' || status.coarseLocation === 'granted'
          }))
        } else if ('permissions' in navigator) {
          // Web browser
          const result = await navigator.permissions.query({ name: 'geolocation' })
          setLocation(prev => ({
            ...prev,
            hasPermission: result.state === 'granted'
          }))
        }
      } catch {
        // Permissions API not supported
      }
    }
    checkPermission()
  }, [])

  return {
    ...location,
    requestLocation,
    reverseGeocode,
    geocodeAddress,
    calculateDistance
  }
}

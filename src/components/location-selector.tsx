'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'

export function LocationSelector() {
  const [location, setLocation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if location is already saved in localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation')
    if (savedLocation) {
      setLocation(savedLocation)
    }
  }, [])

  const getLocation = () => {
    console.log('Get location button clicked!')
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError(null)
    console.log('Requesting geolocation...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Geolocation success:', position.coords)
        try {
          const { latitude, longitude } = position.coords
          
          console.log('Calling geocode API with:', latitude, longitude)
          
          // Call our API route for geocoding (avoids CORS issues)
          const response = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`)
          
          if (!response.ok) {
            const errorData = await response.json()
            console.error('Geocode API error:', errorData)
            setError(`Failed to get location: ${errorData.error || response.statusText}`)
            setLoading(false)
            return
          }
          
          const data = await response.json()
          
          console.log('Geocoding response:', data)
          
          if (data.city) {
            const locationString = data.city
            setLocation(locationString)
            
            // Save to localStorage
            localStorage.setItem('userLocation', locationString)
            localStorage.setItem('userLatitude', latitude.toString())
            localStorage.setItem('userLongitude', longitude.toString())
            
            console.log('Location saved:', locationString)
          } else {
            console.error('No city found in response')
            setError('Could not determine city from your location')
          }
        } catch (err) {
          console.error('Error getting location:', err)
          setError(`Error: ${err instanceof Error ? err.message : 'Could not determine your location'}`)
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error('Geolocation error:', err)
        setLoading(false)
        if (err.code === 1) {
          setError('Location permission denied')
        } else {
          setError('Unable to retrieve location')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    )
  }

  if (location) {
    return (
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/30">
        <CheckCircle className="h-4 w-4 text-green-300" />
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">{location}</span>
        </div>
        <button 
          onClick={() => {
            setLocation(null)
            localStorage.removeItem('userLocation')
            localStorage.removeItem('userLatitude')
            localStorage.removeItem('userLongitude')
          }}
          className="text-xs text-blue-100 hover:text-white underline ml-2"
        >
          Change
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-red-400/30">
        <p className="text-sm text-white">{error}</p>
        <button 
          onClick={() => {
            setError(null)
            getLocation()
          }}
          className="text-xs text-white underline mt-1"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <Button
      onClick={getLocation}
      disabled={loading}
      variant="outline"
      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Getting location...
        </>
      ) : (
        <>
          <MapPin className="h-4 w-4 mr-2" />
          Set Location
        </>
      )}
    </Button>
  )
}

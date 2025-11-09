/**
 * REPEAT BOOKING & FAVORITE HELPERS
 * One-click rebooking for returning customers
 * Addresses UX gap: "I have to re-enter all details every time"
 */

'use client'

import { useState, useEffect } from 'react'
import { Heart, RotateCcw, Star, Clock, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FavoriteHelper {
  id: string
  user_id: string
  helper_id: string
  helper_name: string
  helper_image: string
  helper_rating: number
  service_type: string
  last_booked: Date
  total_bookings: number
}

interface PastBooking {
  id: string
  helper_id: string
  helper_name: string
  helper_image: string
  service_type: string
  service_date: Date
  location: string
  duration_hours: number
  total_cost: number
  notes: string
}

/**
 * FAVORITE HELPERS WIDGET
 */
export function FavoriteHelpers({ userId }: { userId: string }) {
  const [favorites, setFavorites] = useState<FavoriteHelper[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [userId])

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${userId}/favorites`)
      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (helperId: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await fetch(`/api/customers/${userId}/favorites/${helperId}`, {
          method: 'DELETE',
        })
        setFavorites(favorites.filter((f) => f.helper_id !== helperId))
      } else {
        await fetch(`/api/customers/${userId}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ helper_id: helperId }),
        })
        fetchFavorites()
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Loading favorites...</div>
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-8">
          <Heart className="h-12 w-12 mx-auto mb-2 opacity-50 text-gray-400" />
          <p className="text-gray-600">No favorite helpers yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Click the heart icon on helpers you love
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Your Favorite Helpers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <img
                src={favorite.helper_image || '/default-avatar.png'}
                alt={favorite.helper_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              
              <div className="flex-1">
                <p className="font-medium">{favorite.helper_name}</p>
                <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{favorite.helper_rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span>{favorite.total_bookings} bookings</span>
                </div>
              </div>

              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => window.location.href = `/book/${favorite.helper_id}`}
              >
                Book Again
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * REPEAT BOOKING COMPONENT
 * One-click rebooking with saved preferences
 */
export function RepeatBookingCard({ booking }: { booking: PastBooking }) {
  const [isBooking, setIsBooking] = useState(false)

  const handleRepeatBooking = async () => {
    setIsBooking(true)
    try {
      // Pre-fill form with previous booking details
      const response = await fetch('/api/bookings/repeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previous_booking_id: booking.id,
          helper_id: booking.helper_id,
          service_type: booking.service_type,
          location: booking.location,
          duration_hours: booking.duration_hours,
          notes: booking.notes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to booking confirmation
        window.location.href = `/bookings/${data.booking_id}/confirm`
      } else {
        alert('Failed to create repeat booking. Please try again.')
      }
    } catch (error) {
      console.error('Failed to repeat booking:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <img
            src={booking.helper_image || '/default-avatar.png'}
            alt={booking.helper_name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          
          <div className="flex-1">
            <h3 className="font-medium text-lg">{booking.helper_name}</h3>
            <p className="text-sm text-gray-600">{booking.service_type}</p>
            
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(booking.service_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{booking.duration_hours} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{booking.location}</span>
              </div>
              <div className="font-medium text-purple-600">
                ₹{booking.total_cost}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {booking.notes && (
              <p className="italic">"{booking.notes}"</p>
            )}
          </div>
          
          <Button
            onClick={handleRepeatBooking}
            disabled={isBooking}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isBooking ? 'Booking...' : 'Book Again'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * RECENT BOOKINGS WITH REPEAT OPTION
 * Shows past bookings with one-click rebook
 */
export function RecentBookingsWidget({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<PastBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentBookings()
  }, [userId])

  const fetchRecentBookings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${userId}/recent-bookings?limit=5`)
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Failed to fetch recent bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Loading recent bookings...</div>
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50 text-gray-400" />
          <p className="text-gray-600">No recent bookings</p>
          <p className="text-sm text-gray-500 mt-1">
            Your booking history will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <RotateCcw className="h-5 w-5" />
        Book Again
      </h2>
      
      {bookings.map((booking) => (
        <RepeatBookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}

/**
 * FAVORITE TOGGLE BUTTON
 * Add/remove helper from favorites
 */
export function FavoriteToggleButton({ 
  helperId, 
  userId,
  initialIsFavorite = false 
}: { 
  helperId: string
  userId: string
  initialIsFavorite?: boolean
}) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isLoading, setIsLoading] = useState(false)

  const toggleFavorite = async () => {
    setIsLoading(true)
    try {
      if (isFavorite) {
        await fetch(`/api/customers/${userId}/favorites/${helperId}`, {
          method: 'DELETE',
        })
        setIsFavorite(false)
      } else {
        await fetch(`/api/customers/${userId}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ helper_id: helperId }),
        })
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isFavorite
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      }`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`}
      />
    </button>
  )
}

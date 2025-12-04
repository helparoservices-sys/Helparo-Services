'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Clock, 
  DollarSign, 
  Zap,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'

interface InstantBooking {
  helper: {
    id: string
    user_id: string
    instant_booking_price: number
    instant_booking_duration_minutes: number
    auto_accept_enabled: boolean
    profiles: {
      id: string
      full_name: string
      avatar_url: string | null
      phone: string
    }
  }
  service_details: {
    category_id: string
    title?: string
    description: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
    location_lat: number | null
    location_lng: number | null
  }
  price: number
  duration: number
}

export default function InstantBookingConfirmPage() {
  const router = useRouter()
  const [booking, setBooking] = useState<InstantBooking | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Retrieve booking details from sessionStorage
    const storedBooking = sessionStorage.getItem('instant_booking')
    if (!storedBooking) {
      router.push('/customer/requests/new')
      return
    }

    try {
      const parsed = JSON.parse(storedBooking)
      setBooking(parsed)
    } catch (err) {
      console.error('Failed to parse booking data:', err)
      router.push('/customer/requests/new')
    }
  }, [router])

  const confirmBooking = async () => {
    if (!booking) return

    setConfirming(true)
    setError('')

    try {
      // Create instant booking request
      const response = await fetch('/api/bookings/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helper_id: booking.helper.id,
          category_id: booking.service_details.category_id,
          description: booking.service_details.description,
          service_address: booking.service_details.address,
          city: booking.service_details.city,
          state: booking.service_details.state,
          pincode: booking.service_details.pincode,
          phone: booking.service_details.phone,
          location_lat: booking.service_details.location_lat,
          location_lng: booking.service_details.location_lng,
          price: booking.price,
          duration_minutes: booking.duration,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create booking')
      }

      // Clear session storage
      sessionStorage.removeItem('instant_booking')

      // Redirect to payment page
      router.push(`/customer/payments/checkout?booking_id=${data.booking_id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm booking'
      console.error('Booking confirmation error:', err)
      setError(errorMessage)
    } finally {
      setConfirming(false)
    }
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const initials = booking.helper.profiles.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '??'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
            Confirm Instant Booking
          </h1>
          <p className="mt-2 text-slate-600">
            Review your booking details before proceeding to payment
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Helper Details */}
        <Card className="mb-6 border-2 border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-teal-600" />
              Your Selected Helper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-20 w-20 border-2 border-white shadow-lg">
                <AvatarImage src={booking.helper.profiles.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-teal-500 text-white font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {booking.helper.profiles.full_name}
                </h3>
                {booking.helper.auto_accept_enabled && (
                  <Badge className="bg-green-500 text-white mt-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Auto-Accept - Instant Confirmation
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-teal-600" />
                <div>
                  <p className="text-xs text-gray-500">Service Price</p>
                  <p className="text-xl font-bold text-teal-700">₹{booking.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-lg font-bold text-gray-900">{booking.duration} minutes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.service_details.description && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                <p className="text-gray-600">{booking.service_details.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Service Location
              </p>
              <p className="text-gray-600">
                {booking.service_details.address}
                {booking.service_details.city && `, ${booking.service_details.city}`}
                {booking.service_details.state && `, ${booking.service_details.state}`}
                {booking.service_details.pincode && ` - ${booking.service_details.pincode}`}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Number
              </p>
              <p className="text-gray-600">{booking.service_details.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="space-y-2 text-sm text-blue-900">
                <p className="font-bold text-base">What happens next?</p>
                <ul className="space-y-1 ml-1">
                  <li>✓ You&apos;ll be redirected to secure payment</li>
                  <li>✓ {booking.helper.auto_accept_enabled ? 'Your booking is auto-confirmed' : 'Helper will be notified immediately'}</li>
                  <li>✓ Helper will contact you to confirm timing</li>
                  <li>✓ Payment held securely until service completion</li>
                  <li>✓ Full refund if service not satisfactory</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={confirming}
          >
            Go Back
          </Button>
          <Button
            onClick={confirmBooking}
            disabled={confirming}
            className="flex-1 h-12 text-base bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 font-bold shadow-lg"
          >
            {confirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Confirm & Pay ₹{booking.price}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

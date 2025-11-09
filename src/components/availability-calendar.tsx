/**
 * HELPER AVAILABILITY CALENDAR
 * Visual calendar showing helper's free slots with instant booking
 * Addresses UX gap: "I can't see when the helper is actually free"
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  is_available: boolean
  is_booked: boolean
}

interface DayAvailability {
  date: Date
  slots: TimeSlot[]
  total_slots: number
  available_slots: number
}

/**
 * AVAILABILITY CALENDAR COMPONENT
 */
export function HelperAvailabilityCalendar({ 
  helperId,
  onBookSlot 
}: { 
  helperId: string
  onBookSlot?: (slotId: string, date: Date) => void
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailability()
  }, [helperId, selectedDate])

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      // Get 7 days of availability starting from selected date
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)

      const response = await fetch(
        `/api/helpers/${helperId}/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      )
      
      const data = await response.json()
      setAvailability(data.availability || [])
    } catch (error) {
      console.error('Failed to fetch availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookSlot = (slotId: string, date: Date) => {
    setSelectedSlot(slotId)
    if (onBookSlot) {
      onBookSlot(slotId, date)
    }
  }

  const getDayAvailability = (date: Date): DayAvailability | undefined => {
    return availability.find(day => {
      const dayDate = new Date(day.date)
      return dayDate.toDateString() === date.toDateString()
    })
  }

  const renderWeekCalendar = () => {
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedDate)
      date.setDate(selectedDate.getDate() + i)
      
      const dayAvailability = getDayAvailability(date)
      const isToday = date.toDateString() === today.toDateString()
      const isPast = date < today

      days.push(
        <button
          key={i}
          onClick={() => !isPast && setSelectedDate(date)}
          disabled={isPast}
          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
            selectedDate.toDateString() === date.toDateString()
              ? 'border-purple-600 bg-purple-50'
              : isPast
              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:border-purple-400'
          }`}
        >
          <div className="text-xs text-gray-600 mb-1">
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
          <div className={`text-2xl font-bold ${
            isToday ? 'text-purple-600' : 'text-gray-900'
          }`}>
            {date.getDate()}
          </div>
          {dayAvailability && (
            <div className="mt-2 text-xs">
              {dayAvailability.available_slots > 0 ? (
                <span className="text-green-600 font-medium">
                  {dayAvailability.available_slots} slots
                </span>
              ) : (
                <span className="text-red-600">Full</span>
              )}
            </div>
          )}
        </button>
      )
    }

    return days
  }

  const renderTimeSlots = () => {
    const dayAvailability = getDayAvailability(selectedDate)

    if (!dayAvailability) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No availability data for this date</p>
        </div>
      )
    }

    if (dayAvailability.slots.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <XCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Helper is not available on this date</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {dayAvailability.slots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => handleBookSlot(slot.id, selectedDate)}
            disabled={!slot.is_available || slot.is_booked}
            className={`p-4 rounded-lg border-2 transition-all ${
              slot.is_booked
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                : slot.is_available
                ? 'border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100'
                : 'border-gray-300 bg-gray-50 cursor-not-allowed'
            } ${selectedSlot === slot.id ? 'ring-2 ring-purple-600' : ''}`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {new Date(slot.start_time).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
            
            {slot.is_booked ? (
              <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                <XCircle className="h-3 w-3" />
                <span>Booked</span>
              </div>
            ) : slot.is_available ? (
              <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Available</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <XCircle className="h-3 w-3" />
                <span>Unavailable</span>
              </div>
            )}
          </button>
        ))}
      </div>
    )
  }

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 7)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (newDate >= today) {
      setSelectedDate(newDate)
    }
  }

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedDate(newDate)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Availability Calendar
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Select a date and time slot to book this helper
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
              <Button onClick={goToPreviousWeek} variant="outline" size="sm">
                ← Previous Week
              </Button>
              <span className="font-medium">
                {selectedDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              <Button onClick={goToNextWeek} variant="outline" size="sm">
                Next Week →
              </Button>
            </div>

            {/* Week Calendar */}
            <div className="grid grid-cols-7 gap-2">
              {renderWeekCalendar()}
            </div>

            {/* Time Slots */}
            <div>
              <h3 className="font-medium mb-3">
                Available Times - {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              {renderTimeSlots()}
            </div>

            {/* Instant Booking Button */}
            {selectedSlot && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-purple-900">Ready to book?</p>
                    <p className="text-sm text-purple-700">
                      Slot selected for {selectedDate.toLocaleDateString()}
                    </p>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Book Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * QUICK AVAILABILITY INDICATOR
 * Shows instant availability status without full calendar
 */
export function QuickAvailabilityIndicator({ helperId }: { helperId: string }) {
  const [status, setStatus] = useState<'available_now' | 'available_today' | 'scheduled_only' | 'loading'>('loading')

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const response = await fetch(`/api/helpers/${helperId}/quick-availability`)
        const data = await response.json()
        setStatus(data.status)
      } catch (error) {
        console.error('Failed to check availability:', error)
      }
    }

    checkAvailability()
  }, [helperId])

  if (status === 'loading') {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-gray-600">
        <Loader className="h-4 w-4 animate-spin" />
        <span>Checking availability...</span>
      </div>
    )
  }

  const statusConfig = {
    available_now: {
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: <CheckCircle className="h-4 w-4" />,
      text: 'Available Now',
    },
    available_today: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: <Clock className="h-4 w-4" />,
      text: 'Available Today',
    },
    scheduled_only: {
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: <Calendar className="h-4 w-4" />,
      text: 'By Appointment',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 text-sm font-medium ${config.color}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  )
}

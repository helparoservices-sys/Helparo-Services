/**
 * SOCIAL PROOF & GROWTH ACCELERATORS
 * Real-time social proof indicators that drive bookings
 * Based on Booking.com/Airbnb conversion optimization techniques
 */

'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, Clock, Star, Award, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * LIVE BOOKING ACTIVITY
 * Shows recent bookings to create urgency (FOMO)
 */
export function LiveBookingActivity() {
  const [recentBookings, setRecentBookings] = useState<Array<{
    service: string
    location: string
    timeAgo: string
  }>>([])

  useEffect(() => {
    // Fetch recent bookings (last 24 hours)
    fetchRecentBookings()

    // ✅ EGRESS FIX: Removed 30-second polling
    // Social proof updates once per page load only
  }, [])

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch('/api/analytics/recent-bookings')
      const data = await response.json()
      setRecentBookings(data.slice(0, 5))
    } catch (error) {
      console.error('Failed to fetch recent bookings:', error)
    }
  }

  if (recentBookings.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-green-900">Recent Bookings in Your Area</h3>
      </div>
      
      <div className="space-y-2">
        {recentBookings.map((booking, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-gray-700">
              <span className="font-medium">{booking.service}</span> booked in{' '}
              <span className="font-medium">{booking.location}</span>
              <span className="text-gray-500 ml-2">{booking.timeAgo}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * HELPER POPULARITY BADGE
 * "5 people viewing this helper"
 */
export function HelperPopularityBadge({ helperId }: { helperId: string }) {
  const [viewerCount, setViewerCount] = useState(0)

  useEffect(() => {
    // Track page view
    trackHelperView(helperId)

    // Get current viewer count
    const fetchViewers = async () => {
      try {
        const response = await fetch(`/api/analytics/helper-viewers?helper_id=${helperId}`)
        const data = await response.json()
        setViewerCount(data.viewer_count)
      } catch (error) {
        console.error('Failed to fetch viewer count:', error)
      }
    }

    fetchViewers()
    
    // ✅ EGRESS FIX: Removed 10-second polling
    // Viewer count updates once per page load only
  }, [helperId])

  if (viewerCount < 2) return null // Don't show if only 1 person

  return (
    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-900 px-3 py-1 rounded-full text-sm font-medium">
      <Users className="h-4 w-4" />
      <span>{viewerCount} people viewing this helper right now</span>
    </div>
  )
}

/**
 * SCARCITY INDICATOR
 * "Only 2 slots left today"
 */
export function ScarcityIndicator({ helperId, date }: { helperId: string; date: Date }) {
  const [slotsLeft, setSlotsLeft] = useState<number | null>(null)

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await fetch(
          `/api/helpers/availability?helper_id=${helperId}&date=${date.toISOString()}`
        )
        const data = await response.json()
        setSlotsLeft(data.slots_available)
      } catch (error) {
        console.error('Failed to fetch availability:', error)
      }
    }

    fetchAvailability()
  }, [helperId, date])

  if (slotsLeft === null || slotsLeft > 5) return null

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-red-600" />
        <p className="text-red-900 font-medium">
          {slotsLeft === 0 ? (
            'Fully booked today'
          ) : slotsLeft === 1 ? (
            'Last slot available today!'
          ) : (
            `Only ${slotsLeft} slots left today`
          )}
        </p>
      </div>
    </div>
  )
}

/**
 * HIGH DEMAND BADGE
 * Shows when service/helper is trending
 */
export function HighDemandBadge({ serviceType }: { serviceType: string }) {
  const [isHighDemand, setIsHighDemand] = useState(false)

  useEffect(() => {
    const checkDemand = async () => {
      try {
        const response = await fetch(`/api/analytics/demand?service=${serviceType}`)
        const data = await response.json()
        setIsHighDemand(data.is_high_demand)
      } catch (error) {
        console.error('Failed to check demand:', error)
      }
    }

    checkDemand()
  }, [serviceType])

  if (!isHighDemand) return null

  return (
    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
      <Zap className="h-3 w-3 mr-1" />
      High Demand
    </Badge>
  )
}

/**
 * TRUST SIGNALS
 * Quick stats that build confidence
 */
export function TrustSignals({ helperId }: { helperId: string }) {
  const [stats, setStats] = useState<{
    response_rate: number
    completion_rate: number
    repeat_customers: number
  } | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/helpers/${helperId}/trust-stats`)
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch trust stats:', error)
      }
    }

    fetchStats()
  }, [helperId])

  if (!stats) return null

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.response_rate}%</div>
        <div className="text-xs text-gray-600 mt-1">Response Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.completion_rate}%</div>
        <div className="text-xs text-gray-600 mt-1">Completion Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.repeat_customers}%</div>
        <div className="text-xs text-gray-600 mt-1">Repeat Customers</div>
      </div>
    </div>
  )
}

/**
 * HELPER ACHIEVEMENTS
 * Badges that showcase excellence
 */
export function HelperAchievements({ achievements }: { achievements: string[] }) {
  const achievementConfig: Record<string, { icon: any; label: string; color: string }> = {
    top_rated: {
      icon: Star,
      label: 'Top Rated',
      color: 'bg-yellow-100 text-yellow-800',
    },
    fast_responder: {
      icon: Zap,
      label: 'Fast Responder',
      color: 'bg-blue-100 text-blue-800',
    },
    pro: {
      icon: Award,
      label: 'Pro Helper',
      color: 'bg-purple-100 text-purple-800',
    },
    verified: {
      icon: Award,
      label: 'Verified',
      color: 'bg-green-100 text-green-800',
    },
  }

  return (
    <div className="flex flex-wrap gap-2">
      {achievements.map((achievement) => {
        const config = achievementConfig[achievement]
        if (!config) return null

        const Icon = config.icon
        return (
          <Badge key={achievement} className={config.color}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        )
      })}
    </div>
  )
}

/**
 * PRICE COMPARISON BADGE
 * "15% below average price"
 */
export function PriceComparisonBadge({
  price,
  serviceType,
  location,
}: {
  price: number
  serviceType: string
  location: string
}) {
  const [comparison, setComparison] = useState<{
    average_price: number
    percentage_difference: number
  } | null>(null)

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(
          `/api/analytics/price-comparison?service=${serviceType}&location=${location}`
        )
        const data = await response.json()
        setComparison(data)
      } catch (error) {
        console.error('Failed to fetch price comparison:', error)
      }
    }

    fetchComparison()
  }, [serviceType, location])

  if (!comparison || comparison.percentage_difference > -5) return null // Only show if 5%+ cheaper

  return (
    <div className="inline-flex items-center gap-2 bg-green-100 text-green-900 px-3 py-1 rounded-full text-sm font-medium">
      <TrendingUp className="h-4 w-4 rotate-180" />
      <span>{Math.abs(comparison.percentage_difference)}% below average price</span>
    </div>
  )
}

/**
 * INSTANT BOOK BADGE
 * Encourages immediate booking
 */
export function InstantBookBadge() {
  return (
    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
      <Zap className="h-3 w-3 mr-1" />
      Instant Book Available
    </Badge>
  )
}

// Helper function to track helper views (for analytics)
async function trackHelperView(helperId: string) {
  try {
    await fetch('/api/analytics/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        helper_id: helperId,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    console.error('Failed to track view:', error)
  }
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { TrustScoreIndicator, VerifiedHelperBadge } from '@/components/trust-badges'

interface MatchedHelper {
  helper_id: string
  match_score: number
  helper: {
    id: string
    full_name: string
    email: string
    phone: string
    avatar_url: string | null
    rating: number
    total_bookings: number
  }
  matching_factors: {
    specialization_match: boolean
    location_proximity: number
    availability_match: boolean
    rating_bonus: number
    experience_bonus: number
  }
}

export default function CustomerFindHelpersPage() {
  const [loading, setLoading] = useState(false)
  const [helpers, setHelpers] = useState<MatchedHelper[]>([])
  const [error, setError] = useState('')
  
  // Search filters
  const [serviceCategory, setServiceCategory] = useState('')
  const [location, setLocation] = useState('')
  const [maxDistance, setMaxDistance] = useState('10')
  const [minRating, setMinRating] = useState('4.0')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!serviceCategory) {
      setError('Please select a service category')
      return
    }

    setLoading(true)
    setError('')

    // For now, showing message that search functionality needs service request ID
    // In production, this would create a service request first, then call findBestMatchingHelpers
    setError('Search functionality requires creating a service request first. Please use the "New Booking" page to find and book helpers.')
    setHelpers([])
    setLoading(false)
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-300'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-300'
    return 'text-gray-600 bg-gray-50 border-gray-300'
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-500' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Find the Perfect Helper</h1>
          <p className="text-muted-foreground">Smart matching based on skills, location, and ratings</p>
        </div>

        {error && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-800">{error}</p>
            <Link href="/customer/bookings/new">
              <Button className="mt-3" size="sm">
                → Go to New Booking
              </Button>
            </Link>
          </div>
        )}

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Search Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Category *</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a service...</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical Work</option>
                    <option value="cleaning">House Cleaning</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="painting">Painting</option>
                    <option value="appliance_repair">Appliance Repair</option>
                    <option value="gardening">Gardening</option>
                    <option value="pest_control">Pest Control</option>
                    <option value="moving">Moving & Packing</option>
                    <option value="beauty">Beauty Services</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Location</label>
                  <Input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your area/pincode"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Maximum Distance (km)</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Rating</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                  >
                    <option value="0">Any Rating</option>
                    <option value="3.0">3.0+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>🔍 Find Helpers</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : helpers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm text-muted-foreground">
                  {serviceCategory ? 'No helpers found matching your criteria. Try adjusting your filters.' : 'Select a service category to find helpers'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {helpers.length} Helper{helpers.length !== 1 ? 's' : ''} Found
              </h2>
              <div className="text-sm text-muted-foreground">
                Sorted by match score
              </div>
            </div>

            <div className="space-y-4">
              {helpers.map((match, index) => (
                <Card key={match.helper_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl relative">
                          {match.helper.avatar_url ? (
                            <img src={match.helper.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            match.helper.full_name?.charAt(0).toUpperCase() || 'H'
                          )}
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                              #1
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{match.helper.full_name}</h3>
                            <div className="flex items-center gap-1 text-sm mt-1">
                              {renderStars(match.helper.rating)}
                              <span className="ml-1 font-medium">{match.helper.rating.toFixed(1)}</span>
                              <span className="text-muted-foreground">({match.helper.total_bookings} jobs)</span>
                            </div>
                          </div>

                          <div className={`px-3 py-2 rounded-lg border-2 ${getMatchScoreColor(match.match_score)}`}>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{match.match_score}</div>
                              <div className="text-xs">Match</div>
                            </div>
                          </div>
                        </div>

                        {/* Matching Factors */}
                        <div className="flex flex-wrap gap-2">
                          {match.matching_factors.specialization_match && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                              ✓ Specialized
                            </span>
                          )}
                          {match.matching_factors.location_proximity <= 5 && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              📍 Nearby ({match.matching_factors.location_proximity}km)
                            </span>
                          )}
                          {match.matching_factors.availability_match && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              ⏰ Available Now
                            </span>
                          )}
                          {match.matching_factors.rating_bonus > 0 && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                              ⭐ Top Rated
                            </span>
                          )}
                          {match.matching_factors.experience_bonus > 0 && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                              💼 Experienced
                            </span>
                          )}
                        </div>

                        {/* Contact */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>📧 {match.helper.email}</span>
                          {match.helper.phone && <span>• 📱 {match.helper.phone}</span>}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t">
                          <Link href={`/customer/booking/new?helper=${match.helper_id}&service=${serviceCategory}`} className="flex-1">
                            <Button className="w-full">
                              📅 Book Now
                            </Button>
                          </Link>
                          <Link href={`/customer/helper/${match.helper_id}/trust`}>
                            <Button variant="outline">
                              🔒 Trust Score
                            </Button>
                          </Link>
                          <Link href={`/helper/${match.helper_id}/profile`}>
                            <Button variant="outline">
                              👤 View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>How Smart Matching Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium mb-2">🎯 Skill Matching</div>
                <p className="text-muted-foreground">
                  We match helpers with verified specializations in your requested service
                </p>
              </div>
              <div>
                <div className="font-medium mb-2">📍 Location Proximity</div>
                <p className="text-muted-foreground">
                  Helpers closer to you rank higher for faster service delivery
                </p>
              </div>
              <div>
                <div className="font-medium mb-2">⭐ Quality Ratings</div>
                <p className="text-muted-foreground">
                  Highly rated and experienced helpers get priority placement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

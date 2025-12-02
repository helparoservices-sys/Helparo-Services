'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { TrustScoreIndicator, VerifiedHelperBadge } from '@/components/trust-badges'
import { searchHelpersByFilters } from '@/app/actions/matching'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Star, Clock, Award, Phone, Mail } from 'lucide-react'

interface MatchedHelper {
  helper_id: string
  match_score: number
  helper: {
    id: string
    full_name: string
    email: string
    phone: string
    avatar_url: string | null
    hourly_rate: number
    years_of_experience: number
    skills: string[]
    address: string
    service_areas: string[]
    rating: number
    total_bookings: number
    response_rate: number
    completion_rate: number
  }
  matching_factors: {
    specialization_match: boolean
    location_proximity: number
    availability_match: boolean
    rating_bonus: number
    experience_bonus: number
    emergency_available: boolean
  }
}

export default function CustomerFindHelpersPage() {
  const [loading, setLoading] = useState(false)
  const [helpers, setHelpers] = useState<MatchedHelper[]>([])
  const [error, setError] = useState('')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  
  // Search filters
  const [serviceCategory, setServiceCategory] = useState('')
  const [location, setLocation] = useState('')
  const [maxDistance, setMaxDistance] = useState('50')
  const [minRating, setMinRating] = useState('0')

  // Get user's location on mount
  useEffect(() => {
    getUserLocation()
  }, [])

  const getUserLocation = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('location_lat, location_lng')
        .eq('id', user.id)
        .single()
      
      if (profile?.location_lat && profile?.location_lng) {
        setUserLocation({ lat: profile.location_lat, lng: profile.location_lng })
      }
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!serviceCategory) {
      setError('Please select a service category')
      return
    }

    setLoading(true)
    setError('')
    setHelpers([])

    try {
      console.log('🔍 Search Parameters:', {
        serviceCategory,
        customerLat: userLocation?.lat,
        customerLng: userLocation?.lng,
        maxDistance: parseInt(maxDistance),
        minRating: parseFloat(minRating),
      })

      const result = await searchHelpersByFilters({
        serviceCategory,
        customerLat: userLocation?.lat,
        customerLng: userLocation?.lng,
        maxDistance: parseInt(maxDistance),
        minRating: parseFloat(minRating),
        limit: 20
      })

      console.log('📊 Search Result:', result)

      if ('error' in result) {
        setError(result.error || 'Failed to search helpers')
      } else if (result.helpers) {
        console.log('✅ Helpers found:', result.helpers.length)
        if (result.helpers.length > 0) {
          console.log('First helper avatar:', {
            name: result.helpers[0].helper?.full_name,
            avatar_url: result.helpers[0].helper?.avatar_url,
            has_avatar: !!result.helpers[0].helper?.avatar_url
          })
        }
        setHelpers(result.helpers as MatchedHelper[])
        if (result.helpers.length === 0) {
          setError('No helpers found matching your criteria. Try increasing the distance or selecting a different service.')
        }
      }
    } catch (err: any) {
      console.error('❌ Search Error:', err)
      setError(err.message || 'An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
    return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700'
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-500' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Find the Perfect Helper
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Smart matching based on skills, location, and ratings
          </p>
        </div>

        {/* Search Form */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Service Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a service...</option>
                    <option value="plumbing">🔧 Plumbing</option>
                    <option value="electrical">⚡ Electrical Work</option>
                    <option value="house-cleaning">🧹 House Cleaning</option>
                    <option value="carpentry">🔨 Carpentry</option>
                    <option value="painting">🎨 Painting</option>
                    <option value="ac-repair">❄️ AC Repair & Service</option>
                    <option value="appliance-repair">🔌 Appliance Repair</option>
                    <option value="pest-control">🐛 Pest Control</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Maximum Distance (km)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(e.target.value)}
                    className="bg-white dark:bg-slate-800"
                  />
                  <p className="text-xs text-slate-500">
                    {userLocation ? '📍 Using your saved location' : '⚠️ Add location in settings for better matches'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Minimum Rating
                  </label>
                  <select
                    className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                  >
                    <option value="0">⭐ Any Rating</option>
                    <option value="3.0">⭐⭐⭐ 3.0+ Stars</option>
                    <option value="4.0">⭐⭐⭐⭐ 4.0+ Stars</option>
                    <option value="4.5">⭐⭐⭐⭐⭐ 4.5+ Stars</option>
                  </select>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Searching...</span>
                  </>
                ) : (
                  <>🔍 Find Helpers</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : helpers.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {serviceCategory ? 'Use the search form above to find helpers in your area' : 'Select a service category and click "Find Helpers" to get started'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                {helpers.length} Helper{helpers.length !== 1 ? 's' : ''} Found
              </h2>
              <div className="text-sm text-slate-500">
                Sorted by match score
              </div>
            </div>

            <div className="space-y-4">
              {helpers.map((match, index) => (
                <Card key={match.helper_id} className="hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden">
                          {match.helper.avatar_url ? (
                            <img 
                              src={match.helper.avatar_url} 
                              alt={match.helper.full_name || 'Helper'}
                              className="w-full h-full object-cover" 
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error('❌ Avatar load failed:', match.helper.avatar_url)
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : null}
                          {!match.helper.avatar_url && (
                            <span className="text-2xl">{match.helper.full_name?.charAt(0).toUpperCase() || 'H'}</span>
                          )}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 bg-yellow-400 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-md z-10">
                            #1
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">{match.helper.full_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {match.helper.total_bookings > 0 ? (
                                <>
                                  <div className="flex items-center gap-1 text-sm">
                                    {renderStars(match.helper.rating)}
                                    <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">
                                      {match.helper.rating.toFixed(1)}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    ({match.helper.total_bookings} jobs)
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                  ✨ New Helper - No reviews yet
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Match Score Badge */}
                          <div className={`px-4 py-2 rounded-full border-2 text-sm font-bold ${getMatchScoreColor(match.match_score)}`}>
                            {Math.round(match.match_score)}% Match
                          </div>
                        </div>

                        {/* Skills & Experience */}
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Award className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">{match.helper.years_of_experience} years experience</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>{match.matching_factors.location_proximity.toFixed(1)} km away</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span>{match.helper.response_rate}% response rate</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span>{match.helper.total_bookings > 0 ? `${match.helper.completion_rate}% completion` : 'Not rated yet'}</span>
                          </div>
                        </div>

                        {/* Skills Tags */}
                        {match.helper.skills && match.helper.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {match.helper.skills.slice(0, 6).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {match.helper.skills.length > 6 && (
                              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full">
                                +{match.helper.skills.length - 6} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Matching Factors */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          {match.matching_factors.specialization_match && (
                            <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                              ✓ Specialized in this service
                            </span>
                          )}
                          {match.matching_factors.emergency_available && (
                            <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                              🚨 Emergency Available
                            </span>
                          )}
                          {match.matching_factors.availability_match && (
                            <span className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                              ✓ Available Now
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                          <Link href={`/customer/helper/${match.helper_id}`} className="flex-1">
                            <Button variant="outline" className="w-full border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              View Profile
                            </Button>
                          </Link>
                          <Link href={`/customer/requests/new?helperId=${match.helper_id}&service=${serviceCategory}`} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md">
                              Book Now
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
      </div>
    </div>
  )
}

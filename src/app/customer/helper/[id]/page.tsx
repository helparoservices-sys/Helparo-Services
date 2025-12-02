'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { createClient } from '@/lib/supabase/client'
import { 
  MapPin, 
  Star, 
  Award, 
  Calendar,
  CheckCircle,
  Shield,
  Briefcase,
  MessageCircle
} from 'lucide-react'

interface HelperProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  avatar_url: string | null
  bio: string | null
  hourly_rate: number
  years_of_experience: number
  skills: string[]
  service_categories: string[]
  address: string
  service_areas: string[]
  rating: number
  total_bookings: number
  response_rate: number
  completion_rate: number
  is_approved: boolean
  is_available_now: boolean
  emergency_availability: boolean
  created_at: string
  profiles?: {
    full_name: string
    email: string
    phone: string
    avatar_url: string | null
  }
}

export default function HelperProfilePage() {
  const params = useParams()
  const router = useRouter()
  const helperId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [helper, setHelper] = useState<HelperProfile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHelperProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helperId])

  const loadHelperProfile = async () => {
    setLoading(true)
    setError('')
    
    try {
      console.log('🔍 Loading helper profile with ID:', helperId)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('helper_profiles')
        .select(`
          *,
          profiles!helper_profiles_user_id_fkey (
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('id', helperId)
        .single()

      console.log('📊 Helper profile query result:', { data, error })

      if (error) throw error
      
      if (!data) {
        setError('Helper not found')
        return
      }

      // Flatten the profiles data into the helper object
      const helperData = {
        ...data,
        full_name: data.profiles?.full_name || 'Unknown',
        email: data.profiles?.email || '',
        phone: data.profiles?.phone || '',
        avatar_url: data.profiles?.avatar_url || null,
        // Map database column names to display names
        total_bookings: data.total_jobs_completed || 0,
        response_rate: data.response_rate_percent || 100,
        completion_rate: data.completion_rate_percent || 100,
        rating: data.rating_count > 0 ? data.rating_sum / data.rating_count : 0,
      }

      console.log('✅ Helper data flattened:', {
        id: helperData.id,
        full_name: helperData.full_name,
        avatar_url: helperData.avatar_url,
        total_bookings: helperData.total_bookings,
        response_rate: helperData.response_rate,
        completion_rate: helperData.completion_rate,
        profiles_exists: !!data.profiles
      })

      setHelper(helperData)
    } catch (err) {
      console.error('❌ Error loading helper profile:', err)
      setError('Failed to load helper profile')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-slate-300 dark:text-slate-600'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !helper) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-3">😕</div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {error || 'Helper not found'}
              </p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button onClick={() => router.back()} variant="outline" size="sm">
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Helper Profile</h1>
      </div>

      {/* Main Profile Card */}
      <Card className="border-2 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg overflow-hidden">
                {helper.avatar_url ? (
                  <img 
                    src={helper.avatar_url} 
                    alt={helper.full_name || 'Helper'}
                    className="w-full h-full object-cover" 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('❌ Avatar failed to load:', helper.avatar_url)
                      const target = e.currentTarget
                      target.style.display = 'none'
                    }}
                  />
                ) : null}
                {(!helper.avatar_url || helper.avatar_url === null) && (
                  <span className="text-5xl">{helper.full_name?.charAt(0).toUpperCase() || 'H'}</span>
                )}
              </div>
              {helper.is_approved && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {helper.full_name}
                  </h2>
                  {helper.is_approved && (
                    <span className="flex items-center gap-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-medium">
                      <Shield className="h-4 w-4" />
                      Verified
                    </span>
                  )}
                  {helper.is_available_now && (
                    <span className="flex items-center gap-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Available Now
                    </span>
                  )}
                  {helper.emergency_availability && (
                    <span className="flex items-center gap-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full font-medium">
                      🚨 Emergency
                    </span>
                  )}
                </div>

                {/* Rating */}
                {helper.total_bookings > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {renderStars(helper.rating)}
                      <span className="ml-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
                        {helper.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      ({helper.total_bookings} completed jobs)
                    </span>
                  </div>
                ) : (
                  <p className="text-blue-600 dark:text-blue-400 font-medium">
                    ✨ New Helper - No reviews yet
                  </p>
                )}
              </div>

              {/* Bio */}
              {helper.bio && (
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {helper.bio}
                </p>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {helper.total_bookings || 0}
                  </div>
                  <div className="text-xs text-slate-500">Jobs Done</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {helper.years_of_experience}
                  </div>
                  <div className="text-xs text-slate-500">Years Exp</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {helper.response_rate}%
                  </div>
                  <div className="text-xs text-slate-500">Response Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {helper.total_bookings > 0 ? `${helper.completion_rate}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500">Completion</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Categories */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
            Services Offered
          </h3>
          <div className="flex flex-wrap gap-2">
            {helper.service_categories.map((category, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-lg"
              >
                {category}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      {helper.skills && helper.skills.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Skills & Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {helper.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location & Service Areas */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Service Areas
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
              <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">Base Location</p>
                <p className="text-sm">{helper.address}</p>
              </div>
            </div>
            {helper.service_areas && helper.service_areas.length > 0 && (
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100 mb-2">Covers these areas:</p>
                <div className="flex flex-wrap gap-2">
                  {helper.service_areas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Booking Actions */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Ready to Book?
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/customer/requests/new?helperId=${helper.id}`} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" size="lg">
                <Calendar className="h-5 w-5 mr-2" />
                Book This Helper
              </Button>
            </Link>
            <Button variant="outline" className="flex-1 border-2" size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Send Message
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Member since {new Date(helper.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

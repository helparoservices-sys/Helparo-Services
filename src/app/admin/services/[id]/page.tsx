'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Package, IndianRupee, Clock, Star, 
  Edit, Trash2, Eye, EyeOff, TrendingUp, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/admin/PageLoader'
import { supabase } from '@/lib/supabase/client'

interface Service {
  id: string
  name: string
  parent_category: string
  description: string
  slug: string
  is_active: boolean
  icon: string | null
  base_price: number
  price_type: string
  unit_name: string | null
  requires_location: boolean
  supports_emergency: boolean
  display_order: number
  rating: number
  total_bookings: number
  revenue: number
  created_at: string
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchServiceDetails = useCallback(async () => {
    let mounted = true

    try {
      setLoading(true)
      setError('')

      // Parallel queries for better performance
      const [serviceResult, bookingsResult, reviewsResult] = await Promise.all([
        // Fetch service details with parent category
        supabase
          .from('service_categories')
          .select(`
            id,
            name,
            slug,
            description,
            is_active,
            icon,
            base_price,
            price_type,
            unit_name,
            requires_location,
            supports_emergency,
            display_order,
            created_at,
            parent:service_categories!parent_id(name)
          `)
          .eq('id', params.id)
          .single(),
        
        // Fetch service bookings stats
        supabase
          .from('service_requests')
          .select('id, final_price, estimated_price, status')
          .eq('category_id', params.id),
        
        // Fetch service ratings from reviews
        supabase
          .from('reviews')
          .select('rating')
          .eq('service_request_id', params.id)
      ])

      if (!mounted) return

      if (serviceResult.error) {
        setError('Service not found')
        setLoading(false)
        return
      }

      const totalBookings = bookingsResult.data?.length || 0
      const revenue = bookingsResult.data?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.final_price || b.estimated_price || 0), 0) || 0

      const avgRating = reviewsResult.data && reviewsResult.data.length > 0
        ? Math.round((reviewsResult.data.reduce((sum, r) => sum + r.rating, 0) / reviewsResult.data.length) * 10) / 10
        : 0

      if (mounted) {
        setService({
          id: serviceResult.data.id,
          name: serviceResult.data.name || 'N/A',
          parent_category: (serviceResult.data.parent as any)?.name || 'Root Category',
          description: serviceResult.data.description || '',
          slug: serviceResult.data.slug || '',
          is_active: serviceResult.data.is_active ?? true,
          icon: serviceResult.data.icon,
          base_price: serviceResult.data.base_price || 0,
          price_type: serviceResult.data.price_type || 'fixed',
          unit_name: serviceResult.data.unit_name,
          requires_location: serviceResult.data.requires_location ?? true,
          supports_emergency: serviceResult.data.supports_emergency ?? false,
          display_order: serviceResult.data.display_order || 0,
          rating: avgRating,
          total_bookings: totalBookings,
          revenue: revenue,
          created_at: serviceResult.data.created_at,
        })
      }
    } catch (err) {
      if (mounted) {
        console.error('Error fetching service:', err)
        setError('Failed to load service details')
      }
    } finally {
      if (mounted) {
        setLoading(false)
      }
    }

    return () => { mounted = false }
  }, [params.id])

  useEffect(() => {
    fetchServiceDetails()
  }, [fetchServiceDetails])

  const toggleServiceStatus = async () => {
    if (!service) return
    
    const newStatus = !service.is_active
    
    // Optimistic update
    setService(prev => prev ? { ...prev, is_active: newStatus } : null)
    
    const { error } = await supabase
      .from('service_categories')
      .update({ is_active: newStatus })
      .eq('id', params.id)
    
    if (error) {
      console.error('Error updating service status:', error)
      setError('Failed to update status')
      // Revert on error
      setService(prev => prev ? { ...prev, is_active: !newStatus } : null)
    }
  }

  // Memoize status badge
  const statusBadge = useMemo(() => (
    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
      service?.is_active
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }`}>
      {service?.is_active ? 'ACTIVE' : 'INACTIVE'}
    </span>
  ), [service?.is_active])

  if (loading) return <PageLoader text="Loading service details..." />

  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {error || 'Service Not Found'}
          </h2>
          <Button onClick={() => router.push('/admin/services')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/services')}
            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={toggleServiceStatus}
              className={service.is_active 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }
            >
              {service.is_active ? (
                <><Eye className="mr-2 h-4 w-4" /> Active</>
              ) : (
                <><EyeOff className="mr-2 h-4 w-4" /> Inactive</>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/admin/services/${params.id}/edit`)}
              className="bg-white/50 dark:bg-slate-800/50"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Service
            </Button>
          </div>
        </div>

        {/* Service Details Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="h-48 w-48 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-8xl">
              {service.icon === 'Wrench' ? '🔧' : 
               service.icon === 'Zap' ? '⚡' : 
               service.icon === 'Car' ? '🚗' : 
               service.icon === 'Sparkles' ? '✨' : 
               service.icon === 'DoorOpen' ? '🚪' : '📦'}
            </div>
          </div>            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {service.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {service.parent_category}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                      {service.slug}
                    </span>
                  </div>
                </div>
                {statusBadge}
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {service.description}
              </p>

              {/* Pricing Info */}
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <span className="font-bold text-xl text-green-700 dark:text-green-400">₹{service.base_price}</span>
                  {service.price_type !== 'custom' && service.unit_name && (
                    <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">/ {service.unit_name}</span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({service.price_type})</span>
                </div>
              </div>

              {/* Service Features */}
              <div className="flex gap-2 mb-6">
                {service.requires_location && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    📍 Location Required
                  </span>
                )}
                {service.supports_emergency && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    🚨 Emergency Support
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Average Rating</p>
                    <p className="font-bold text-slate-900 dark:text-white">{service.rating}/5.0</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Created</p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {new Date(service.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Bookings</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{service.total_bookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{service.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <IndianRupee className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg. per Booking</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{service.total_bookings > 0 
                    ? Math.round(service.revenue / service.total_bookings).toLocaleString()
                    : '0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Bookings</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Recent bookings for this service will appear here</p>
        </div>
      </div>
    </div>
  )
}

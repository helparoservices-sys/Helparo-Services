'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Package, DollarSign, Clock, Star, 
  Edit, Trash2, Eye, EyeOff, TrendingUp, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/admin/PageLoader'
import { supabase } from '@/lib/supabase/client'

interface Service {
  id: string
  name: string
  category: string
  description: string
  price: number
  duration: number
  status: 'active' | 'inactive'
  rating: number
  total_bookings: number
  revenue: number
  created_at: string
  image_url?: string
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServiceDetails()
  }, [params.id])

  const fetchServiceDetails = async () => {
    try {
      // Fetch service details
      const { data: service, error: serviceError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('id', params.id)
        .single()

      if (serviceError) throw serviceError

      // Fetch service bookings stats
      const { data: bookings } = await supabase
        .from('service_requests')
        .select('id, final_price, estimated_price, status')
        .eq('category_id', params.id)

      const totalBookings = bookings?.length || 0
      const revenue = bookings?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.final_price || b.estimated_price || 0), 0) || 0

      // Fetch service rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('category_id', params.id)

      const avgRating = reviews && reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0

      setService({
        id: service.id,
        name: service.name || 'N/A',
        category: service.category?.name || 'N/A',
        description: service.description || '',
        price: service.price || 0,
        duration: service.duration || 0,
        status: service.status || 'active',
        rating: avgRating,
        total_bookings: totalBookings,
        revenue: revenue,
        created_at: service.created_at,
        image_url: service.image_url
      })
    } catch (error) {
      console.error('Error fetching service:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleServiceStatus = () => {
    if (!service) return
    
    const newStatus = service.status === 'active' ? 'inactive' : 'active'
    
    supabase
      .from('service_categories')
      .update({ is_active: newStatus === 'active' })
      .eq('id', params.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating service status:', error)
        } else {
          setService(prev => prev ? { ...prev, status: newStatus } : null)
        }
      })
  }

  if (loading) return <PageLoader text="Loading service details..." />

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Service Not Found</h2>
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
              className={service.status === 'active' 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }
            >
              {service.status === 'active' ? (
                <><Eye className="mr-2 h-4 w-4" /> Active</>
              ) : (
                <><EyeOff className="mr-2 h-4 w-4" /> Inactive</>
              )}
            </Button>
            <Button variant="outline" className="bg-white/50 dark:bg-slate-800/50">
              <Edit className="mr-2 h-4 w-4" />
              Edit Service
            </Button>
          </div>
        </div>

        {/* Service Details Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="h-48 w-48 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Package className="h-24 w-24 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {service.name}
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {service.category}
                  </span>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  service.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {service.status.toUpperCase()}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {service.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Price</p>
                    <p className="font-bold text-slate-900 dark:text-white">₹{service.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Duration</p>
                    <p className="font-bold text-slate-900 dark:text-white">{service.duration} mins</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Rating</p>
                    <p className="font-bold text-slate-900 dark:text-white">{service.rating}/5.0</p>
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
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg. per Booking</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{Math.round(service.revenue / service.total_bookings).toLocaleString()}
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

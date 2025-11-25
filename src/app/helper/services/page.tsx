'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperServices, updateHelperServices } from '@/app/actions/helper-services'
import { Briefcase, DollarSign, Check, Plus, X, Clock, Star, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon_emoji: string | null
}

interface HelperService {
  id: string
  category_id: string
  hourly_rate: number
  is_available: boolean
  experience_years: number
}

export default function HelperServicesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Record<string, HelperService | null>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const result = await getHelperServices()

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setCategories(result.data.categories)
      
      // Create services map
      const servicesMap: Record<string, HelperService | null> = {}
      result.data.categories.forEach(cat => {
        servicesMap[cat.id] = null
      })
      result.data.helperServices.forEach(service => {
        servicesMap[service.category_id] = service
      })
      setServices(servicesMap)
    }

    setLoading(false)
  }

  const toggleService = (categoryId: string) => {
    const current = services[categoryId]
    if (current) {
      setServices({ ...services, [categoryId]: null })
    } else {
      setServices({
        ...services,
        [categoryId]: {
          id: '',
          category_id: categoryId,
          hourly_rate: 500,
          is_available: true,
          experience_years: 1,
        },
      })
    }
  }

  const updateServiceField = (categoryId: string, field: keyof HelperService, value: any) => {
    const current = services[categoryId]
    if (!current) return
    setServices({
      ...services,
      [categoryId]: { ...current, [field]: value },
    })
  }

  const handleSave = async () => {
    setSaving(true)

    // Prepare services data
    const servicesToSave = Object.entries(services)
      .filter(([_, service]) => service !== null)
      .map(([categoryId, service]) => ({
        category_id: categoryId,
        hourly_rate: service!.hourly_rate,
        is_available: service!.is_available,
        experience_years: service!.experience_years,
      }))

    const result = await updateHelperServices(servicesToSave)

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Services updated successfully')
      loadData()
    }

    setSaving(false)
  }

  const getActiveServicesCount = () => {
    return Object.values(services).filter(s => s !== null && s.is_available).length
  }

  const getTotalEarningPotential = () => {
    return Object.values(services)
      .filter(s => s !== null)
      .reduce((sum, s) => sum + (s!.hourly_rate || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Services & Specializations
          </h1>
          <p className="text-gray-600 mt-1">Select services you offer and set your rates</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {getActiveServicesCount()}
                      </p>
                      <p className="text-sm text-gray-600">Active Services</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{getTotalEarningPotential()}
                      </p>
                      <p className="text-sm text-gray-600">Total Rate/Hour</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {categories.length}
                      </p>
                      <p className="text-sm text-gray-600">Available Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Services Grid */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Available Services</span>
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map(category => {
                    const service = services[category.id]
                    const isActive = service !== null

                    return (
                      <div
                        key={category.id}
                        className={`rounded-xl border-2 p-6 transition-all ${
                          isActive
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Category Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">
                              {category.icon_emoji || '🔧'}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {category.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {category.description || 'Service category'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={isActive ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => toggleService(category.id)}
                            className="gap-2"
                          >
                            {isActive ? (
                              <>
                                <X className="h-4 w-4" />
                                Remove
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Service Configuration */}
                        {isActive && service && (
                          <div className="space-y-4 pt-4 border-t border-green-200">
                            {/* Hourly Rate */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Hourly Rate
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">₹</span>
                                <input
                                  type="number"
                                  min={100}
                                  max={10000}
                                  step={50}
                                  value={service.hourly_rate}
                                  onChange={e =>
                                    updateServiceField(
                                      category.id,
                                      'hourly_rate',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <span className="text-sm text-gray-600">/hour</span>
                              </div>
                            </div>

                            {/* Experience Years */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Star className="h-4 w-4" />
                                Experience
                              </label>
                              <select
                                value={service.experience_years}
                                onChange={e =>
                                  updateServiceField(
                                    category.id,
                                    'experience_years',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                <option value={0}>Less than 1 year</option>
                                <option value={1}>1 year</option>
                                <option value={2}>2 years</option>
                                <option value={3}>3 years</option>
                                <option value={4}>4 years</option>
                                <option value={5}>5+ years</option>
                              </select>
                            </div>

                            {/* Availability Toggle */}
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  Currently Available
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  updateServiceField(
                                    category.id,
                                    'is_available',
                                    !service.is_available
                                  )
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  service.is_available
                                    ? 'bg-green-500'
                                    : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    service.is_available
                                      ? 'translate-x-6'
                                      : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {categories.length === 0 && (
                  <div className="text-center py-12">
                    <Briefcase className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium">No service categories available</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Contact support to add service categories
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

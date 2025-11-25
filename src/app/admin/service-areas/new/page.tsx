'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ServiceArea {
  parent_id: string | null
  level: 'state' | 'district' | 'city' | 'area'
  name: string
  slug: string
  latitude: string
  longitude: string
  pincode: string
  is_active: boolean
  display_order: number
}

export default function NewServiceAreaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parentAreas, setParentAreas] = useState<any[]>([])
  const [formData, setFormData] = useState<ServiceArea>({
    parent_id: null,
    level: 'state',
    name: '',
    slug: '',
    latitude: '',
    longitude: '',
    pincode: '',
    is_active: true,
    display_order: 0
  })

  useEffect(() => {
    loadParentAreas()
  }, [formData.level])

  const loadParentAreas = async () => {
    const supabase = createClient()
    
    // Determine parent level based on current level
    let parentLevel: string | null = null
    if (formData.level === 'district') parentLevel = 'state'
    if (formData.level === 'city') parentLevel = 'district'
    if (formData.level === 'area') parentLevel = 'city'

    if (!parentLevel) {
      setParentAreas([])
      return
    }

    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .eq('level', parentLevel)
      .eq('is_active', true)
      .order('name')

    if (!error) {
      setParentAreas(data || [])
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        })
        toast.success('Location detected!')
      },
      (error) => {
        toast.error('Failed to detect location')
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('service_areas')
      .insert({
        parent_id: formData.parent_id || null,
        level: formData.level,
        name: formData.name,
        slug: formData.slug,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        pincode: formData.pincode || null,
        is_active: formData.is_active,
        display_order: formData.display_order
      })

    if (error) {
      toast.error('Failed to create service area: ' + error.message)
      console.error(error)
    } else {
      toast.success('Service area created successfully!')
      router.push('/admin/service-areas')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Add Service Area</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Create a new service area in the hierarchy
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        {/* Level */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Level <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as any, parent_id: null })}
            required
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="state">State</option>
            <option value="district">District</option>
            <option value="city">City</option>
            <option value="area">Area</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Hierarchy: State → District → City → Area</p>
        </div>

        {/* Parent Selection */}
        {formData.level !== 'state' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Parent {formData.level === 'district' ? 'State' : formData.level === 'city' ? 'District' : 'City'} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.parent_id || ''}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select parent</option>
              {parentAreas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Name & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="e.g., Hyderabad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="hyderabad"
            />
          </div>
        </div>

        {/* Coordinates */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Coordinates (Optional)
            </label>
            <button
              type="button"
              onClick={detectLocation}
              className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              <MapPin className="h-4 w-4" />
              Detect Current Location
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="Latitude (e.g., 17.3850)"
            />
            <input
              type="text"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="Longitude (e.g., 78.4867)"
            />
          </div>
        </div>

        {/* Pincode */}
        {formData.level === 'area' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pincode (Optional)
            </label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="e.g., 500034"
            />
          </div>
        )}

        {/* Status & Display Order */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Active
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="0"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Service Area'}
          </button>
        </div>
      </form>
    </div>
  )
}

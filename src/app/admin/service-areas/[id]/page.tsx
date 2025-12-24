'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, MapPin, Save, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ServiceArea {
  id: string
  parent_id: string | null
  level: 'state' | 'district' | 'city' | 'area'
  name: string
  slug: string
  latitude: number | null
  longitude: number | null
  pincode: string | null
  is_active: boolean
  display_order: number
}

export default function EditServiceAreaPage() {
  const router = useRouter()
  const params = useParams()
  const areaId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [parentAreas, setParentAreas] = useState<any[]>([])
  const [formData, setFormData] = useState<ServiceArea | null>(null)

  useEffect(() => {
    loadArea()
  }, [areaId])

  useEffect(() => {
    if (formData) {
      loadParentAreas()
    }
  }, [formData?.level])

  const loadArea = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_areas')
      .select('id, name, slug, description, level, parent_id, is_active, display_order, latitude, longitude, radius_km, metadata')
      .eq('id', areaId)
      .single()

    if (error) {
      toast.error('Failed to load service area')
      console.error(error)
      router.push('/admin/service-areas')
    } else {
      setFormData(data)
    }
    setLoading(false)
  }

  const loadParentAreas = async () => {
    if (!formData) return

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
      .select('id, name, slug, level')
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
    if (!formData) return
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
        if (!formData) return
        setFormData({
          ...formData,
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6))
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
    if (!formData) return
    
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('service_areas')
      .update({
        parent_id: formData.parent_id || null,
        level: formData.level,
        name: formData.name,
        slug: formData.slug,
        latitude: formData.latitude,
        longitude: formData.longitude,
        pincode: formData.pincode || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', areaId)

    if (error) {
      toast.error('Failed to update service area: ' + error.message)
      console.error(error)
    } else {
      toast.success('Service area updated successfully!')
      router.push('/admin/service-areas')
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service area? All child areas will also be deleted.')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('service_areas')
      .delete()
      .eq('id', areaId)

    if (error) {
      toast.error('Failed to delete service area')
      console.error(error)
    } else {
      toast.success('Service area deleted successfully')
      router.push('/admin/service-areas')
    }
  }

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Service Area</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Update service area details
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        {/* Level (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Level
          </label>
          <input
            type="text"
            value={formData.level}
            disabled
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 dark:text-white"
          />
          <p className="text-xs text-slate-500 mt-1">Level cannot be changed after creation</p>
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
              value={formData.latitude || ''}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="Latitude (e.g., 17.3850)"
            />
            <input
              type="text"
              value={formData.longitude || ''}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
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
              value={formData.pincode || ''}
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
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

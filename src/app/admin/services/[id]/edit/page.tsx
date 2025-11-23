'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Package, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { updateServiceCategory } from '@/app/actions/services'
import { PageLoader } from '@/components/admin/PageLoader'

interface ParentCategory {
  id: string
  name: string
}

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([])
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    is_active: true,
    icon: '',
    base_price: '',
    price_type: 'fixed',
    unit_name: '',
    requires_location: true,
    supports_emergency: false,
    display_order: 0
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadData()
  }, [serviceId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load parent categories for dropdown
      const { data: parents } = await supabase
        .from('service_categories')
        .select('id, name')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      setParentCategories(parents || [])

      // Load current service data
      const { data: service, error: fetchError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('id', serviceId)
        .single()

      if (fetchError || !service) {
        setError('Service not found')
        setLoading(false)
        return
      }

      // Populate form with existing data
      setFormData({
        name: service.name || '',
        slug: service.slug || '',
        description: service.description || '',
        parent_id: service.parent_id || '',
        is_active: service.is_active ?? true,
        icon: service.icon || '',
        base_price: service.base_price?.toString() || '',
        price_type: service.price_type || 'fixed',
        unit_name: service.unit_name || '',
        requires_location: service.requires_location ?? true,
        supports_emergency: service.supports_emergency ?? false,
        display_order: service.display_order || 0
      })

      setLoading(false)
    } catch (err) {
      console.error('Error loading service:', err)
      setError('Failed to load service')
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      // Validate required fields
      if (!formData.name || !formData.slug || !formData.base_price) {
        setError('Please fill in all required fields')
        setSaving(false)
        return
      }

      const result = await updateServiceCategory(serviceId, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        is_active: formData.is_active,
        icon: formData.icon || null,
        base_price: parseFloat(formData.base_price),
        price_type: formData.price_type,
        unit_name: formData.unit_name || null,
        requires_location: formData.requires_location,
        supports_emergency: formData.supports_emergency,
        display_order: formData.display_order,
      })

      if (result.error) {
        setError(result.error)
        setSaving(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/admin/services/${serviceId}`)
      }, 1000)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to update service')
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoader text="Loading service details..." />
  }

  if (error && !formData.name) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{error}</h2>
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/services/${serviceId}`)}
            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Service</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Update service details</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">Service updated successfully! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Plumbing Services"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="plumbing-services"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the service..."
              />
            </div>

            {/* Categorization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Root Category</option>
                  {parentCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Icon Name
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Wrench, Zap, Car, Sparkles, DoorOpen"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Base Price * (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Price Type
                </label>
                <select
                  value={formData.price_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_type: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="fixed">Fixed</option>
                  <option value="per_hour">Per Hour</option>
                  <option value="per_unit">Per Unit</option>
                  <option value="per_sqft">Per Sqft</option>
                  <option value="per_room">Per Room</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Unit Name
                </label>
                <input
                  type="text"
                  value={formData.unit_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="job, hour, sqft, etc."
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, requires_location: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Requires Location</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.supports_emergency}
                  onChange={(e) => setFormData(prev => ({ ...prev, supports_emergency: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Supports Emergency</span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/services/${serviceId}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

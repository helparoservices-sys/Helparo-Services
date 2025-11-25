'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { Plus, Edit, Trash2, Package, CheckCircle, XCircle, ShoppingBag } from 'lucide-react'
import { getActiveServiceBundles, createServiceBundle, updateServiceBundle, deleteServiceBundle, toggleBundleStatus, addBundleServices, getBundleServices } from '@/app/actions/bundles'
import { getServiceCategoryTree } from '@/app/actions/services'
import { isErrorResult } from '@/lib/errors'
import { useToast } from '@/components/ui/toast-notification'

interface ServiceBundle {
  id: string
  name: string
  description: string
  bundle_type: 'combo' | 'package' | 'subscription' | 'seasonal'
  total_original_price: number
  bundle_price: number
  discount_percentage: number
  validity_days: number
  max_redemptions: number
  is_active: boolean
  icon_url?: string
  banner_url?: string
  terms_conditions?: string
  created_at: string
}

interface ServiceCategory {
  id: string
  name: string
  icon?: string
  children?: ServiceCategory[]
}

interface BundleService {
  categoryId: string
  quantity: number
  individualPrice: number
}

export default function AdminBundlesPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bundles, setBundles] = useState<ServiceBundle[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBundle, setEditingBundle] = useState<ServiceBundle | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [bundleType, setBundleType] = useState<'combo' | 'package' | 'subscription' | 'seasonal'>('package')
  const [totalOriginalPrice, setTotalOriginalPrice] = useState('')
  const [bundlePrice, setBundlePrice] = useState('')
  const [validityDays, setValidityDays] = useState('30')
  const [maxRedemptions, setMaxRedemptions] = useState('1')
  const [iconUrl, setIconUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [termsConditions, setTermsConditions] = useState('')
  
  // Service selection state
  const [selectedServices, setSelectedServices] = useState<BundleService[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    // Load bundles and categories in parallel
    const [bundlesResult, categoriesResult] = await Promise.all([
      getActiveServiceBundles(),
      getServiceCategoryTree(true)
    ])

    if (isErrorResult(bundlesResult)) {
      setError(bundlesResult.error)
      showToast({ type: 'error', message: bundlesResult.error })
    } else if ('bundles' in bundlesResult) {
      setBundles(bundlesResult.bundles || [])
    }

    if ('categories' in categoriesResult) {
      // Flatten categories for easier selection
      const flatCategories = flattenCategories(categoriesResult.categories || [])
      setCategories(flatCategories)
    } else if ('error' in categoriesResult) {
      showToast({ type: 'error', message: 'Failed to load service categories' })
    }

    setLoading(false)
  }

  const flattenCategories = (cats: ServiceCategory[]): ServiceCategory[] => {
    const result: ServiceCategory[] = []
    for (const cat of cats) {
      result.push(cat)
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children))
      }
    }
    return result
  }

  const handleEdit = async (bundle: ServiceBundle) => {
    setEditingBundle(bundle)
    setName(bundle.name)
    setDescription(bundle.description)
    setBundleType(bundle.bundle_type)
    setTotalOriginalPrice(bundle.total_original_price.toString())
    setBundlePrice(bundle.bundle_price.toString())
    setValidityDays(bundle.validity_days.toString())
    setMaxRedemptions(bundle.max_redemptions.toString())
    setIconUrl(bundle.icon_url || '')
    setBannerUrl(bundle.banner_url || '')
    setTermsConditions(bundle.terms_conditions || '')
    
    // Load existing bundle services
    const servicesResult = await getBundleServices(bundle.id)
    if ('services' in servicesResult && servicesResult.services) {
      const bundleServices = servicesResult.services.map((s: any) => ({
        categoryId: s.category_id,
        quantity: s.quantity,
        individualPrice: s.individual_price
      }))
      setSelectedServices(bundleServices)
    }
    
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingBundle(null)
    setName('')
    setDescription('')
    setBundleType('package')
    setTotalOriginalPrice('')
    setBundlePrice('')
    setValidityDays('30')
    setMaxRedemptions('1')
    setIconUrl('')
    setBannerUrl('')
    setTermsConditions('')
    setSelectedServices([])
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('bundle_type', bundleType)
      formData.append('total_original_price', totalOriginalPrice)
      formData.append('bundle_price', bundlePrice)
      formData.append('validity_days', validityDays)
      formData.append('max_redemptions', maxRedemptions)
      if (iconUrl) formData.append('icon_url', iconUrl)
      if (bannerUrl) formData.append('banner_url', bannerUrl)
      if (termsConditions) formData.append('terms_conditions', termsConditions)

      const result = editingBundle
        ? await updateServiceBundle(editingBundle.id, formData)
        : await createServiceBundle(formData)

      if ('error' in result && result.error) {
        setError(result.error)
        showToast({ type: 'error', message: result.error })
        setSaving(false)
        return
      }

      // Add services to bundle
      const bundleId = editingBundle?.id || (result as any).bundle?.id
      if (bundleId && selectedServices.length > 0) {
        const servicesResult = await addBundleServices(bundleId, selectedServices)
        if ('error' in servicesResult && servicesResult.error) {
          setError(`Bundle created but services failed: ${servicesResult.error}`)
          showToast({ type: 'warning', message: 'Bundle saved but services update failed' })
        } else {
          showToast({ 
            type: 'success', 
            message: editingBundle ? 'Bundle updated successfully!' : 'Bundle created successfully!' 
          })
        }
      } else {
        showToast({ 
          type: 'success', 
          message: editingBundle ? 'Bundle updated successfully!' : 'Bundle created successfully!' 
        })
      }

      handleCancelEdit()
      await loadData()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save bundle'
      setError(errorMsg)
      showToast({ type: 'error', message: errorMsg })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (bundleId: string, currentStatus: boolean) => {
    setError('')
    const result = await toggleBundleStatus(bundleId, !currentStatus)
    
    if ('error' in result && result.error) {
      setError(result.error)
      showToast({ type: 'error', message: result.error })
    } else {
      showToast({ 
        type: 'success', 
        message: `Bundle ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
      })
      await loadData()
    }
  }

  const handleDelete = async (bundleId: string) => {
    if (!confirm('Are you sure you want to delete this bundle? This action cannot be undone.')) {
      return
    }

    setError('')
    const result = await deleteServiceBundle(bundleId)
    
    if ('error' in result && result.error) {
      setError(result.error)
      showToast({ type: 'error', message: result.error })
    } else {
      showToast({ type: 'success', message: 'Bundle deleted successfully!' })
      await loadData()
    }
  }

  const addService = () => {
    if (categories.length > 0) {
      setSelectedServices([
        ...selectedServices,
        { categoryId: categories[0].id, quantity: 1, individualPrice: 0 }
      ])
    }
  }

  const removeService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index))
  }

  const updateService = (index: number, field: keyof BundleService, value: any) => {
    const updated = [...selectedServices]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedServices(updated)
    
    // Auto-calculate prices if all services have individual prices
    if (field === 'individualPrice' || field === 'quantity') {
      const totalOriginal = updated.reduce((sum, s) => sum + (s.individualPrice * s.quantity), 0)
      if (totalOriginal > 0) {
        setTotalOriginalPrice(totalOriginal.toFixed(2))
      }
    }
  }

  const calculateDiscount = () => {
    const original = parseFloat(totalOriginalPrice) || 0
    const bundle = parseFloat(bundlePrice) || 0
    if (original === 0) return '0'
    return ((original - bundle) / original * 100).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              Service Bundles
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create and manage service package deals with multiple services</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            {showForm ? (
              <>
                <XCircle className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Bundle
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingBundle ? (
                  <>
                    <Edit className="h-5 w-5" />
                    Edit Bundle
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Create New Bundle
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Basic Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Bundle Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Home Care Bundle"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bundle_type">Bundle Type *</Label>
                      <select
                        id="bundle_type"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={bundleType}
                        onChange={(e) => setBundleType(e.target.value as any)}
                        required
                      >
                        <option value="package">Package - Predefined Set</option>
                        <option value="combo">Combo - Mix & Match Services</option>
                        <option value="subscription">Subscription - Recurring Access</option>
                        <option value="seasonal">Seasonal - Limited Time Offer</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      id="description"
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what's included in this bundle"
                      required
                    />
                  </div>
                </div>

                {/* Services Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Included Services</h3>
                    <Button type="button" size="sm" variant="outline" onClick={addService} className="gap-1">
                      <Plus className="h-3 w-3" />
                      Add Service
                    </Button>
                  </div>

                  {selectedServices.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">No services added yet</p>
                      <Button type="button" size="sm" onClick={addService}>
                        Add First Service
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedServices.map((service, index) => (
                        <div key={index} className="flex gap-3 items-end p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Service Category</Label>
                            <select
                              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                              value={service.categoryId}
                              onChange={(e) => updateService(index, 'categoryId', e.target.value)}
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-24 space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={service.quantity}
                              onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="h-8"
                            />
                          </div>

                          <div className="w-32 space-y-1">
                            <Label className="text-xs">Price (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={service.individualPrice}
                              onChange={(e) => updateService(index, 'individualPrice', parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeService(index)}
                            className="h-8 px-3"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Pricing</h3>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="original_price">Original Price (₹) *</Label>
                      <Input
                        id="original_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={totalOriginalPrice}
                        onChange={(e) => setTotalOriginalPrice(e.target.value)}
                        placeholder="3000"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bundle_price">Bundle Price (₹) *</Label>
                      <Input
                        id="bundle_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={bundlePrice}
                        onChange={(e) => setBundlePrice(e.target.value)}
                        placeholder="2400"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validity">Validity (days) *</Label>
                      <Input
                        id="validity"
                        type="number"
                        min="1"
                        value={validityDays}
                        onChange={(e) => setValidityDays(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_uses">Max Uses *</Label>
                      <Input
                        id="max_uses"
                        type="number"
                        min="1"
                        value={maxRedemptions}
                        onChange={(e) => setMaxRedemptions(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {totalOriginalPrice && bundlePrice && (
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex-1">
                        <span className="text-sm text-muted-foreground">Discount:</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400 ml-2">{calculateDiscount()}% off</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-muted-foreground">Customer Savings:</span>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400 ml-2">
                          ₹{(parseFloat(totalOriginalPrice) - parseFloat(bundlePrice)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Fields */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Optional Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon_url">Icon URL</Label>
                      <Input
                        id="icon_url"
                        value={iconUrl}
                        onChange={(e) => setIconUrl(e.target.value)}
                        placeholder="https://example.com/icon.png"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="banner_url">Banner URL</Label>
                      <Input
                        id="banner_url"
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        placeholder="https://example.com/banner.png"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <textarea
                      id="terms"
                      className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={termsConditions}
                      onChange={(e) => setTermsConditions(e.target.value)}
                      placeholder="Enter any special terms or conditions"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : editingBundle ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Update Bundle
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Bundle
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bundles List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : bundles.length === 0 && !showForm ? (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No bundles created yet</p>
              <p className="text-sm text-muted-foreground mb-6">Create your first service bundle to offer package deals</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Bundle
              </Button>
            </CardContent>
          </Card>
        ) : !showForm && bundles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bundles.map(bundle => (
              <Card key={bundle.id} className={`shadow-lg transition-all hover:shadow-xl ${!bundle.is_active ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        {bundle.name}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-normal capitalize">
                          {bundle.bundle_type}
                        </span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{bundle.description}</p>
                    </div>
                    {bundle.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Original Price</span>
                      <span className="font-medium line-through text-gray-400">₹{bundle.total_original_price.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{bundle.discount_percentage.toFixed(1)}% off</span>
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Bundle Price</span>
                      <span className="text-xl font-bold text-primary">₹{bundle.bundle_price.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Validity</span>
                        <span className="font-medium">{bundle.validity_days}d</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Uses</span>
                        <span className="font-medium">{bundle.max_redemptions}×</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(bundle)} className="flex-1 gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleToggleActive(bundle.id, bundle.is_active)}
                      className="flex-1"
                    >
                      {bundle.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(bundle.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

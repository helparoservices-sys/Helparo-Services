'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getActiveServiceBundles, createServiceBundle } from '@/app/actions/bundles'

interface ServiceBundle {
  id: string
  name: string
  description: string
  service_ids: string[]
  base_price: number
  discount_percentage: number
  final_price: number
  validity_days: number
  is_active: boolean
  created_at: string
}

export default function AdminBundlesPage() {
  const [loading, setLoading] = useState(true)
  const [bundles, setBundles] = useState<ServiceBundle[]>([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBundle, setEditingBundle] = useState<ServiceBundle | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [serviceIds, setServiceIds] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState('')
  const [validityDays, setValidityDays] = useState('30')

  useEffect(() => {
    loadBundles()
  }, [])

  const loadBundles = async () => {
    setLoading(true)
    setError('')

    const result = await getActiveServiceBundles()

    if (result.error) {
      setError(result.error)
    } else {
      setBundles(result.bundles || [])
    }

    setLoading(false)
  }

  const handleEdit = (bundle: ServiceBundle) => {
    setEditingBundle(bundle)
    setName(bundle.name)
    setDescription(bundle.description)
    setServiceIds(bundle.service_ids.join(', '))
    setBasePrice(bundle.base_price.toString())
    setDiscountPercentage(bundle.discount_percentage.toString())
    setValidityDays(bundle.validity_days.toString())
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingBundle(null)
    setName('')
    setDescription('')
    setServiceIds('')
    setBasePrice('')
    setDiscountPercentage('')
    setValidityDays('30')
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingBundle) {
      setError('Edit functionality not yet implemented - please create a new bundle')
      return
    }
    
    setSaving(true)
    setError('')

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('image_url', '')
    formData.append('regular_price', (parseFloat(basePrice) || 0).toString())
    formData.append('bundle_price', (parseFloat(basePrice) * (1 - parseFloat(discountPercentage) / 100)).toString())
    formData.append('validity_days', validityDays)
    formData.append('max_redemptions', '1')

    const result = await createServiceBundle(formData)

    if (result.error) {
      setError(result.error)
    } else {
      handleCancelEdit()
      await loadBundles()
    }

    setSaving(false)
  }

  const handleToggleActive = async (bundleId: string, currentStatus: boolean) => {
    setError('Toggle functionality not yet implemented')
  }

  const handleDelete = async (bundleId: string) => {
    setError('Delete functionality not yet implemented')
  }

  const calculateFinalPrice = () => {
    const base = parseFloat(basePrice) || 0
    const discount = parseFloat(discountPercentage) || 0
    return (base * (1 - discount / 100)).toFixed(2)
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Bundles Management</h1>
            <p className="text-muted-foreground">Create and manage service package deals</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Bundle'}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingBundle ? 'Edit Bundle' : 'Create New Bundle'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bundle Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Home Care Bundle"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service IDs (comma-separated)</label>
                    <Input
                      value={serviceIds}
                      onChange={(e) => setServiceIds(e.target.value)}
                      placeholder="e.g., uuid1, uuid2, uuid3"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what's included in this bundle"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base Price (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="3000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      placeholder="20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Validity (days)</label>
                    <Input
                      type="number"
                      min="1"
                      value={validityDays}
                      onChange={(e) => setValidityDays(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {basePrice && discountPercentage && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <span className="text-sm text-muted-foreground">Final Price:</span>
                    <span className="text-lg font-bold text-primary">₹{calculateFinalPrice()}</span>
                    <span className="text-sm text-green-600">({discountPercentage}% off)</span>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      editingBundle ? 'Update Bundle' : 'Create Bundle'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bundles List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : bundles.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">No bundles created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bundles.map(bundle => (
              <Card key={bundle.id} className={!bundle.is_active ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{bundle.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${bundle.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {bundle.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Services Included</span>
                      <span className="font-medium">{bundle.service_ids.length} services</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Price</span>
                      <span className="font-medium line-through text-gray-400">₹{bundle.base_price.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium text-green-600">{bundle.discount_percentage}% off</span>
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Final Price</span>
                      <span className="text-lg font-bold text-primary">₹{bundle.final_price.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Validity</span>
                      <span className="font-medium">{bundle.validity_days} days</span>
                    </div>

                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{new Date(bundle.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(bundle)} className="flex-1">
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
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

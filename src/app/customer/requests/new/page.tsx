'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentProtectionBadge, MoneyBackGuarantee } from '@/components/trust-badges'
import AddressAutocomplete from '@/components/address-autocomplete'
import { createServiceRequest, getServiceCategories } from '@/app/actions/service-requests'
import { AlertCircle, CheckCircle2, MapPin, Calendar, DollarSign } from 'lucide-react'

interface Category { id: string; name: string }

export default function NewRequestPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    category_id: '',
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    location_lat: null as number | null,
    location_lng: null as number | null,
    country: 'India',
    budget_min: '',
    budget_max: '',
    preferred_date: '',
    preferred_time: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await getServiceCategories()
      if ('error' in result && result.error) {
        setError('Failed to load categories')
      } else if (result.data) {
        setCategories(result.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    setSuccess('')
    
    try {
      if (!form.category_id || !form.title || !form.description) {
        throw new Error('Please fill in all required fields')
      }

      // Call secure server action (with validation + sanitization)
      const result = await createServiceRequest({
        category_id: form.category_id,
        title: form.title,
        description: form.description,
        service_address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        country: form.country || 'India',
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        latitude: form.location_lat || undefined,
        longitude: form.location_lng || undefined,
      })

      if ('error' in result && result.error) {
        throw new Error(result.error)
      }

      setSuccess('✅ Request created successfully! Matching helpers will be notified.')
      
      // Redirect to bookings page after 2 seconds
      setTimeout(() => {
        router.push('/customer/bookings')
      }, 2000)
    } catch (e: any) {
      setError(e.message || 'Failed to create request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Service Request
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Get matched with verified helpers in your area
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Request Details
            </CardTitle>
          
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-900 dark:text-green-400">{success}</p>
                </div>
                <div className="ml-7 space-y-1 text-xs text-green-700 dark:text-green-400">
                  <p>✓ Smart matching algorithm finding best helpers</p>
                  <p>✓ You&apos;ll receive notifications when helpers apply</p>
                  <p>✓ Your payment is protected until service completion</p>
                </div>
              </div>
            )}
            {loading ? (
              <p className="text-sm text-slate-500">Loading categories...</p>
            ) : (
              <form onSubmit={submit} className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Service Category *
                  </Label>
                  <select
                    id="category"
                    className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Service Title *
                  </Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Fix leaking kitchen faucet"
                    value={form.title} 
                    onChange={(e) => setForm({ ...form, title: e.target.value })} 
                    required 
                    className="h-11"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description *
                  </Label>
                  <textarea
                    id="description"
                    placeholder="Describe what you need help with in detail..."
                    className="min-h-[120px] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Service Location
                  </Label>
                  <AddressAutocomplete
                    value={form.address}
                    onChange={(value) => setForm({ ...form, address: value })}
                    onAddressSelect={(selected) => {
                      setForm({
                        ...form,
                        address: selected.display_name,
                        city: selected.city || '',
                        state: selected.state || '',
                        pincode: selected.pincode || '',
                        location_lat: selected.lat,
                        location_lng: selected.lng,
                      })
                    }}
                    placeholder="Enter service address"
                  />
                </div>

                {/* Location Details Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">City</Label>
                    <Input 
                      id="city" 
                      value={form.city} 
                      onChange={(e) => setForm({ ...form, city: e.target.value })} 
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">State</Label>
                    <Input 
                      id="state" 
                      value={form.state} 
                      onChange={(e) => setForm({ ...form, state: e.target.value })} 
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-sm font-medium">Pincode</Label>
                    <Input 
                      id="pincode" 
                      value={form.pincode} 
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })} 
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget Range (₹)
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Input 
                        id="budget_min" 
                        type="number" 
                        min={0} 
                        placeholder="Min ₹"
                        value={form.budget_min} 
                        onChange={(e) => setForm({ ...form, budget_min: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Input 
                        id="budget_max" 
                        type="number" 
                        min={0} 
                        placeholder="Max ₹"
                        value={form.budget_max} 
                        onChange={(e) => setForm({ ...form, budget_max: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Preferred Schedule */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Preferred Schedule (Optional)
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      type="date" 
                      value={form.preferred_date} 
                      onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} 
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Input 
                      type="time" 
                      value={form.preferred_time} 
                      onChange={(e) => setForm({ ...form, preferred_time: e.target.value })} 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {saving ? 'Creating Request...' : 'Create Request'}
                </Button>
              </form>
            )}

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
              <PaymentProtectionBadge />
              <MoneyBackGuarantee />
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>🔒 Your data is secure:</strong> All inputs are validated, sanitized, and rate-limited to prevent abuse.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

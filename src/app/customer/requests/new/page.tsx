'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentProtectionBadge, MoneyBackGuarantee } from '@/components/trust-badges'
import { createServiceRequest, getServiceCategories } from '@/app/actions/service-requests'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Category { id: string; name: string }

export default function NewRequestPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    category_id: '',
    title: '',
    description: '',
    city: '',
    country: '',
    budget_min: '',
    budget_max: '',
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
        throw new Error('Missing required fields')
      }

      // Call secure server action (with validation + sanitization)
      const result = await createServiceRequest({
        category_id: form.category_id,
        title: form.title,
        description: form.description,
        city: form.city || undefined,
        country: form.country || undefined,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      })

      if ('error' in result && result.error) {
        throw new Error(result.error)
      }

      setSuccess('✅ Request created successfully! Matching helpers will be notified.')
      setForm({ 
        category_id: '', 
        title: '', 
        description: '', 
        city: '', 
        country: '', 
        budget_min: '', 
        budget_max: '' 
      })
    } catch (e: any) {
      setError(e.message || 'Failed to create request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create a Service Request</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              ✅ All inputs are validated and sanitized for your security
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-4">
                <div className="flex gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-900">{success}</p>
                </div>
                <div className="ml-7 space-y-1 text-xs text-green-700">
                  <p>✓ Smart matching algorithm finding best helpers</p>
                  <p>✓ You'll receive notifications when helpers apply</p>
                  <p>✓ Your payment is protected until service completion</p>
                </div>
              </div>
            )}
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="h-10 w-full rounded-md border bg-white px-2 text-sm"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="min-h-[120px] w-full rounded-md border px-2 py-2 text-sm"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="budget_min">Budget Min</Label>
                    <Input id="budget_min" type="number" min={0} value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="budget_max">Budget Max</Label>
                    <Input id="budget_max" type="number" min={0} value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Request'}</Button>
              </form>
            )}

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t space-y-4">
              <PaymentProtectionBadge />
              <MoneyBackGuarantee />
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-900">
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

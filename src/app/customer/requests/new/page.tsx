'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
      const { data, error: catErr } = await supabase
        .from('service_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (catErr) setError('Failed to load categories')
      else setCategories(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    setSuccess('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }
    try {
      if (!form.category_id || !form.title || !form.description) throw new Error('Missing required fields')
      const payload = {
        customer_id: user.id,
        category_id: form.category_id,
        title: form.title,
        description: form.description,
        city: form.city || null,
        country: form.country || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        status: 'open' as const,
      }
      const { error: insErr } = await (supabase.from('service_requests') as any).insert(payload)
      if (insErr) throw insErr
      setSuccess('Request created successfully.')
      setForm({ category_id: '', title: '', description: '', city: '', country: '', budget_min: '', budget_max: '' })
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
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            {success && <p className="text-sm text-green-600 mb-2">{success}</p>}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

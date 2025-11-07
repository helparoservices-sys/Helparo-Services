'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Category { id: string; name: string; slug: string; description: string | null }
interface HelperService { id: string; category_id: string; hourly_rate: number }

export default function HelperServicesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<Record<string, HelperService | null>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      const { data: cats, error: catErr } = await supabase
        .from('service_categories')
        .select('id, name, slug, description')
        .eq('is_active', true)
        .order('name')
      const { data: { user } } = await supabase.auth.getUser()
      if (catErr) {
        setError('Failed to load categories')
      } else {
        setCategories(cats || [])
        if (user) {
          const { data: hs } = await supabase
            .from('helper_services')
            .select('id, category_id, hourly_rate')
            .eq('helper_id', user.id)
          const map: Record<string, HelperService | null> = {}
          const catsTyped = (cats || []) as { id: string }[]
          const hsTyped = (hs || []) as { id: string; category_id: string; hourly_rate: number }[]
          for (const c of catsTyped) map[c.id] = null
          for (const h of hsTyped) map[h.category_id] = h as any
          setSelected(map)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggle = (categoryId: string) => {
    const cur = selected[categoryId]
    if (cur) {
      setSelected({ ...selected, [categoryId]: null })
    } else {
      setSelected({ ...selected, [categoryId]: { id: '', category_id: categoryId, hourly_rate: 25 } })
    }
  }

  const setRate = (categoryId: string, rate: number) => {
    const cur = selected[categoryId]
    if (!cur) return
    setSelected({ ...selected, [categoryId]: { ...cur, hourly_rate: rate } })
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }

    try {
      // Upsert selected services, delete deselected
      const desired = Object.entries(selected).filter(([_, v]) => v !== null) as [string, HelperService][]
      // Upsert
      for (const [categoryId, hs] of desired) {
        const payload = { helper_id: user.id, category_id: categoryId, hourly_rate: hs!.hourly_rate }
        const { error: upErr } = await (supabase.from('helper_services') as any)
          .upsert(payload, { onConflict: 'helper_id,category_id' })
        if (upErr) throw upErr
      }
      // Fetch existing and delete ones no longer selected
      const { data: existing } = await supabase
        .from('helper_services')
        .select('id, category_id')
        .eq('helper_id', user.id)
      const keepSet = new Set(desired.map(([cid]) => cid))
      const existingTyped = (existing || []) as { id: string; category_id: string }[]
      for (const row of existingTyped) {
        if (!keepSet.has(row.category_id)) {
          const { error: delErr } = await supabase
            .from('helper_services')
            .delete()
            .eq('id', row.id)
          if (delErr) throw delErr
        }
      }
      setSuccess('Your services have been updated.')
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Services you offer</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-4">
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
                <div className="grid gap-3 md:grid-cols-2">
                  {categories.map(c => {
                    const cur = selected[c.id]
                    const active = !!cur
                    return (
                      <div key={c.id} className={`rounded-md border p-4 bg-white ${active ? 'border-secondary' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.description}</div>
                          </div>
                          <Button variant={active ? 'outline' : 'default'} size="sm" onClick={() => toggle(c.id)}>
                            {active ? 'Remove' : 'Add'}
                          </Button>
                        </div>
                        {active && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm">Rate:</span>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              className="h-9 w-24 rounded border px-2"
                              value={cur!.hourly_rate}
                              onChange={(e) => setRate(c.id, Number(e.target.value))}
                            />
                            <span className="text-sm text-muted-foreground">per hour</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div>
                  <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

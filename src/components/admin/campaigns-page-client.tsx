"use client"

import { useState, useCallback, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCampaign, updateCampaign, toggleCampaignStatus, deleteCampaign } from '@/app/actions/bundles'
import { Megaphone, Plus, XCircle, CheckCircle, Clock, TrendingUp, AlertCircle, Trash2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast-notification'

// DB-aligned types
export interface Campaign {
  id: string
  name: string
  description: string | null
  campaign_type: string
  discount_type: string
  discount_value: number
  min_order_amount: number | null
  max_discount_amount: number | null
  applicable_to: string
  target_user_segment: string | null
  start_date: string
  end_date: string
  is_active: boolean
  max_redemptions_per_user: number | null
  total_redemptions: number | null
  total_revenue: number | null
  banner_url: string | null
  created_at: string
  updated_at: string
  categories?: { category_id: string }[]
}

interface Category { id: string; name: string }
interface Props { campaigns: Campaign[]; categories: Category[] }

interface FormState {
  id?: string
  name: string
  description: string
  campaign_type: string
  discount_type: string
  discount_value: string
  min_order_amount: string
  max_discount_amount: string
  applicable_to: string
  target_user_segment: string
  start_date: string
  end_date: string
  max_redemptions_per_user: string
  banner_url: string
}

const emptyForm: FormState = {
  name: '',
  description: '',
  campaign_type: 'festival',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '',
  max_discount_amount: '',
  applicable_to: 'all_services',
  target_user_segment: 'all',
  start_date: '',
  end_date: '',
  max_redemptions_per_user: '',
  banner_url: ''
}

const CAMPAIGN_TYPES = ['festival','monsoon','summer','winter','new_year','special_event','flash_sale']
const DISCOUNT_TYPES = ['percentage','flat','bundle']
const APPLICABLE_TO = ['all_services','specific_services','specific_categories']
const USER_SEGMENTS = ['all','new_users','existing_users','premium_users','inactive_users']

function formatDiscount(c: Campaign) {
  if (c.discount_type === 'percentage') return `${c.discount_value}% off`
  if (c.discount_type === 'flat') return `₹${c.discount_value} off`
  return 'Bundle Pricing'
}

function daysRemaining(end: string) {
  return Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)
}

export default function CampaignsPageClient({ campaigns, categories }: Props) {
  const router = useRouter()
  const { showSuccess, showError, showWarning } = useToast()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Category selection state (declared early so submit hook can depend on it)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const toggleCategory = useCallback((id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }, [])

  const activeCount = useMemo(() => campaigns.filter(c => c.is_active && daysRemaining(c.end_date) >= 0).length, [campaigns])
  const endingSoon = useMemo(() => campaigns.filter(c => c.is_active && daysRemaining(c.end_date) > 0 && daysRemaining(c.end_date) <= 7).length, [campaigns])
  const totalUses = useMemo(() => campaigns.reduce((s,c)=> s + (c.total_redemptions || 0),0), [campaigns])

  const reset = useCallback(() => { 
    setForm(emptyForm); 
    setOpen(false); 
    setError(''); 
    setSelectedCategories([]);
  }, [])

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
  }, [])

  const startCreate = useCallback(() => { reset(); setOpen(true) }, [reset])

  const startEdit = useCallback((c: Campaign) => {
    setForm({
      id: c.id,
      name: c.name,
      description: c.description || '',
      campaign_type: c.campaign_type,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : '',
      max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : '',
      applicable_to: c.applicable_to,
      target_user_segment: c.target_user_segment || 'all',
      start_date: c.start_date.split('T')[0],
      end_date: c.end_date.split('T')[0],
      max_redemptions_per_user: c.max_redemptions_per_user ? String(c.max_redemptions_per_user) : '',
      banner_url: c.banner_url || ''
    })
    // Load existing category selections
    const existingCats = c.categories?.map(cat => cat.category_id) || []
    setSelectedCategories(existingCats)
    setOpen(true)
  }, [])

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k,v]) => { if (k !== 'id' && v !== '') fd.append(k, v) })
    // category selection
    if (form.applicable_to === 'specific_categories') {
      const selected = selectedCategories
      selected.forEach(id => fd.append('category_ids[]', id))
    }

    const result = form.id ? await updateCampaign(form.id, fd) : await createCampaign(fd)
    if ('error' in result && result.error) {
      setError(result.error || 'Failed')
      showError(form.id ? 'Update Failed' : 'Creation Failed', result.error || 'Failed to save campaign')
    } else {
      reset()
      showSuccess(form.id ? 'Campaign Updated! ✅' : 'Campaign Created! 🎉', `Campaign "${form.name}" has been ${form.id ? 'updated' : 'created'} successfully`)
      startTransition(() => router.refresh())
    }
    setSaving(false)
  }, [form, router, reset, selectedCategories, showSuccess, showError])

  const toggleActive = useCallback(async (c: Campaign) => {
    setError('')
    const res = await toggleCampaignStatus(c.id, !c.is_active)
    if ('error' in res && res.error) {
      setError(res.error)
      showError('Toggle Failed', res.error)
    } else {
      showSuccess(`Campaign ${!c.is_active ? 'Activated' : 'Deactivated'}! ${!c.is_active ? '⚡' : '⏸️'}`, `Campaign "${c.name}" is now ${!c.is_active ? 'active' : 'inactive'}`)
      startTransition(() => router.refresh())
    }
  }, [router, showSuccess, showError])

  const confirmDelete = useCallback((c: Campaign) => { setDeletingId(c.id) }, [])

  const performDelete = useCallback(async () => {
    if (!deletingId) return
    setError('')
    const campaignToDelete = campaigns.find(c => c.id === deletingId)
    const res = await deleteCampaign(deletingId)
    if ('error' in res && res.error) {
      setError(res.error)
      showError('Delete Failed', res.error)
    } else {
      showSuccess('Campaign Deleted! 🗑️', campaignToDelete ? `Campaign "${campaignToDelete.name}" has been removed` : 'Campaign has been removed successfully')
      startTransition(() => router.refresh())
    }
    setDeletingId(null)
  }, [deletingId, router, campaigns, showSuccess, showError])

  // (moved category state above submit)

  return (
    <div className="space-y-6 animate-fade-in bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Campaign Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Seasonal & festival discount campaigns</p>
        </div>
        <Button onClick={open ? reset : startCreate} variant={open ? 'outline' : 'default'} className="gap-2">
          {open ? <XCircle className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}
          {open ? 'Cancel' : 'New Campaign'}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 text-sm">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={campaigns.length} icon={<Megaphone className="h-6 w-6 text-blue-600" />} color="bg-blue-100" />
        <StatCard label="Active" value={activeCount} icon={<CheckCircle className="h-6 w-6 text-green-600" />} color="bg-green-100" />
        <StatCard label="Ending Soon" value={endingSoon} icon={<Clock className="h-6 w-6 text-yellow-600" />} color="bg-yellow-100" />
        <StatCard label="Total Uses" value={totalUses} icon={<TrendingUp className="h-6 w-6 text-purple-600" />} color="bg-purple-100" />
      </div>

      {open && (
        <Card>
          <CardHeader><CardTitle>{form.id ? 'Edit Campaign' : 'Create Campaign'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <FormField label="Name" value={form.name} onChange={v=>handleChange('name',v)} required placeholder="Diwali Special" />
                <FormSelect label="Type" value={form.campaign_type} onChange={v=>handleChange('campaign_type',v)} options={CAMPAIGN_TYPES} />
              </div>
              <FormTextarea label="Description" value={form.description} onChange={v=>handleChange('description',v)} required placeholder="Describe the offer" />
              <div className="grid md:grid-cols-3 gap-4">
                <FormSelect label="Discount Type" value={form.discount_type} onChange={v=>handleChange('discount_type',v)} options={DISCOUNT_TYPES} />
                <FormField label={`Discount Value ${form.discount_type==='percentage'?'(%)':'(₹)'}`} type="number" value={form.discount_value} onChange={v=>handleChange('discount_value',v)} required />
                <FormField label="Max Discount (₹)" type="number" value={form.max_discount_amount} onChange={v=>handleChange('max_discount_amount',v)} placeholder="Optional" />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <FormField label="Min Order (₹)" type="number" value={form.min_order_amount} onChange={v=>handleChange('min_order_amount',v)} placeholder="Optional" />
                <FormSelect label="Applicable To" value={form.applicable_to} onChange={v=>handleChange('applicable_to',v)} options={APPLICABLE_TO} />
                <FormSelect label="User Segment" value={form.target_user_segment} onChange={v=>handleChange('target_user_segment',v)} options={USER_SEGMENTS} />
              </div>
              {form.applicable_to === 'specific_categories' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium">Select Categories</label>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-auto border rounded p-2">
                    {categories.map(cat => (
                      <button type="button" key={cat.id} onClick={()=>toggleCategory(cat.id)}
                        className={`text-left text-xs px-2 py-1 rounded border transition ${selectedCategories.includes(cat.id) ? 'bg-primary text-white border-primary' : 'bg-background hover:bg-muted'}`}> 
                        {cat.name}
                      </button>
                    ))}
                    {categories.length === 0 && <span className="text-xs text-muted-foreground">No categories</span>}
                  </div>
                  {selectedCategories.length > 0 && <p className="text-xs text-primary">{selectedCategories.length} selected</p>}
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4">
                <FormField label="Start Date" type="date" value={form.start_date} onChange={v=>handleChange('start_date',v)} required />
                <FormField label="End Date" type="date" value={form.end_date} onChange={v=>handleChange('end_date',v)} required />
                <FormField label="Max Redemptions/User" type="number" value={form.max_redemptions_per_user} onChange={v=>handleChange('max_redemptions_per_user',v)} placeholder="Optional" />
              </div>
              <FormField label="Banner URL" value={form.banner_url} onChange={v=>handleChange('banner_url',v)} placeholder="https://..." />
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving || isPending} className="gap-2">
                  {(saving || isPending) && <LoadingSpinner size="sm" />}
                  {form.id ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={reset}>Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Campaign list */}
      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.length === 0 && (
          <Card><CardContent className="pt-6 text-sm text-muted-foreground">No campaigns yet</CardContent></Card>
        )}
        {campaigns.map(c => {
          const daysLeft = daysRemaining(c.end_date)
          const expired = daysLeft < 0
          const active = c.is_active && !expired
          return (
            <Card key={c.id} className={!active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${expired?'bg-red-100 text-red-700':active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>{expired?'Expired':active?'Active':'Inactive'}</span>
                    {active && daysLeft > 0 && daysLeft <= 7 && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">{daysLeft}d left</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <InfoRow label="Type" value={c.campaign_type.replace('_',' ')} />
                  <InfoRow label="Discount" value={formatDiscount(c)} />
                  <InfoRow label="Period" value={`${c.start_date.split('T')[0]} to ${c.end_date.split('T')[0]}`} />
                  <InfoRow label="Segment" value={c.target_user_segment || 'all'} />
                  <InfoRow label="Uses" value={String(c.total_redemptions || 0)} />
                  <InfoRow label="Revenue" value={`₹${(c.total_revenue || 0).toLocaleString()}`} />
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1" onClick={()=>startEdit(c)}>Edit</Button>
                  {!expired && <Button size="sm" variant="outline" className="flex-1" onClick={()=>toggleActive(c)}>{c.is_active? 'Deactivate':'Activate'}</Button>}
                  <Button size="sm" variant="destructive" onClick={()=>confirmDelete(c)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-sm space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold">Delete Campaign?</h2>
            <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" onClick={performDelete} disabled={isPending}>Confirm</Button>
              <Button variant="outline" className="flex-1" onClick={()=>setDeletingId(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-lg border shadow-sm p-4 flex items-center justify-between ${color} dark:bg-slate-800/50 dark:border-slate-700`}> 
      <div>
        <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold mt-1 dark:text-white">{value}</p>
      </div>
      <div className="w-12 h-12 bg-white/70 dark:bg-slate-700/70 rounded flex items-center justify-center">{icon}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between"><span className="text-muted-foreground dark:text-slate-400">{label}</span><span className="font-medium truncate dark:text-white">{value}</span></div>
  )
}

function FormField({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string; onChange: (v:string)=>void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}{required && <span className="text-red-500"> *</span>}</label>
      <Input type={type} value={value} required={required} placeholder={placeholder} onChange={e=>onChange(e.target.value)} />
    </div>
  )
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v:string)=>void; options: string[] }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium dark:text-slate-200">{label}</label>
      <select className="w-full rounded-md border border-input bg-background dark:bg-slate-800 dark:border-slate-600 dark:text-white px-2 py-2 text-sm" value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
      </select>
    </div>
  )
}

function FormTextarea({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v:string)=>void; required?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium dark:text-slate-200">{label}{required && <span className="text-red-500"> *</span>}</label>
      <textarea className="w-full rounded-md border border-input bg-background dark:bg-slate-800 dark:border-slate-600 dark:text-white px-3 py-2 text-sm min-h-[80px]" value={value} required={required} placeholder={placeholder} onChange={e=>onChange(e.target.value)} />
    </div>
  )
}

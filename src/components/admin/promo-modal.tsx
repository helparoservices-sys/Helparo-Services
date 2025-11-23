"use client"
import { useState, useTransition, useEffect } from 'react'
import { createPromo, updatePromo } from '@/app/actions/promos'
import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PromoModalProps {
  open: boolean
  onClose: () => void
  promo?: {
    id: string
    code: string
    description: string | null
    discount_type: 'flat' | 'percent'
    discount_value: number
    max_discount_rupees: number | null
    start_date: string
    end_date: string
    usage_limit_total: number | null
    usage_limit_per_user: number | null
    min_order_amount_rupees: number | null
    is_active: boolean
    allowed_roles: string[] | null
  }
}

export function PromoModal({ open, onClose, promo }: PromoModalProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isEdit = !!promo

  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat')
  const [discountValue, setDiscountValue] = useState('')
  const [maxCap, setMaxCap] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [usageTotal, setUsageTotal] = useState('')
  const [usagePerUser, setUsagePerUser] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [allowedRoles, setAllowedRoles] = useState<string[]>(['customer'])

  useEffect(() => {
    if (promo && open) {
      setCode(promo.code)
      setDescription(promo.description || '')
      setDiscountType(promo.discount_type)
      setDiscountValue(promo.discount_value.toString())
      setMaxCap(promo.max_discount_rupees?.toString() || '')
      setStartDate(promo.start_date.slice(0,10))
      setEndDate(promo.end_date.slice(0,10))
      setUsageTotal(promo.usage_limit_total?.toString() || '')
      setUsagePerUser(promo.usage_limit_per_user?.toString() || '')
      setMinOrder(promo.min_order_amount_rupees?.toString() || '')
      setAllowedRoles(promo.allowed_roles || ['customer'])
    } else if (!promo && open) {
      // initialize defaults for create
      const today = new Date()
      const end = new Date(Date.now() + 1000*60*60*24*30)
      setStartDate(today.toISOString().slice(0,10))
      setEndDate(end.toISOString().slice(0,10))
      setDiscountType('flat')
      setAllowedRoles(['customer'])
    }
  }, [promo, open])

  function reset() {
    setCode('')
    setDescription('')
    setDiscountType('flat')
    setDiscountValue('')
    setMaxCap('')
    setUsageTotal('')
    setUsagePerUser('')
    setMinOrder('')
    setAllowedRoles(['customer'])
  }

  function close() {
    if (pending) return
    reset()
    onClose()
  }

  function toggleRole(r: string) {
    setAllowedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  function submit() {
    const dv = Number(discountValue)
    if (!dv || dv <= 0) {
      alert('Discount value must be > 0')
      return
    }
    if (!code.trim()) {
      alert('Code is required')
      return
    }
    startTransition(async () => {
      const result = isEdit && promo
        ? await updatePromo(promo.id, {
            code: code !== promo.code ? code : undefined,
            description: description || null,
            discountType,
            discountValue: dv,
            maxDiscountRupees: maxCap ? Number(maxCap) : null,
            startDate,
            endDate,
            usageLimitTotal: usageTotal ? Number(usageTotal) : null,
            usageLimitPerUser: usagePerUser ? Number(usagePerUser) : null,
            minOrderAmountRupees: minOrder ? Number(minOrder) : null,
            allowedRoles
          })
        : await createPromo({
            code,
            description: description || undefined,
            discountType,
            discountValue: dv,
            maxDiscountRupees: maxCap ? Number(maxCap) : undefined,
            startDate,
            endDate,
            usageLimitTotal: usageTotal ? Number(usageTotal) : undefined,
            usageLimitPerUser: usagePerUser ? Number(usagePerUser) : undefined,
            minOrderAmountRupees: minOrder ? Number(minOrder) : undefined,
            allowedRoles
          })
      
      if (result?.data) {
        close()
        router.refresh()
      }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <button onClick={close} className="absolute top-3 right-3 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEdit ? 'Edit Promo Code' : 'Create Promo Code'}</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="col-span-1 space-y-1">
            <label className="font-medium">Code</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600" placeholder="WELCOME100" />
          </div>
          <div className="col-span-1 space-y-1">
            <label className="font-medium">Type</label>
            <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600">
              <option value="flat">Flat (₹)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </div>
          <div className="col-span-1 space-y-1">
            <label className="font-medium">Value {discountType==='flat' ? '(₹)' : '(%)'}</label>
            <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600" />
          </div>
          <div className="col-span-1 space-y-1">
            <label className="font-medium">Max Cap (₹, percent only)</label>
            <input type="number" value={maxCap} onChange={e => setMaxCap(e.target.value)} disabled={discountType!=='percent'} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600 disabled:opacity-40" />
          </div>
          <div className="col-span-1 space-y-1">
            <label className="font-medium">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600" />
          </div>
            <div className="col-span-1 space-y-1">
            <label className="font-medium">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600" />
          </div>
          <div className="col-span-1 space-y-1">
            <label className="font-medium">Total Limit</label>
            <input type="number" value={usageTotal} onChange={e => setUsageTotal(e.target.value)} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600" />
          </div>
          <div className="col-span-1 space-y-1">
            <label className="font-medium">Per User Limit</label>
            <input type="number" value={usagePerUser} onChange={e => setUsagePerUser(e.target.value)} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600" />
          </div>
          <div className="col-span-1 space-y-1">
            <label className="font-medium">Min Order (₹)</label>
            <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="font-medium">Allowed Roles</label>
            <div className="flex gap-2 flex-wrap">
              {['customer','helper','admin'].map(r => (
                <button key={r} type="button" onClick={() => toggleRole(r)} className={`px-2 py-1 rounded border text-xs ${allowedRoles.includes(r) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white/60 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="col-span-2 space-y-1">
            <label className="font-medium">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-slate-900/40 border-slate-300 dark:border-slate-600" placeholder="Short description" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={close} disabled={pending} className="px-4 py-2 rounded-lg text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">Cancel</button>
          <button onClick={submit} disabled={pending || !code || !discountValue} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 flex items-center gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} {isEdit ? 'Save Changes' : 'Create Promo'}
          </button>
        </div>
      </div>
    </div>
  )
}
"use client"
import { useTransition } from 'react'
import { togglePromoActive, deletePromo } from '@/app/actions/promos'
import { Trash2, Loader2, Power } from 'lucide-react'

interface PromoCode {
  id: string
  is_active: boolean
}

export function PromoRowActions({ promo, onRefresh }: { promo: PromoCode; onRefresh: () => void }) {
  const [pending, startTransition] = useTransition()

  function onToggle() {
    startTransition(async () => {
      await togglePromoActive(promo.id, !promo.is_active)
      onRefresh()
    })
  }

  function onDelete() {
    if (!confirm('Delete promo code?')) return
    startTransition(async () => {
      await deletePromo(promo.id)
      onRefresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggle}
        disabled={pending}
        title={promo.is_active ? 'Deactivate' : 'Activate'}
        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
      </button>
      <button
        onClick={onDelete}
        disabled={pending}
        title="Delete"
        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
"use client"
import { useState, useTransition } from 'react'
import { assignHelper, updateBookingStatus } from '@/app/actions/bookings'
import { CheckCircle, XCircle, Clock, UserPlus } from 'lucide-react'
import { HelperPicker } from './helper-picker'

export function BookingActions({ bookingId, currentStatus, assignedHelperId }: { bookingId: string; currentStatus: string; assignedHelperId?: string | null }) {
  const [helperId, setHelperId] = useState(assignedHelperId || '')
  const [msg, setMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const runAssign = () => {
    if (!helperId) { setMsg('Select a helper'); return }
    startTransition(async () => {
      setMsg(null)
      const res = await assignHelper(bookingId, helperId)
      if (res.error) setMsg(res.error); else setMsg('Helper assigned successfully!')
    })
  }

  const changeStatus = (status: 'open'|'assigned'|'completed'|'cancelled') => {
    startTransition(async () => {
      setMsg(null)
      const res = await updateBookingStatus(bookingId, status)
      if (res.error) setMsg(res.error); else setMsg('Status updated.')
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Assign Helper</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <HelperPicker value={helperId} onChange={setHelperId} />
          </div>
          <button
            onClick={runAssign}
            disabled={isPending || !helperId}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm flex items-center gap-1 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Assign
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={()=>changeStatus('open')}
          disabled={isPending || currentStatus==='open'}
          className="px-3 py-1.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 disabled:opacity-40"
        ><Clock className="h-3 w-3"/> Open</button>
        <button
          onClick={()=>changeStatus('assigned')}
          disabled={isPending || currentStatus==='assigned'}
          className="px-3 py-1.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 disabled:opacity-40"
        ><Clock className="h-3 w-3"/> Assigned</button>
        <button
          onClick={()=>changeStatus('completed')}
          disabled={isPending || currentStatus==='completed'}
          className="px-3 py-1.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 disabled:opacity-40"
        ><CheckCircle className="h-3 w-3"/> Completed</button>
        <button
          onClick={()=>changeStatus('cancelled')}
          disabled={isPending || currentStatus==='cancelled'}
          className="px-3 py-1.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-40"
        ><XCircle className="h-3 w-3"/> Cancelled</button>
      </div>
      {msg && <p className="text-xs text-primary-600 dark:text-primary-400">{msg}</p>}
    </div>
  )
}

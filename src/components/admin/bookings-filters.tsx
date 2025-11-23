"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, Calendar, User, Clock } from 'lucide-react'

export function BookingsFilters() {
  const router = useRouter()
  const search = useSearchParams()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string>(search.get('status') || '')
  const [customer, setCustomer] = useState<string>(search.get('customer') || '')
  const [from, setFrom] = useState<string>(search.get('from') || '')
  const [to, setTo] = useState<string>(search.get('to') || '')
  const [bookingId, setBookingId] = useState<string>(search.get('bookingId') || '')
  const [category, setCategory] = useState<string>(search.get('category') || '')

  useEffect(() => {
    setStatus(search.get('status') || '')
    setCustomer(search.get('customer') || '')
    setFrom(search.get('from') || '')
    setTo(search.get('to') || '')
    setBookingId(search.get('bookingId') || '')
    setCategory(search.get('category') || '')
  }, [search])

  const apply = () => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (customer) params.set('customer', customer)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (bookingId) params.set('bookingId', bookingId)
    if (category) params.set('category', category)
    router.push(`/admin/bookings?${params.toString()}`)
    setOpen(false)
  }

  const clearAll = () => {
    router.push('/admin/bookings')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow flex items-center gap-2"
      >
        <Filter className="h-4 w-4" /> Filters
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-40 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filter Bookings</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1"><Clock className="h-3 w-3" /> Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Any</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1"><User className="h-3 w-3" /> Booking ID</label>
              <input
                value={bookingId}
                onChange={e => setBookingId(e.target.value)}
                placeholder="Enter booking ID..."
                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1"><User className="h-3 w-3" /> Customer</label>
              <input
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                placeholder="Name contains..."
                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1"><User className="h-3 w-3" /> Category</label>
              <input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Category name..."
                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" /> From</label>
                <input
                  type="date"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" /> To</label>
                <input
                  type="date"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={clearAll}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
            >Clear</button>
            <button
              onClick={apply}
              className="text-xs px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow"
            >Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}

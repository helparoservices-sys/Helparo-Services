"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Search, UserCheck } from 'lucide-react'

interface Helper {
  id: string
  user_id: string
  profiles?: { full_name?: string; email?: string } | null
}

export function HelperPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && helpers.length === 0) {
      fetchHelpers()
    }
  }, [open])

  const fetchHelpers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('helper_profiles')
      .select(`id,user_id,profiles!helper_profiles_user_id_fkey(full_name,email)`)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(100)
    setHelpers((data as any) || [])
    setLoading(false)
  }

  const filtered = helpers.filter(h =>
    h.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    h.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
    h.user_id.includes(search)
  )

  const selected = helpers.find(h => h.user_id === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-900/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span className="truncate">{selected?.profiles?.full_name || value || 'Select helper...'}</span>
        <UserCheck className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-50 dark:bg-slate-900/50">
              <Search className="h-3 w-3 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-xs text-slate-500 text-center">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">No helpers found</div>
            ) : (
              filtered.map(h => (
                <button
                  key={h.user_id}
                  type="button"
                  onClick={() => { onChange(h.user_id); setOpen(false); setSearch('') }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                >
                  <div className="font-medium text-slate-900 dark:text-white">{h.profiles?.full_name || 'Unnamed'}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{h.profiles?.email}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}

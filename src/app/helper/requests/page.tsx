'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface RequestRow { id: string; title: string; description: string; created_at: string }
interface ApplicationRow { id: string; status: string }

export default function HelperOpenRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [apps, setApps] = useState<Record<string, ApplicationRow>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); setLoading(false); return }

      // fetch open requests (RLS will filter for approved helpers only)
      const { data: reqs, error: reqErr } = await supabase
        .from('service_requests')
        .select('id, title, description, created_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      if (reqErr) { setError('Failed to load'); setLoading(false); return }
      setRequests((reqs || []) as any)

      // fetch existing applications to mark state
      const { data: myApps } = await supabase
        .from('request_applications')
        .select('id, request_id, status')
        .eq('helper_id', user.id)
      const map: Record<string, ApplicationRow> = {}
      for (const a of (myApps || []) as any[]) map[a.request_id] = a
      setApps(map)

      setLoading(false)
    }
    load()
  }, [])

  const apply = async (requestId: string) => {
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: insErr } = await (supabase.from('request_applications') as any).insert({
      request_id: requestId,
      helper_id: user.id,
      status: 'applied'
    })
    if (insErr && insErr.code !== '23505') { setError(insErr.message); return }
    setApps(prev => ({ ...prev, [requestId]: { id: 'local', status: 'applied' } }))
  }

  const withdraw = async (requestId: string) => {
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: existing } = await supabase
      .from('request_applications')
      .select('id')
      .eq('request_id', requestId)
      .eq('helper_id', user.id)
      .maybeSingle()
    const appId = (existing as any)?.id
    if (!appId) return
    const { error: updErr } = await (supabase.from('request_applications') as any)
      .update({ status: 'withdrawn' })
      .eq('id', appId)
    if (updErr) { setError(updErr.message); return }
    setApps(prev => ({ ...prev, [requestId]: { id: appId, status: 'withdrawn' } }))
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Open Requests</h1>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="space-y-3">
            {requests.length === 0 && <p className="text-sm text-muted-foreground">No open requests available.</p>}
            {requests.map(r => {
              const app = apps[r.id]
              return (
                <div key={r.id} className="rounded-md border bg-white p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground mb-2">{new Date(r.created_at).toLocaleString()}</div>
                    <div className="text-sm line-clamp-3">{r.description}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!app && (
                      <Button size="sm" onClick={() => apply(r.id)}>Apply</Button>
                    )}
                    {app && app.status === 'applied' && (
                      <Button variant="outline" size="sm" onClick={() => withdraw(r.id)}>Withdraw</Button>
                    )}
                    {app && app.status === 'withdrawn' && (
                      <div className="text-xs text-muted-foreground">Withdrawn</div>
                    )}
                    {app && app.status === 'rejected' && (
                      <div className="text-xs text-red-500">Rejected</div>
                    )}
                    {app && app.status === 'accepted' && (
                      <div className="text-xs text-green-600">Assigned</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

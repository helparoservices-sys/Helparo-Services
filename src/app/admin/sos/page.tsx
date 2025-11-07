'use server'

import { createClient } from '@/lib/supabase/server'

export default async function AdminSOSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  const { data: alerts } = await supabase.rpc('get_active_sos_alerts')

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold">Active SOS Alerts</h1>
        <p className="text-sm text-muted-foreground">Monitor and respond to safety incidents.</p>
        <div className="space-y-4">
          {(alerts || []).map((a: any) => (
            <div key={a.id} className="rounded-md border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.alert_type} • {a.status}</div>
                  <div className="text-xs text-muted-foreground">{a.address || `${a.latitude}, ${a.longitude}`}</div>
                  <div className="text-xs">Elapsed: {a.time_elapsed_minutes} min</div>
                </div>
                <div className="flex gap-2 text-xs">
                  <form action={async () => { await supabase.rpc('acknowledge_sos_alert', { p_alert_id: a.id } as any) }}>
                    <button className="px-2 py-1 rounded bg-yellow-100 hover:bg-yellow-200">Ack</button>
                  </form>
                  <form action={async () => { await supabase.rpc('resolve_sos_alert', { p_alert_id: a.id } as any) }}>
                    <button className="px-2 py-1 rounded bg-green-100 hover:bg-green-200">Resolve</button>
                  </form>
                </div>
              </div>
              <p className="text-xs mt-2">{a.description}</p>
            </div>
          ))}
          {(!alerts || alerts.length === 0) && <p className="text-sm text-muted-foreground">No active alerts.</p>}
        </div>
      </div>
    </div>
  )
}

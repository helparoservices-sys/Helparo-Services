'use server'
import { createClient } from '@/lib/supabase/server'

export default async function HelperSOSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>

  const { data: myAlerts } = await supabase
    .from('sos_alerts')
    .select('id, alert_type, status, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>My SOS Alerts</h1>
        <div className='space-y-3'>
          {(myAlerts || []).map(a => (
            <div key={a.id} className='rounded border bg-white p-3'>
              <div className='flex items-center justify-between'>
                <div className='font-medium'>{a.alert_type} • {a.status}</div>
                {a.status === 'active' && (
                  <form action={async () => { await supabase.rpc('cancel_sos_alert', { p_alert_id: a.id } as any) }}>
                    <button className='text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200'>Cancel</button>
                  </form>
                )}
              </div>
              <p className='text-xs mt-1'>{a.description}</p>
              <div className='text-[10px] text-muted-foreground'>{new Date(a.created_at).toLocaleString()}</div>
            </div>
          ))}
          {(!myAlerts || myAlerts.length === 0) && <p className='text-sm text-muted-foreground'>No SOS alerts.</p>}
        </div>
        <form action={async (formData: FormData) => {
          const alertType = formData.get('alert_type') as string
          const desc = formData.get('description') as string
          if (alertType && desc) {
            await supabase.rpc('create_sos_alert', { p_alert_type: alertType, p_latitude: 0, p_longitude: 0, p_description: desc } as any)
          }
        }} className='rounded border bg-white p-4 space-y-3'>
          <div className='text-sm font-medium'>Create SOS Alert</div>
          <div className='flex flex-col gap-2'>
            <select name='alert_type' className='border rounded px-2 py-1 text-xs'>
              <option value='emergency'>Emergency</option>
              <option value='safety_concern'>Safety Concern</option>
              <option value='dispute'>Dispute</option>
              <option value='harassment'>Harassment</option>
              <option value='other'>Other</option>
            </select>
            <textarea name='description' className='border rounded px-2 py-1 text-xs min-h-[70px]' placeholder='Describe the situation' />
            <button className='text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200'>Submit Alert</button>
          </div>
        </form>
      </div>
    </div>
  )
}

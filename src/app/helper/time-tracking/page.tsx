'use server'
import { createClient } from '@/lib/supabase/server'

export default async function HelperTimeTrackingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>

  // Assigned active jobs
  const { data: requests } = await supabase
    .from('service_requests')
    .select('id, title, job_started_at, job_completed_at, arrival_time, status')
    .eq('assigned_helper_id', user.id)
    .in('status', ['assigned','completed'] as any)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>Time Tracking</h1>
        <p className='text-sm text-muted-foreground'>Manage job start, arrival and completion.</p>
        <div className='space-y-4'>
          {(requests || []).map(r => (
            <div key={r.id} className='rounded border bg-white p-4'>
              <div className='font-medium mb-1'>{r.title}</div>
              <div className='text-xs text-muted-foreground mb-2'>Status: {r.status}</div>
              <div className='grid grid-cols-2 gap-2 text-[11px]'>
                <div>Arrived: {r.arrival_time ? new Date(r.arrival_time).toLocaleString() : '—'}</div>
                <div>Started: {r.job_started_at ? new Date(r.job_started_at).toLocaleString() : '—'}</div>
                <div>Completed: {r.job_completed_at ? new Date(r.job_completed_at).toLocaleString() : '—'}</div>
              </div>
              <div className='flex gap-2 mt-3'>
                {!r.arrival_time && r.status === 'assigned' && (
                  <form action={async () => { await supabase.rpc('record_arrival', { p_request_id: r.id } as any) }}>
                    <button className='px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200'>Record Arrival</button>
                  </form>
                )}
                {!r.job_started_at && r.status === 'assigned' && (
                  <form action={async () => { await supabase.rpc('start_job', { p_request_id: r.id } as any) }}>
                    <button className='px-2 py-1 text-xs rounded bg-green-100 hover:bg-green-200'>Start Job</button>
                  </form>
                )}
                {r.job_started_at && !r.job_completed_at && r.status === 'assigned' && (
                  <form action={async () => { await supabase.rpc('complete_job', { p_request_id: r.id } as any) }}>
                    <button className='px-2 py-1 text-xs rounded bg-purple-100 hover:bg-purple-200'>Complete Job</button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {(!requests || requests.length === 0) && <p className='text-sm text-muted-foreground'>No active jobs.</p>}
        </div>
      </div>
    </div>
  )
}

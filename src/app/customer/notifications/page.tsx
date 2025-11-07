'use server'
import { createClient } from '@/lib/supabase/server'

export default async function CustomerNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>

  const { data: items } = await supabase
    .from('notifications')
    .select('id, title, body, channel, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>Notifications</h1>
        <div className='space-y-3'>
          {(items || []).map(n => (
            <div key={n.id} className='rounded border bg-white p-3 flex items-center justify-between'>
              <div>
                <div className='font-medium'>{n.title}</div>
                <div className='text-xs text-muted-foreground'>{n.body}</div>
                <div className='text-[10px]'>{n.channel} • {n.status}</div>
              </div>
              <form action={async () => { await supabase.rpc('mark_notification_read', { p_notification_id: n.id } as any) }}>
                <button className='text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200'>Mark Read</button>
              </form>
            </div>
          ))}
          {(!items || items.length === 0) && <p className='text-sm text-muted-foreground'>No notifications.</p>}
        </div>
      </div>
    </div>
  )
}

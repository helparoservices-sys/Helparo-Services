'use server'
import { createClient } from '@/lib/supabase/server'

export default async function AdminNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6'>Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className='p-6'>Unauthorized</div>

  const { data: templates } = await supabase.from('notification_templates').select('id, code, channel, title').order('code')

  return (
    <div className='min-h-screen bg-primary-50 py-10 px-4'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <h1 className='text-3xl font-bold'>Notification Templates</h1>
        <p className='text-sm text-muted-foreground'>Manage and preview system notification templates.</p>
        <div className='space-y-3'>
          {(templates || []).map(t => (
            <div key={t.id} className='flex items-center justify-between rounded border bg-white p-3'>
              <div>
                <div className='font-medium'>{t.code}</div>
                <div className='text-xs text-muted-foreground'>{t.channel} • {t.title}</div>
              </div>
              <div className='flex gap-2 text-xs'>
                <form action={async () => { await supabase.rpc('enqueue_notification', { p_template_code: t.code, p_channel: t.channel, p_target_user_id: user.id, p_payload: { preview: true } } as any) }}>
                  <button className='px-2 py-1 rounded bg-blue-100 hover:bg-blue-200'>Send Test</button>
                </form>
              </div>
            </div>
          ))}
          {(!templates || templates.length === 0) && <p className='text-sm text-muted-foreground'>No templates defined.</p>}
        </div>
      </div>
    </div>
  )
}

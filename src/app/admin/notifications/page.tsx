'use server'
import { createClient } from '@/lib/supabase/server'
import { Bell, Mail, MessageSquare, Send, Smartphone, CheckCircle } from 'lucide-react'

export default async function AdminNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className='p-6 text-center'>Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className='p-6 text-center'>Unauthorized</div>

  const { data: templates } = await supabase.from('notification_templates').select('id, code, channel, title').order('code')

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-5 w-5" />
      case 'sms': return <Smartphone className="h-5 w-5" />
      case 'push': return <Bell className="h-5 w-5" />
      case 'in_app': return <MessageSquare className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      case 'sms': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      case 'push': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
      case 'in_app': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
      default: return 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400'
    }
  }

  // Calculate stats
  const totalTemplates = templates?.length || 0
  const emailTemplates = templates?.filter(t => t.channel === 'email').length || 0
  const smsTemplates = templates?.filter(t => t.channel === 'sms').length || 0
  const pushTemplates = templates?.filter(t => t.channel === 'push').length || 0

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Notification Templates</h1>
        <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>Manage and preview system notification templates</p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Total Templates</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{totalTemplates}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg'>
              <Bell className='h-6 w-6 text-blue-600 dark:text-blue-400' />
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Email Templates</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{emailTemplates}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg'>
              <Mail className='h-6 w-6 text-blue-600 dark:text-blue-400' />
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>SMS Templates</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{smsTemplates}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg'>
              <Smartphone className='h-6 w-6 text-green-600 dark:text-green-400' />
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Push Templates</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{pushTemplates}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg'>
              <MessageSquare className='h-6 w-6 text-purple-600 dark:text-purple-400' />
            </div>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className='space-y-3'>
        {(templates || []).map(t => (
          <div key={t.id} className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6 hover:shadow-xl transition-shadow'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className={`w-12 h-12 rounded-lg ${getChannelColor(t.channel)} flex items-center justify-center shadow-lg`}>
                  {getChannelIcon(t.channel)}
                </div>
                <div>
                  <div className='font-medium text-lg text-slate-900 dark:text-white'>{t.code}</div>
                  <div className='text-sm text-slate-600 dark:text-slate-400'>{t.title}</div>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getChannelColor(t.channel)}`}>
                    {t.channel}
                  </span>
                </div>
              </div>
              <div className='flex gap-2'>
                <form action={async () => { 
                  'use server'
                  await supabase.rpc('enqueue_notification', { 
                    p_template_code: t.code, 
                    p_channel: t.channel, 
                    p_target_user_id: user.id, 
                    p_payload: { preview: true } 
                  } as any) 
                }}>
                  <button className='inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors'>
                    <Send className='h-4 w-4' />
                    Send Test
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(!templates || templates.length === 0) && (
          <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-12 text-center'>
            <Bell className='h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-2'>No Templates Defined</h3>
            <p className='text-sm text-slate-500 dark:text-slate-400'>Create notification templates to engage with users</p>
          </div>
        )}
      </div>
    </div>
  )
}

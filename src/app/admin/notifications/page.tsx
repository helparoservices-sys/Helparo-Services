'use server'
import { createClient } from '@/lib/supabase/server'
import NotificationTemplatesClient from '@/components/admin/notification-templates-client'

export default async function AdminNotificationsPage() {
  const supabase = await createClient()
  
  // Get current user for test notifications
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: templates } = await supabase
    .from('notification_templates')
    .select('id, template_key, channel, title, body, is_active, created_at')
    .order('created_at', { ascending: false })

  // Calculate stats
  const totalTemplates = templates?.length || 0
  const emailTemplates = templates?.filter(t => t.channel === 'email').length || 0
  const smsTemplates = templates?.filter(t => t.channel === 'sms').length || 0
  const pushTemplates = templates?.filter(t => t.channel === 'push').length || 0
  const inAppTemplates = templates?.filter(t => t.channel === 'in_app').length || 0

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-6'>
        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Total Templates</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{totalTemplates}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg'>
              <div className='h-6 w-6 text-blue-600 dark:text-blue-400'>📋</div>
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>In-App</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{inAppTemplates}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg'>
              <div className='h-6 w-6 text-orange-600 dark:text-orange-400'>💬</div>
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Email</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{emailTemplates}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg'>
              <div className='h-6 w-6 text-blue-600 dark:text-blue-400'>📧</div>
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>SMS</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{smsTemplates}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg'>
              <div className='h-6 w-6 text-green-600 dark:text-green-400'>📱</div>
            </div>
          </div>
        </div>

        <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Push</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{pushTemplates}</p>
            </div>
            <div className='w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg'>
              <div className='h-6 w-6 text-purple-600 dark:text-purple-400'>🔔</div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Management */}
      <NotificationTemplatesClient templates={templates || []} />
    </div>
  )
}

'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bell, ArrowLeft, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default async function AdminNotificationsList() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Fetch actual notifications for the admin user
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all as read action
  const markAllAsRead = async () => {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
  }

  const getStatusIcon = (status: string, readAt: string | null) => {
    if (readAt) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (status === 'sent') return <CheckCircle2 className="h-4 w-4 text-blue-500" />
    if (status === 'failed') return <AlertCircle className="h-4 w-4 text-red-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getChannelBadge = (channel: string) => {
    const colors = {
      email: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      sms: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      push: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      in_app: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[channel as keyof typeof colors] || colors.in_app}`}>
        {channel}
      </span>
    )
  }

  const unreadCount = notifications?.filter(n => !n.read_at).length || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">All Notifications</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {unreadCount > 0 && `${unreadCount} unread notifications`}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link
            href="/admin/notifications"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Manage Templates
          </Link>
          
          {unreadCount > 0 && (
            <form action={markAllAsRead}>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                <CheckCircle2 className="h-4 w-4" />
                Mark All Read
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
        {notifications && notifications.length > 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  !notification.read_at ? 'bg-blue-50/30 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(notification.status, notification.read_at)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {notification.title && (
                          <div className="flex items-center gap-2 mb-1">
                            {!notification.read_at && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                              {notification.title}
                            </h3>
                          </div>
                        )}
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {notification.body}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {new Date(notification.created_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Kolkata'
                            })}
                          </span>
                          
                          {getChannelBadge(notification.channel)}
                          
                          <span className="capitalize">
                            {notification.status}
                          </span>
                          
                          {notification.read_at && (
                            <span>
                              Read {new Date(notification.read_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Kolkata'
                              })}
                            </span>
                          )}
                        </div>
                        
                        {notification.error && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                            Error: {notification.error}
                          </div>
                        )}
                        
                        {notification.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                              View Data
                            </summary>
                            <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
                              {JSON.stringify(notification.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Bell className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Notifications</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              You haven&apos;t received any notifications yet
            </p>
            <Link
              href="/admin/notifications"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Bell className="h-4 w-4" />
              Manage Templates
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
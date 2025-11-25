'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Bell, Check, CheckCheck, Trash2, Settings, Filter, Mail, Smartphone, MessageSquare } from 'lucide-react'

interface Notification {
  id: string
  title: string
  body: string
  channel: string
  status: string
  data: any
  created_at: string
  read_at: string | null
  request_id?: string
}

export default function CustomerNotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
    subscribeToNotifications()
  }, [filter])

  const loadNotifications = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter === 'unread') {
      query = query.is('read_at', null)
    }

    const { data } = await query

    if (data) {
      setNotifications(data)
    }

    setLoading(false)
  }

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    )
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)

    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
    )
  }

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-5 w-5 text-green-600" />
      case 'sms':
        return <MessageSquare className="h-5 w-5 text-orange-600" />
      case 'push':
        return <Smartphone className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-purple-600" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <Link
          href="/customer/notifications/preferences"
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Settings className="h-5 w-5" />
          Preferences
        </Link>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading notifications...</p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <Bell className="h-16 w-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {filter === 'unread'
              ? 'You\'re all caught up! Check back later for updates.'
              : 'You haven\'t received any notifications yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white dark:bg-slate-800 rounded-xl p-4 border transition-all ${
                notification.read_at
                  ? 'border-slate-200 dark:border-slate-700'
                  : 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getChannelIcon(notification.channel)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {notification.title}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(notification.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {notification.body}
                  </p>

                  <div className="flex items-center gap-2">
                    {!notification.read_at && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Mark as Read
                      </button>
                    )}

                    {notification.request_id && (
                      <Link
                        href={`/customer/requests/${notification.request_id}`}
                        className="px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      >
                        View Request
                      </Link>
                    )}

                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="ml-auto flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


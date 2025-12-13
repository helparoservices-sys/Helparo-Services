'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  PartyPopper,
  Clock,
  AlertCircle,
  Gift,
  Zap,
  ExternalLink
} from 'lucide-react'

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
    const cleanup = subscribeToNotifications()
    return cleanup
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

  const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('helper found') || lowerTitle.includes('accepted')) {
      return <PartyPopper className="h-5 w-5 text-emerald-500" />
    }
    if (lowerTitle.includes('broadcast') || lowerTitle.includes('sent')) {
      return <Zap className="h-5 w-5 text-blue-500" />
    }
    if (lowerTitle.includes('payment') || lowerTitle.includes('wallet')) {
      return <Gift className="h-5 w-5 text-purple-500" />
    }
    if (lowerTitle.includes('reminder') || lowerTitle.includes('scheduled')) {
      return <Clock className="h-5 w-5 text-amber-500" />
    }
    if (lowerTitle.includes('alert') || lowerTitle.includes('urgent')) {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }
    return <Bell className="h-5 w-5 text-emerald-500" />
  }

  const getNotificationBgColor = (title: string, isRead: boolean) => {
    if (isRead) return 'bg-white'
    
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('helper found') || lowerTitle.includes('accepted')) {
      return 'bg-emerald-50 border-emerald-200'
    }
    if (lowerTitle.includes('broadcast')) {
      return 'bg-blue-50 border-blue-200'
    }
    return 'bg-amber-50 border-amber-200'
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              {unreadCount > 0 && (
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  {unreadCount} New
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2">Notifications</h1>
            <p className="text-emerald-100 max-w-md">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'You\'re all caught up! 🎉'}
            </p>
          </div>
          
          <Link
            href="/customer/notifications/preferences"
            className="hidden md:flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl font-semibold hover:bg-white/30 transition-all"
          >
            <Settings className="h-5 w-5" />
            Preferences
          </Link>
        </div>
      </div>

      {/* Mobile Preferences Button */}
      <Link
        href="/customer/notifications/preferences"
        className="md:hidden flex items-center justify-between w-full px-5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Settings className="h-5 w-5 text-gray-600" />
          </div>
          <span className="font-semibold text-gray-900">Notification Preferences</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                filter === 'unread'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl font-semibold transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gray-100 flex items-center justify-center">
            <Bell className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {filter === 'unread' ? 'All Caught Up! 🎉' : 'No Notifications Yet'}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You\'ve read all your notifications. Check back later for updates!'
              : 'When you receive notifications, they\'ll appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${getNotificationBgColor(notification.title, !!notification.read_at)}`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                  notification.read_at ? 'bg-gray-100' : 'bg-white shadow-sm'
                }`}>
                  {getNotificationIcon(notification.title)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className={`font-bold ${notification.read_at ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    <span className={`text-xs whitespace-nowrap px-2.5 py-1 rounded-full font-medium ${
                      notification.read_at 
                        ? 'bg-gray-100 text-gray-500' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {new Date(notification.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className={`text-sm mb-4 ${notification.read_at ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.body}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {!notification.read_at && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark as Read
                      </button>
                    )}

                    {notification.data?.request_id && (
                      <Link
                        href={`/customer/requests/${notification.data.request_id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Request
                      </Link>
                    )}

                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Tips */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Pro Tip</h4>
              <p className="text-sm text-gray-600">
                Customize your notification preferences to receive only the updates that matter most to you.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


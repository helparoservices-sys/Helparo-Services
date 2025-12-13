/**
 * Real-Time Notifications System
 * Live updates for critical user events
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Bell, MessageSquare, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type NotificationType = 
  | 'new_message' 
  | 'new_bid' 
  | 'bid_accepted' 
  | 'payment_received' 
  | 'service_completed'
  | 'review_received'
  | 'sos_alert'
  | 'verification_approved'

export interface RealtimeNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  timestamp: Date
  read: boolean
}

/**
 * Real-time notifications hook
 */
export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load initial notifications
  useEffect(() => {
    if (!userId) return

    const loadNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        const formatted = data.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          timestamp: new Date(n.created_at),
          read: n.read,
        }))
        setNotifications(formatted)
        setUnreadCount(formatted.filter(n => !n.read).length)
      }
    }

    loadNotifications()
  }, [userId])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return

    // Subscribe to notifications table
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification: RealtimeNotification = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            link: payload.new.link,
            timestamp: new Date(payload.new.created_at),
            read: false,
          }

          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)

          // Show browser notification
          showBrowserNotification(newNotification)

          // Play notification sound
          playNotificationSound()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [userId])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}

/**
 * Real-time messages hook
 */
export function useRealtimeMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!conversationId) return

    // Load existing messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return { messages, isTyping }
}

/**
 * Real-time bid updates hook
 */
export function useRealtimeBids(requestId: string | undefined) {
  const [bids, setBids] = useState<any[]>([])
  const [newBidCount, setNewBidCount] = useState(0)

  useEffect(() => {
    if (!requestId) return

    // Load existing bids
    const loadBids = async () => {
      const { data } = await supabase
        .from('request_applications')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })

      if (data) setBids(data)
    }

    loadBids()

    // Subscribe to new bids
    const channel = supabase
      .channel(`bids:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_applications',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setBids(prev => [payload.new, ...prev])
          setNewBidCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId])

  return { bids, newBidCount }
}

/**
 * Show browser notification
 */
function showBrowserNotification(notification: RealtimeNotification) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/logo.svg',
      badge: '/logo.svg',
      tag: notification.id,
    })
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return Notification.permission === 'granted'
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {
      // Ignore errors (browser may block autoplay)
    })
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get notification icon
 */
export function getNotificationIcon(type: NotificationType) {
  const icons = {
    new_message: MessageSquare,
    new_bid: DollarSign,
    bid_accepted: CheckCircle,
    payment_received: DollarSign,
    service_completed: CheckCircle,
    review_received: Bell,
    sos_alert: AlertCircle,
    verification_approved: CheckCircle,
  }
  return icons[type] || Bell
}

/**
 * Notification Center Component
 */
export function NotificationCenter({ userId }: { userId: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications(userId)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border max-h-[500px] overflow-y-auto z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => {
                const Icon = getNotificationIcon(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

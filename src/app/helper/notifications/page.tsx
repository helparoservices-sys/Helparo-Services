'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperNotifications, markNotificationRead, markAllAsRead } from '@/app/actions/helper-notifications'
import { Bell, Check, CheckCheck, DollarSign, Briefcase, MessageSquare, AlertCircle, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  body: string
  channel: string
  status: string
  created_at: string
}

export default function HelperNotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const result = await getHelperNotifications()

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setNotifications(result.data.notifications)
    }

    setLoading(false)
  }

  const handleMarkRead = async (id: string) => {
    const result = await markNotificationRead(id)

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      loadData()
    }
  }

  const handleMarkAllRead = async () => {
    const result = await markAllAsRead()

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('All notifications marked as read')
      loadData()
    }
  }

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, React.ReactNode> = {
      jobs: <Briefcase className="h-5 w-5 text-blue-600" />,
      payments: <DollarSign className="h-5 w-5 text-green-600" />,
      messages: <MessageSquare className="h-5 w-5 text-purple-600" />,
      system: <AlertCircle className="h-5 w-5 text-orange-600" />,
    }
    return icons[channel] || <Bell className="h-5 w-5 text-gray-600" />
  }

  const unreadCount = notifications.filter(n => n.status !== 'read').length
  const filteredNotifications = filter === 'all'
    ? notifications
    : filter === 'unread'
    ? notifications.filter(n => n.status !== 'read')
    : notifications.filter(n => n.channel === filter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllRead} variant="outline" className="gap-2">
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'jobs' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('jobs')}
                className="gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Jobs
              </Button>
              <Button
                variant={filter === 'payments' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('payments')}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Payments
              </Button>
              <Button
                variant={filter === 'messages' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('messages')}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Messages
              </Button>
              <Button
                variant={filter === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('system')}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle>
              {filter === 'all'
                ? 'All Notifications'
                : filter === 'unread'
                ? 'Unread Notifications'
                : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Notifications`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">No notifications</p>
                <p className="text-sm text-gray-500 mt-2">
                  {filter === 'unread'
                    ? 'All caught up!'
                    : 'Your notifications will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border transition-all ${
                      notification.status === 'read'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        notification.status === 'read' ? 'bg-gray-200' : 'bg-white'
                      }`}>
                        {getChannelIcon(notification.channel)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h4 className={`font-semibold ${
                            notification.status === 'read' ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          {notification.status !== 'read' && (
                            <div className="h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0 mt-2" />
                          )}
                        </div>

                        <p className={`text-sm mb-2 ${
                          notification.status === 'read' ? 'text-gray-600' : 'text-gray-700'
                        }`}>
                          {notification.body}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="capitalize">{notification.channel}</span>
                            <span>•</span>
                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                          </div>

                          {notification.status !== 'read' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkRead(notification.id)}
                              className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              <Check className="h-4 w-4" />
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

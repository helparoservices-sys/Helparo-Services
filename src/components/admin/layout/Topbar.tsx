'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  User,
  LogOut,
  Settings,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast-notification'
import { useDarkMode } from '@/lib/use-dark-mode'

interface TopbarProps {
  onToggleSidebar: () => void
}

interface Notification {
  id: string
  title: string | null
  body: string
  created_at: string
  read_at: string | null
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter()
  const { showError } = useToast()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let userId: string | null = null
    
    // Get user info and notifications once
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        setUserEmail(user.email || '')
        fetchNotifications(user.id)
      }
    }
    init()

    // Use Realtime instead of polling for notifications - filtered by user
    const channel = userId ? supabase
      .channel(`admin-notifications-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, () => {
        // Refetch notifications when any change happens
        fetchNotifications(userId)
      })
      .subscribe() : null

    // Handle click outside to close dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.notification-dropdown')) {
        setShowNotifications(false)
      }
      if (!target.closest('.profile-dropdown')) {
        setShowProfile(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      if (channel) supabase.removeChannel(channel)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchNotifications = async (userId: string) => {
    try {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('id, title, body, created_at, read_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (notifs) {
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.read_at).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // First, call server-side logout to clear server cookies
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Sign out from Supabase client-side
      await supabase.auth.signOut()
      
      // Clear all local storage and session storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear all cookies (including auth cookies)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always redirect to login, even if signOut fails
      // Use window.location.href for a full page reload to clear all state
      window.location.href = '/auth/login'
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/50 shadow-lg z-50">
      {/* Spacer for status bar */}
      <div className="h-8" />
      {/* Main header content */}
      <div className="flex items-center justify-between h-14 px-4 gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
              <Image
                src="/logo.svg"
                alt="Helparo"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  img.style.display = 'none'
                  const fallback = document.getElementById('topbar-logo-fallback')
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div id="topbar-logo-fallback" style={{ display: 'none' }} className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white hidden sm:block">
              Helparo Admin
            </span>
          </Link>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={(e) => e.preventDefault()} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              id="admin-search"
              name="admin-search"
              placeholder="Search users, bookings, transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative notification-dropdown">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className={`h-5 w-5 text-slate-700 dark:text-slate-300 transition-all ${unreadCount > 0 ? 'animate-bounce text-red-500 dark:text-red-400' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{unreadCount} unread</p>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-all ${
                          !notif.read_at ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => !notif.read_at && markAsRead(notif.id)}
                      >
                        {notif.title && (
                          <div className="flex items-center gap-2">
                            {!notif.read_at && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{notif.title}</p>
                          </div>
                        )}
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notif.body}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          {new Date(notif.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Kolkata'
                          })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">No notifications yet</p>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-center">
                  <Link
                    href="/admin/notifications/all"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    onClick={() => setShowNotifications(false)}
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative profile-dropdown">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden lg:block">
                Admin
              </span>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-sm">Administrator</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                </div>
                <div className="p-2">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>
                <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        Logout
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

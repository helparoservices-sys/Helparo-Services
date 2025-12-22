'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Bell, LogOut, Settings, Moon, Sun, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useDarkMode } from '@/lib/use-dark-mode'

interface TopbarProps {
  onToggleSidebar: () => void
}

export default function CustomerTopbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [balance, setBalance] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Fetch user profile for name and phone
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserName(profile.full_name || '')
          // Format phone for display (mask middle digits)
          if (profile.phone) {
            const phone = profile.phone.replace(/\D/g, '')
            if (phone.length >= 10) {
              const last4 = phone.slice(-4)
              const first2 = phone.slice(0, 2)
              setUserPhone(`+91 ${first2}XXXXXX${last4}`)
            } else {
              setUserPhone(profile.phone)
            }
          }
        }
        
        // Fetch wallet balance
        const { data: wallet } = await supabase
          .from('wallet_accounts')
          .select('available_balance')
          .eq('user_id', user.id)
          .single()
        if (wallet) setBalance(Number(wallet.available_balance))
        
        // Fetch unread notifications count
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .is('read_at', null)
        setUnreadCount(notifications?.length || 0)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 z-50">
      {/* Spacer for status bar */}
      <div className="h-8" />
      {/* Main header content */}
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <Link href="/customer/dashboard" className="flex items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">helparo</span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <Link
            href="/customer/notifications"
            className="relative flex items-center justify-center w-10 h-10 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {userName || 'My Account'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userPhone || 'Customer Account'}
                  </p>
                </div>
                
                <Link
                  href="/customer/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  Moon,
  Sun,
  Shield,
  Wallet
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useDarkMode } from '@/lib/use-dark-mode'

interface HelperTopbarProps {
  onToggleSidebar: () => void
}

export default function HelperTopbar({ onToggleSidebar }: HelperTopbarProps) {
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [balance, setBalance] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single()

      const { data: helperProfile } = await supabase
        .from('helper_profiles')
        .select('is_approved')
        .eq('user_id', user.id)
        .single()

      // Fetch wallet balance
      const { data: wallet } = await supabase
        .from('wallet_accounts')
        .select('available_balance')
        .eq('user_id', user.id)
        .single()

      // Set display name - never show internal email
      setUserName(profile?.full_name || 'Helper')
      
      // Format phone for display (mask middle digits)
      if (profile?.phone) {
        const phone = profile.phone.replace(/\D/g, '')
        if (phone.length >= 10) {
          const last4 = phone.slice(-4)
          const first2 = phone.slice(0, 2)
          setUserPhone(`+91 ${first2}XXXXXX${last4}`)
        } else {
          setUserPhone(profile.phone)
        }
      }
      
      setIsVerified(helperProfile?.is_approved || false)
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

  const handleLogout = async () => {
    try {
      // First, call server-side logout to clear server cookies
      await fetch('/api/auth/logout', { method: 'POST' })
      // Also sign out client-side
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      localStorage.clear()
      sessionStorage.clear()
      // Always redirect to login with full page reload
      window.location.href = '/auth/login'
    }
  }

  // Focus the cancel button when confirmation opens for better accessibility
  useEffect(() => {
    if (showLogoutConfirm && cancelButtonRef.current) {
      cancelButtonRef.current.focus()
    }
  }, [showLogoutConfirm])

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50">
      {/* Spacer for status bar */}
      <div className="h-8" />
      {/* Main header content */}
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>

          <Link href="/helper/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Helparo" className="w-8 h-8 rounded-lg shadow-md" />
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hidden md:block">
              Helparo Helper
            </span>
          </Link>

          {isVerified && (
            <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
              <Shield className="h-3 w-3" />
              Verified
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-center w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600" />
            )}
          </button>

          {/* Notifications */}
          <Link
            href="/helper/notifications"
            className="relative flex items-center justify-center w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </Link>

          {/* === HIDDEN FOR PLAY STORE DEPLOYMENT - WALLET ===
          * TODO: Uncomment when payment integration is complete
          <Link
            href="/helper/wallet"
            className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-semibold">₹{balance.toFixed(2)}</span>
          </Link>
          === END HIDDEN WALLET === */}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{userName || 'My Account'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{userPhone || 'Helper Account'}</p>
                  </div>

                  <Link
                    href="/helper/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <Link
                    href="/helper/verification"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Verification Status
                  </Link>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      setShowLogoutConfirm(true)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div>
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Are you sure you want to log out?</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">You will need to sign in again to access your helper dashboard.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false)
                  await handleLogout()
                }}
                className="w-full sm:w-auto rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

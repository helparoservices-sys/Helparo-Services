'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Bell, User, LogOut, Settings, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface TopbarProps {
  onToggleSidebar: () => void
}

export default function CustomerTopbar({ onToggleSidebar }: TopbarProps) {
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Fetch wallet balance
        const { data: wallet } = await supabase
          .from('wallet_accounts')
          .select('available_balance')
          .eq('user_id', user.id)
          .single()
        if (wallet) setBalance(Number(wallet.available_balance))
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </button>
          
          <Link href="/customer/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              H
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Helparo
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* === HIDDEN FOR PLAY STORE DEPLOYMENT - WALLET BALANCE ===
          * TODO: Uncomment when payment integration is complete
          <Link 
            href="/customer/wallet"
            className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-semibold">₹{balance.toFixed(2)}</span>
          </Link>
          === END HIDDEN WALLET === */}

          {/* Notifications */}
          <Link
            href="/customer/notifications"
            className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Customer</p>
                </div>
                
                <Link
                  href="/customer/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
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

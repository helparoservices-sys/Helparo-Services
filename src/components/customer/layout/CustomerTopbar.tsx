'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Bell, LogOut, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface TopbarProps {
  onToggleSidebar: () => void
}

export default function CustomerTopbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter()
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
    router.push('/auth/login')
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="safe-area-bar bg-white" />
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          
          <Link href="/customer/dashboard" className="flex items-center">
            <span className="text-lg font-bold text-gray-900">helparo</span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Link
            href="/customer/notifications"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">Customer Account</p>
                </div>
                
                <Link
                  href="/customer/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                  Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
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
    </div>
  )
}

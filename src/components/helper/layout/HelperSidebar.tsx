'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Search,
  Briefcase,
  Wallet,
  Clock,
  Star,
  Bell,
  Shield,
  Award,
  Users,
  Video,
  FileText,
  TrendingUp,
  Gift,
  Phone,
  Lock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HelperSidebarProps {
  collapsed: boolean
}

export default function HelperSidebar({ collapsed }: HelperSidebarProps) {
  const pathname = usePathname()
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    checkVerification()
  }, [])

  const checkVerification = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data: profile } = await supabase
      .from('helper_profiles')
      .select('is_approved')
      .eq('user_id', user.id)
      .single()

    setIsVerified(profile?.is_approved === true)
  }

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/helper/dashboard',
      requiresVerification: false
    },
    {
      label: 'Browse Requests',
      icon: Search,
      href: '/helper/requests',
      requiresVerification: true
    },
    {
      label: 'My Jobs',
      icon: Briefcase,
      href: '/helper/assigned',
      requiresVerification: true
    },
    {
      label: 'Wallet',
      icon: Wallet,
      href: '/helper/wallet',
      requiresVerification: true
    },
    {
      label: 'Time Tracking',
      icon: Clock,
      href: '/helper/time-tracking',
      requiresVerification: true
    },
    {
      label: 'Ratings & Reviews',
      icon: Star,
      href: '/helper/ratings',
      requiresVerification: true
    },
    {
      label: 'My Services',
      icon: FileText,
      href: '/helper/services',
      requiresVerification: false
    },
    {
      label: 'Subscriptions',
      icon: TrendingUp,
      href: '/helper/subscriptions',
      requiresVerification: true
    },
    {
      label: 'Verification',
      icon: Shield,
      href: '/helper/verification',
      requiresVerification: false
    },
    {
      label: 'Emergency SOS',
      icon: Phone,
      href: '/helper/sos',
      requiresVerification: true
    },
    {
      label: 'Gamification',
      icon: Award,
      href: '/helper/gamification',
      requiresVerification: true
    },
    {
      label: 'Video Calls',
      icon: Video,
      href: '/helper/video-calls',
      requiresVerification: true
    },
    {
      label: 'Notifications',
      icon: Bell,
      href: '/helper/notifications',
      requiresVerification: false
    },
    {
      label: 'Trust Score',
      icon: Users,
      href: '/helper/trust-score',
      requiresVerification: true
    },
    {
      label: 'Referrals',
      icon: Gift,
      href: '/helper/referrals',
      requiresVerification: false
    },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const isLocked = item.requiresVerification && !isVerified

            if (isLocked) {
              return (
                <div
                  key={item.href}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                  title={collapsed ? `${item.label} - Verification Required` : 'Verification Required'}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium truncate flex-1">
                        {item.label}
                      </span>
                      <Lock className="h-3 w-3" />
                    </>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
                title={collapsed ? item.label : ''}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

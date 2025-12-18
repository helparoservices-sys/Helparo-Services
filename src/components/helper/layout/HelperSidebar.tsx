'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Search,
  Briefcase,
  Clock,
  Star,
  Award,
  Users,
  Video,
  FileText,
  TrendingUp,
  Gift,
  Phone,
  Lock,
  DollarSign,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HelperSidebarProps {
  collapsed: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function HelperSidebar({ collapsed, mobileOpen = false, onMobileClose }: HelperSidebarProps) {
  const pathname = usePathname()
  const [isVerified, setIsVerified] = useState(true) // Default to true to avoid flash of locked state
  const [checkingVerification, setCheckingVerification] = useState(true)

  useEffect(() => {
    checkVerification()
  }, [])

  const checkVerification = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setCheckingVerification(false)
      return
    }

    const { data: profile } = await supabase
      .from('helper_profiles')
      .select('is_approved')
      .eq('user_id', user.id)
      .single()

    setIsVerified(profile?.is_approved === true)
    setCheckingVerification(false)
  }

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/helper/dashboard',
      requiresVerification: false
    },
    /* === HIDDEN - JOBS BROWSE PAGE ===
    {
      label: 'Jobs',
      icon: Search,
      href: '/helper/jobs',
      requiresVerification: true
    },
    === END HIDDEN JOBS BROWSE === */
    {
      label: 'My Jobs',
      icon: Briefcase,
      href: '/helper/assigned',
      requiresVerification: true
    },
    {
      label: 'My Services',
      icon: FileText,
      href: '/helper/services',
      requiresVerification: false
    },
    {
      label: 'Ratings',
      icon: Star,
      href: '/helper/ratings',
      requiresVerification: true
    },
    {
      label: 'Achievements',
      icon: Award,
      href: '/helper/gamification',
      requiresVerification: true
    },
    {
      label: 'Referrals',
      icon: Gift,
      href: '/helper/referrals',
      requiresVerification: false
    },
    /* === HIDDEN - TIME TRACKING ===
    {
      label: 'Time Tracking',
      icon: Clock,
      href: '/helper/time-tracking',
      requiresVerification: true
    },
    === END HIDDEN TIME TRACKING === */
    /* === HIDDEN FOR PLAY STORE DEPLOYMENT - SUBSCRIPTIONS ===
    * TODO: Uncomment when payment integration is complete
    {
      label: 'Subscriptions',
      icon: TrendingUp,
      href: '/helper/subscriptions',
      requiresVerification: true
    },
    === END HIDDEN SUBSCRIPTIONS === */
    /* === HIDDEN - VIDEO CALLS ===
    {
      label: 'Video Calls',
      icon: Video,
      href: '/helper/video-calls',
      requiresVerification: true
    },
    === END HIDDEN VIDEO CALLS === */
  ]

  const isActive = (href: string) => pathname === href

  // Render nav items
  const renderNavItems = (isMobile: boolean = false) => (
    <nav className="p-4 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        // Only show locked state after verification check completes and user is NOT verified
        const isLocked = !checkingVerification && item.requiresVerification && !isVerified

        if (isLocked) {
          return (
            <div
              key={item.href}
              className="relative flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
              title={collapsed && !isMobile ? `${item.label} - Verification Required` : 'Verification Required'}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {(isMobile || !collapsed) && (
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
            onClick={isMobile ? onMobileClose : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              active
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            title={collapsed && !isMobile ? item.label : ''}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
            {(isMobile || !collapsed) && (
              <span className="text-sm font-medium truncate">
                {item.label}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out z-40 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {renderNavItems(false)}
        </div>
      </aside>

      {/* Mobile Sidebar - Slides in from left */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Helparo" className="w-9 h-9 rounded-xl" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">Helparo</span>
          </div>
          <button 
            onClick={onMobileClose}
            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="h-[calc(100%-73px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {renderNavItems(true)}
        </div>
      </aside>
    </>
  )
}

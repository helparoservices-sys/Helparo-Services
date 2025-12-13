'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Calendar,
  CreditCard,
  Tag,
  Ticket,
  Headphones,
  FileText,
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shield,
  Gift,
  Video,
  Award,
  CheckCircle,
  ShoppingBag,
  Sparkles,
  MapPin,
  Briefcase,
  X
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    label: 'Users',
    icon: Users,
    href: '/admin/users',
  },
  {
    label: 'Candidates',
    icon: Briefcase,
    href: '/admin/candidates',
  },
  {
    label: 'Providers',
    icon: Store,
    href: '/admin/providers',
  },
  {
    label: 'Services',
    icon: Package,
    href: '/admin/services',
  },
  {
    label: 'Service Areas',
    icon: MapPin,
    href: '/admin/service-areas',
  },
  {
    label: 'Bookings',
    icon: Calendar,
    href: '/admin/bookings',
  },
  {
    label: 'Payments',
    icon: CreditCard,
    href: '/admin/payments',
  },
  {
    label: 'Bundles',
    icon: ShoppingBag,
    href: '/admin/bundles',
  },
  {
    label: 'Subscriptions',
    icon: Sparkles,
    href: '/admin/subscriptions',
  },
  {
    label: 'Promocodes',
    icon: Ticket,
    href: '/admin/promos',
  },
  {
    label: 'Campaigns',
    icon: Gift,
    href: '/admin/campaigns',
  },
  {
    label: 'Referrals',
    icon: Users,
    href: '/admin/referrals',
  },
  {
    label: 'Reviews',
    icon: Award,
    href: '/admin/reviews',
  },
  {
    label: 'Support',
    icon: Headphones,
    href: '/admin/support',
  },
  {
    label: 'Legal',
    icon: FileText,
    href: '/admin/legal',
  },
  {
    label: 'SOS Alerts',
    icon: AlertCircle,
    href: '/admin/sos',
    badge: 'critical',
  },
  {
    label: 'Trust & Safety',
    icon: Shield,
    href: '/admin/trust-safety',
  },
  {
    label: 'Verification',
    icon: CheckCircle,
    href: '/admin/verification',
  },
  {
    label: 'Video Calls',
    icon: Video,
    href: '/admin/video-calls/analytics',
  },
  {
    label: 'Gamification',
    icon: Award,
    href: '/admin/gamification',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
  },
]

export default function Sidebar({ collapsed, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  // Render nav items
  const renderNavItems = (isMobile: boolean = false) => (
    <nav className="p-3 space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={isMobile ? onMobileClose : undefined}
            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50 glow-pulse'
                : 'text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'
            }`}
            title={collapsed && !isMobile ? item.label : ''}
          >
            {/* Icon */}
            <Icon className={`flex-shrink-0 h-5 w-5 ${
              isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
            }`} />
            
            {/* Label */}
            {(isMobile || !collapsed) && (
              <span className="flex-1 font-medium text-sm">
                {item.label}
              </span>
            )}
            
            {/* Badge */}
            {(isMobile || !collapsed) && item.badge && (
              <span className="ml-auto flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full animate-pulse">
                !
              </span>
            )}
            
            {/* Active Indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
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
        className={`hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-800/50 shadow-xl transition-all duration-300 ease-in-out z-40 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Glassmorphism Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/30 dark:from-slate-900/50 dark:to-slate-900/30 backdrop-blur-xl" />
        
        {/* Scrollable Menu */}
        <div className="relative h-full overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-transparent">
          {renderNavItems(false)}
        </div>
      </aside>

      {/* Mobile Sidebar - Slides in from left */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transform transition-transform duration-300 ease-in-out overflow-hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Helparo" className="w-9 h-9 rounded-xl" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">Admin</span>
          </div>
          <button 
            onClick={onMobileClose}
            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Menu */}
        <div className="h-[calc(100%-73px)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-transparent">
          {renderNavItems(true)}
        </div>
      </aside>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </>
  )
}

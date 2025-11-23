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
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Gift,
  Bell,
  Video,
  Award,
  CheckCircle
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
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
    label: 'Referrals',
    icon: Gift,
    href: '/admin/referrals',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
  },
]

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-800/50 shadow-xl transition-all duration-300 ease-in-out z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Glassmorphism Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/30 dark:from-slate-900/50 dark:to-slate-900/30 backdrop-blur-xl" />
      
      {/* Scrollable Menu */}
      <div className="relative h-full overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-transparent">
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50 glow-pulse'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={collapsed ? item.label : ''}
              >
                {/* Icon */}
                <Icon className={`flex-shrink-0 h-5 w-5 ${
                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                }`} />
                
                {/* Label */}
                {!collapsed && (
                  <span className="flex-1 font-medium text-sm">
                    {item.label}
                  </span>
                )}
                
                {/* Badge */}
                {!collapsed && item.badge && (
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
      </div>

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
    </aside>
  )
}

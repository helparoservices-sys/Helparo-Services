'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Search, 
  Calendar, 
  MessageSquare, 
  User,
  Briefcase,
  Wallet,
  Bell,
  Settings,
  ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { hapticImpact, isNativeApp } from '@/lib/capacitor'
import { motion } from 'framer-motion'

// Customer navigation items
const customerNavItems = [
  { href: '/customer/dashboard', icon: Home, label: 'Home' },
  // { href: '/customer/find-helpers', icon: Search, label: 'Find' }, // Temporarily disabled
  { href: '/customer/bookings', icon: Calendar, label: 'Bookings' },
  { href: '/customer/notifications', icon: Bell, label: 'Alerts' },
  { href: '/customer/settings', icon: User, label: 'Profile' },
]

// Helper navigation items
const helperNavItems = [
  { href: '/helper/dashboard', icon: Home, label: 'Home' },
  { href: '/helper/requests', icon: ClipboardList, label: 'Requests' },
  { href: '/helper/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/helper/wallet', icon: Wallet, label: 'Earnings' },
  { href: '/helper/settings', icon: Settings, label: 'Profile' },
]

interface MobileBottomNavProps {
  userType: 'customer' | 'helper'
}

export function MobileBottomNav({ userType }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  
  const navItems = userType === 'customer' ? customerNavItems : helperNavItems

  const handleNavClick = async (href: string) => {
    // Trigger haptic feedback on native app
    if (isNativeApp()) {
      await hapticImpact('light')
    }
    router.push(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient background with blur */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50" />
      
      {/* Safe area padding for devices with home indicator */}
      <div className="relative flex items-center justify-around px-2 pt-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200",
                "active:scale-95 touch-manipulation",
                isActive ? "text-guardian-teal" : "text-gray-500"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-12 h-1 rounded-full bg-guardian-teal"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Icon container */}
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                isActive && "bg-guardian-teal/10"
              )}>
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-all duration-200",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium mt-0.5 transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// Export a hook to detect if bottom nav should be shown
export function useShouldShowBottomNav(): { show: boolean; userType: 'customer' | 'helper' | null } {
  const pathname = usePathname()
  
  if (pathname.startsWith('/customer/')) {
    return { show: true, userType: 'customer' }
  }
  
  if (pathname.startsWith('/helper/')) {
    return { show: true, userType: 'helper' }
  }
  
  return { show: false, userType: null }
}

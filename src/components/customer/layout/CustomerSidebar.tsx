'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  Search, 
  ClipboardList, 
  Wallet, 
  CreditCard,
  Star,
  Gift,
  Users,
  HeadphonesIcon,
  Bell,
  Award,
  Percent,
  Package,
  Sparkles,
  ShoppingBag,
  Video,
  Radio,
  X
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
}


export default function CustomerSidebar({ collapsed, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null)

  // Detect if on a tracking page and get status from sessionStorage
  useEffect(() => {
    if (pathname.match(/^\/customer\/requests\/[^/]+\/track/)) {
      // Try to get status from sessionStorage (set by list page)
      const status = typeof window !== 'undefined' ? window.sessionStorage.getItem('tracking_status') : null
      setTrackingStatus(status)
    } else {
      setTrackingStatus(null)
    }
  }, [pathname])

  const menuSections = [
    {
      title: 'Main',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/customer/dashboard' },
        { icon: Radio, label: 'Active Requests', href: '/customer/active-requests' },
        { icon: ClipboardList, label: 'Past Bookings', href: '/customer/past-bookings' },
      ]
    },
    /* === HIDDEN FOR PLAY STORE DEPLOYMENT - PAYMENT FEATURES === 
    * TODO: Uncomment when payment integration is complete
    {
      title: 'Payments',
      items: [
        { icon: Wallet, label: 'Wallet', href: '/customer/wallet' },
        { icon: CreditCard, label: 'Subscriptions', href: '/customer/subscriptions' },
      ]
    },
    === END HIDDEN PAYMENTS === */
    {
      title: 'Rewards',
      items: [
        /* === HIDDEN FOR PLAY STORE - LOYALTY POINTS ===
        { icon: Star, label: 'Loyalty Points', href: '/customer/loyalty' },
        === END HIDDEN === */
        { icon: Award, label: 'Badges', href: '/customer/badges' },
        { icon: Users, label: 'Referrals', href: '/customer/referrals' },
      ]
    },
    /* === HIDDEN FOR PLAY STORE DEPLOYMENT - DEALS FEATURES ===
    * TODO: Uncomment when payment integration is complete
    {
      title: 'Deals',
      items: [
        { icon: Gift, label: 'Bundles', href: '/customer/bundles' },
        { icon: Sparkles, label: 'Campaigns', href: '/customer/campaigns' },
        { icon: Percent, label: 'Promo Codes', href: '/customer/promos' },
      ]
    },
    === END HIDDEN DEALS === */
    {
      title: 'Other',
      items: [
        { icon: Video, label: 'Video Calls', href: '/customer/video-calls/history' },
        { icon: HeadphonesIcon, label: 'Support', href: '/customer/support' },
        { icon: Bell, label: 'Notifications', href: '/customer/notifications' },
      ]
    }
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-white border-r border-gray-100 transition-all duration-300 ease-in-out overflow-y-auto ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <nav className="p-3 space-y-5">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              {!collapsed && (
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon
                  let isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                  // Special logic for tracking page
                  if (pathname.match(/^\/customer\/requests\/[^/]+\/track/)) {
                    if (item.label === 'Active Requests' && trackingStatus && ['broadcasting','accepted','on_way','arrived','in_progress'].includes(trackingStatus)) {
                      isActive = true
                    } else if (item.label === 'Past Bookings' && trackingStatus && ['completed','cancelled'].includes(trackingStatus)) {
                      isActive = true
                    } else if (item.label === 'Active Requests' || item.label === 'Past Bookings') {
                      isActive = false
                    }
                  }

                  return (
                    <li key={itemIdx}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`${collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]'} flex-shrink-0`} />
                        {!collapsed && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar - Slides in from left, positioned below topbar */}
      <aside
        className={`lg:hidden fixed top-14 left-0 h-full w-72 bg-white border-r border-gray-100 z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          mobileOpen ? 'translate-x-0 visible pointer-events-auto' : '-translate-x-full invisible pointer-events-none'
        }`}
      >
        {/* Mobile Header removed per UX request */}

        <nav className="p-3 space-y-5">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon
                  let isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                  // Special logic for tracking page
                  if (pathname.match(/^\/customer\/requests\/[^/]+\/track/)) {
                    if (item.label === 'Active Requests' && trackingStatus && ['broadcasting','accepted','on_way','arrived','in_progress'].includes(trackingStatus)) {
                      isActive = true
                    } else if (item.label === 'Past Bookings' && trackingStatus && ['completed','cancelled'].includes(trackingStatus)) {
                      isActive = true
                    } else if (item.label === 'Active Requests' || item.label === 'Past Bookings') {
                      isActive = false
                    }
                  }

                  return (
                    <li key={itemIdx}>
                      <Link
                        href={item.href}
                        onClick={onMobileClose}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

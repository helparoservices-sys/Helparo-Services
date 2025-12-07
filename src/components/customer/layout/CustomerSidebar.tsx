'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Video
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
}

export default function CustomerSidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname()

  const menuSections = [
    {
      title: 'Main',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/customer/dashboard' },
        { icon: ClipboardList, label: 'My Requests', href: '/customer/requests' },
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
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out overflow-y-auto ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <nav className="p-4 space-y-6">
        {menuSections.map((section, idx) => (
          <div key={idx}>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <li key={itemIdx}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      } ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0`} />
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
  )
}

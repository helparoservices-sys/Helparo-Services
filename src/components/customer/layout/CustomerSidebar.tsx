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
  Video,
  Radio
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
        { icon: Radio, label: 'Active Requests', href: '/customer/active-requests' },
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
      className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-white border-r border-gray-100 transition-all duration-300 ease-in-out overflow-y-auto ${
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
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
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
  )
}

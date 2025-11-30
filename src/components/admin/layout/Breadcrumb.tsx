'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: LucideIcon
}

export default function Breadcrumb() {
  const pathname = usePathname()
  
  // Detect role from pathname
  const pathSegments = pathname.split('/').filter(segment => segment)
  const role = pathSegments[0] || 'admin' // admin, helper, or customer
  
  // Create breadcrumb items with proper labels
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: `/${role}/dashboard`, icon: Home }
  ]

  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    if (segment === 'admin' || segment === 'helper' || segment === 'customer') return // Skip role segment
    
    currentPath += `/${segment}`
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    breadcrumbItems.push({
      label,
      href: `/${role}${currentPath}`
    })
  })

  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1
        const Icon = item.icon

        return (
          <div key={item.href} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
            
            {isLast ? (
              <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

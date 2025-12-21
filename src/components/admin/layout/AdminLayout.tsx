'use client'

import { useState, ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Breadcrumb from './Breadcrumb'
import { ToastProvider } from '@/components/ui/toast-notification'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <RoleGuard allowedRole="admin">
      <ToastProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 relative overflow-hidden">
        {/* Main Layout */}
        <div className="relative z-10">
          <Topbar 
            onToggleSidebar={() => {
              // On mobile, toggle the mobile menu
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setMobileMenuOpen(!mobileMenuOpen)
              } else {
                setSidebarCollapsed(!sidebarCollapsed)
              }
            }}
          />
          
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          
          <div className="flex">
            <Sidebar 
              collapsed={sidebarCollapsed}
              mobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
            />
            
            {/* Main content - No left margin on mobile */}
            <main 
              className={`flex-1 transition-all duration-300 ease-in-out pt-16
                ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
                ml-0
              `}
            >
              <div className="p-4 sm:p-6 space-y-6">
                <Breadcrumb />
                
                {/* Page Content with Animation */}
                <div className="animate-fade-in">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Custom Styles */}
        <style jsx global>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }

          @keyframes glow-pulse {
            0%, 100% {
              box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
            }
            50% {
              box-shadow: 0 0 40px rgba(99, 102, 241, 0.8);
            }
          }

          .glow-pulse {
            animation: glow-pulse 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    </ToastProvider>
    </RoleGuard>
  )
}

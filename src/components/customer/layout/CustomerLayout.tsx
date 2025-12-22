'use client'

import { useState, ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import { RoleGuard } from '@/components/auth/RoleGuard'
import CustomerSidebar from './CustomerSidebar'
import CustomerTopbar from './CustomerTopbar'
import Breadcrumb from '@/components/admin/layout/Breadcrumb'
import { ToastProvider } from '@/components/ui/toast-notification'
import { LocationPermissionModal } from '@/components/location-permission-modal'
import EmergencySOSButton from '@/components/emergency-sos-button'

interface CustomerLayoutProps {
  children: ReactNode
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <RoleGuard allowedRole="customer">
      <ToastProvider>
        <Toaster position="top-right" richColors closeButton />
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
          {/* Location Permission Modal */}
          <LocationPermissionModal />

        {/* Main Layout */}
        <div className="relative z-10">
          <CustomerTopbar 
            onToggleSidebar={() => {
              // On mobile, toggle the mobile menu
              if (window.innerWidth < 1024) {
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
            {/* Sidebar - Hidden on mobile, shown via overlay when menu is open */}
            <CustomerSidebar 
              collapsed={sidebarCollapsed} 
              mobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
            />
            
            {/* Main content - No left margin on mobile, with bottom padding for mobile nav */}
            <main 
              className={`flex-1 transition-all duration-300 ease-in-out pt-20 pb-20 md:pb-0
                lg:${sidebarCollapsed ? 'ml-16' : 'ml-60'}
                ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
                ml-0
              `}
            >
              <div className="">
                {/* Page Content */}
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

        {/* Floating SOS Button - Always visible, adjusted for mobile bottom nav */}
        <div className="fixed bottom-6 right-6 z-50 md:bottom-6 bottom-24">
          <EmergencySOSButton className="shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 animate-pulse hover:animate-none" />
        </div>
      </div>
    </ToastProvider>
    </RoleGuard>
  )
}

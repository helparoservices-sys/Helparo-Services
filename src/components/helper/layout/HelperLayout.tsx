'use client'

import { useState, ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import HelperSidebar from './HelperSidebar'
import HelperTopbar from './HelperTopbar'
import Breadcrumb from '@/components/admin/layout/Breadcrumb'
import { ToastProvider } from '@/components/ui/toast-notification'
import { LocationPermissionPrompt } from '@/components/helper/location-permission'
import { JobNotificationPopup, useJobNotifications } from '@/components/helper/job-notification-popup'
import SOSAlertPopup from '@/components/helper/sos-alert-popup'
import { Toaster } from 'sonner'

interface HelperLayoutProps {
  children: ReactNode
}

// Separate component to use hooks
function HelperLayoutContent({ children }: HelperLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { notification, acceptJob, declineJob, closeNotification } = useJobNotifications()

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
      {/* Location Permission Prompt */}
      <LocationPermissionPrompt />

      {/* Job Notification Popup - Rapido Style */}
      <JobNotificationPopup
        notification={notification}
        onAccept={acceptJob}
        onDecline={declineJob}
        onClose={closeNotification}
      />

      {/* SOS Emergency Alert Popup - Persistent with Sound */}
      <SOSAlertPopup />
    
      {/* Main Layout */}
      <div className="relative z-10">
        <HelperTopbar 
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
          <HelperSidebar 
            collapsed={sidebarCollapsed} 
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
          
          {/* Main content - No left margin on mobile, with bottom padding for mobile nav */}
          <main 
            className={`flex-1 transition-all duration-300 ease-in-out pt-16 pb-20 md:pb-0
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
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.8);
          }
        }

        .glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thumb-slate-300::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .dark .scrollbar-thumb-slate-700::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  )
}

export default function HelperLayout({ children }: HelperLayoutProps) {
  return (
    <RoleGuard allowedRole="helper">
      <ToastProvider>
        <Toaster position="top-right" richColors />
        <HelperLayoutContent>{children}</HelperLayoutContent>
      </ToastProvider>
    </RoleGuard>
  )
}

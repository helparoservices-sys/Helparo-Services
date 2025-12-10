'use client'

import { useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import CustomerSidebar from './CustomerSidebar'
import CustomerTopbar from './CustomerTopbar'
import Breadcrumb from '@/components/admin/layout/Breadcrumb'
import { ToastProvider } from '@/components/ui/toast-notification'
import { LocationPermissionModal } from '@/components/location-permission-modal'

interface CustomerLayoutProps {
  children: ReactNode
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <RoleGuard allowedRole="customer">
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Location Permission Modal */}
          <LocationPermissionModal />

        {/* Main Layout */}
        <div className="relative z-10">
          <CustomerTopbar 
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          
          <div className="flex">
            <CustomerSidebar collapsed={sidebarCollapsed} />
            
            <main 
              className={`flex-1 transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'ml-16' : 'ml-60'
              } pt-14`}
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
      </div>
    </ToastProvider>
    </RoleGuard>
  )
}

'use client'

import { useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { RoleGuard } from '@/components/auth/RoleGuard'
import HelperSidebar from './HelperSidebar'
import HelperTopbar from './HelperTopbar'
import Breadcrumb from '@/components/admin/layout/Breadcrumb'
import { ToastProvider } from '@/components/ui/toast-notification'
import { LocationPermissionPrompt } from '@/components/helper/location-permission'
import { Toaster } from 'sonner'

interface HelperLayoutProps {
  children: ReactNode
}

export default function HelperLayout({ children }: HelperLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <RoleGuard allowedRole="helper">
      <ToastProvider>
        <Toaster position="top-right" richColors />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden">
          {/* Location Permission Prompt */}
          <LocationPermissionPrompt />
        
        {/* Main Layout */}
        <div className="relative z-10">
          <HelperTopbar 
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          
          <div className="flex">
            <HelperSidebar collapsed={sidebarCollapsed} />
            
            <main 
              className={`flex-1 transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'ml-20' : 'ml-64'
              } pt-16`}
            >
              <div className="p-6 space-y-6">
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
              box-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
            }
            50% {
              box-shadow: 0 0 40px rgba(147, 51, 234, 0.8);
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
    </ToastProvider>
    </RoleGuard>
  )
}

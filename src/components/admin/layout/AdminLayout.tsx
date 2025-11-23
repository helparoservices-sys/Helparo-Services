'use client'

import { useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Breadcrumb from './Breadcrumb'
import { ToastProvider } from '@/components/ui/toast-notification'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 relative overflow-hidden">
        {/* Main Layout */}
        <div className="relative z-10">
          <Topbar 
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          
          <div className="flex">
            <Sidebar collapsed={sidebarCollapsed} />
            
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
  )
}

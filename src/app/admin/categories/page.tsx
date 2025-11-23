'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ArrowRight } from 'lucide-react'

/**
 * CATEGORIES PAGE - Redirects to Services
 * 
 * Categories and Services are the SAME feature managing service_categories table.
 * Both manage parent categories (Plumbing, Electrical, etc.) and their sub-services.
 * 
 * To avoid duplicate code and confusion, use /admin/services for all management.
 */
export default function AdminCategoriesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect after showing message briefly
    const timer = setTimeout(() => {
      router.push('/admin/services')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-8 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Package className="h-10 w-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Categories = Services
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
          Categories and Services manage the same data (service_categories table).
          <br />
          We&apos;ve consolidated everything into one unified interface.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
            <strong>What you can manage in Services:</strong>
          </p>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4">
            <li>• Parent Categories (Plumbing, Electrical, etc.)</li>
            <li>• Sub-Services (Tap Fixing, Wiring, etc.)</li>
            <li>• Pricing & Features</li>
            <li>• Emergency Support Settings</li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 font-semibold animate-pulse">
          <span>Redirecting to Services Management</span>
          <ArrowRight className="h-5 w-5" />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
          Redirecting in 2 seconds...
        </p>
      </div>
    </div>
  )

}

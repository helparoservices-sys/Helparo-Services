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
          We've consolidated everything into one unified interface.
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Category Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create, edit and manage service categories</p>
        </div>
        <Link 
          href="/admin/categories/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New Category
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Root Categories</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalRootCategories}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
              <FolderTree className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Roots</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeRootCategories}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sub-Categories</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalSubCategories}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg">
              <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Subs</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeSubCategories}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg">
              <Grid3x3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roots.map(r => (
          <div key={r.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-slate-900 dark:text-white">{r.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{r.slug}</p>
                </div>
              </div>
              {r.is_active ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400">
                  <XCircle className="h-3 w-3" />
                  Inactive
                </span>
              )}
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{r.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sub-categories</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{(children[r.id] || []).length}</span>
              </div>
              {(children[r.id] || []).slice(0, 3).map(ch => (
                <div key={ch.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-700 dark:text-slate-300">{ch.name}</span>
                  <Link 
                    href={`/admin/categories/${ch.id}`} 
                    className="text-primary-600 dark:text-primary-400 text-xs hover:underline inline-flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Link>
                </div>
              ))}
              {(children[r.id] || []).length > 3 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  +{(children[r.id] || []).length - 3} more
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Link 
                href={`/admin/categories/${r.id}`} 
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Root
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {roots.length === 0 && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-12 text-center">
          <FolderTree className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Categories Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Start organizing your services by creating categories</p>
          <Link 
            href="/admin/categories/new" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Category
          </Link>
        </div>
      )}
    </div>
  )
}

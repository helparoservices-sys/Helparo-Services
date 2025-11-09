'use server'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FolderTree, Plus, Edit, CheckCircle, XCircle, Tag, Grid3x3, Layers } from 'lucide-react'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6 text-center">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6 text-center">Unauthorized</div>

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name, slug, description, parent_id, is_active')
    .order('name')
    .limit(100)

  const roots = (categories || []).filter(c => !c.parent_id)
  const children: Record<string, any[]> = {}
  for (const c of (categories || [])) {
    if (c.parent_id) {
      children[c.parent_id] = children[c.parent_id] || []
      children[c.parent_id].push(c)
    }
  }

  // Calculate stats
  const totalRootCategories = roots.length
  const activeRootCategories = roots.filter(r => r.is_active).length
  const totalSubCategories = (categories || []).filter(c => c.parent_id).length
  const activeSubCategories = (categories || []).filter(c => c.parent_id && c.is_active).length

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

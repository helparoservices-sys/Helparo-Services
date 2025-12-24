'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Plus, Edit, CheckCircle, XCircle, FolderTree, Grid3x3, IndianRupee, AlertCircle, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'
import { PageLoader } from '@/components/admin/PageLoader'
import { getServiceCategoryTree, deleteServiceCategory, toggleServiceStatus } from '@/app/actions/services'
import { useToast } from '@/components/ui/toast-notification'

interface ServiceCategory {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  is_active: boolean
  icon: string | null
  base_price: number
  price_type: string
  unit_name: string | null
  supports_emergency: boolean
  display_order: number
  children: ServiceCategory[]
}

export default function AdminServicesPage() {
  const { showSuccess, showError } = useToast()
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    const result = await getServiceCategoryTree(true)
    if (result.error) {
      setError(result.error)
    } else {
      setCategories(result.categories || [])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"? This will soft delete the category.`)) {
      return
    }

    setDeletingId(id)
    const result = await deleteServiceCategory(id)
    
    if (result.error) {
      showError('Delete Failed', result.error)
    } else {
      showSuccess('Category Deleted', 'Service category deactivated successfully')
      // Reload categories to reflect change
      await loadCategories()
    }
    setDeletingId(null)
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    
    // Optimistic update
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, is_active: !currentStatus } : {
        ...cat,
        children: cat.children.map(child => 
          child.id === id ? { ...child, is_active: !currentStatus } : child
        )
      }
    ))
    
    const result = await toggleServiceStatus(id, currentStatus)
    
    if (result.error) {
      showError('Toggle Failed', result.error)
      // Revert on error
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, is_active: currentStatus } : {
          ...cat,
          children: cat.children.map(child => 
            child.id === id ? { ...child, is_active: currentStatus } : child
          )
        }
      ))
    }
    
    setTogglingId(null)
  }

  const handleViewSubServices = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setViewModalOpen(true)
  }

  if (loading) {
    return <PageLoader text="Loading service categories..." />
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex gap-4">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          <div>
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">Failed to load services</h2>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const roots = categories
  const totalCategories = roots.length
  const activeCategories = roots.filter(c => c.is_active).length
  const allChildren = roots.flatMap(r => r.children)
  const totalSubServices = allChildren.length
  const activeSubServices = allChildren.filter(c => c.is_active).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Service Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage service catalog & dynamic pricing</p>
        </div>
        <Link 
          href="/admin/services/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Categories</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCategories}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
              <FolderTree className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Categories</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeCategories}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sub-Services</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalSubServices}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-lg">
              <Grid3x3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Sub-Services</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeSubServices}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Service Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roots.map(parent => {
          const children = parent.children
          return (
            <div key={parent.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {parent.icon === 'Wrench' ? '🔧' :
                     parent.icon === 'Zap' ? '⚡' :
                     parent.icon === 'Car' ? '🚗' :
                     parent.icon === 'Sparkles' ? '✨' :
                     parent.icon === 'DoorOpen' ? '🚪' : '📦'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{parent.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{parent.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(parent.id, parent.is_active)}
                    disabled={togglingId === parent.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      parent.is_active
                        ? 'bg-green-500 dark:bg-green-600'
                        : 'bg-slate-300 dark:bg-slate-600'
                    } ${togglingId === parent.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={parent.is_active ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        parent.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{parent.description}</p>

              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1 text-sm">
                  <IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">₹{parent.base_price}</span>
                  {parent.price_type !== 'custom' && parent.unit_name && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">/{parent.unit_name}</span>
                  )}
                </div>
                {parent.supports_emergency && (
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">🚨 Emergency</span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sub-services</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{children.length}</span>
                </div>
                {children.slice(0,3).map(child => (
                  <div key={child.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-slate-700 dark:text-slate-300">{child.name}</span>
                    <Link href={`/admin/services/${child.id}`} className="text-primary-600 dark:text-primary-400 text-xs hover:underline inline-flex items-center gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Link>
                  </div>
                ))}
                {children.length > 3 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">+{children.length - 3} more</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewSubServices(parent)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <Link href={`/admin/services/${parent.id}`} className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(parent.id, parent.name)}
                  disabled={deletingId === parent.id}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Soft delete category"
                >
                  {deletingId === parent.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {roots.length === 0 && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-12 text-center">
          <Package className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Services Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Get started by creating your first service category</p>
          <Link 
            href="/admin/services/new" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Service
          </Link>
        </div>
      )}

      {/* View Sub-Services Modal */}
      {viewModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setViewModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {selectedCategory.icon === 'Wrench' ? '🔧' :
                   selectedCategory.icon === 'Zap' ? '⚡' :
                   selectedCategory.icon === 'Car' ? '🚗' :
                   selectedCategory.icon === 'Sparkles' ? '✨' :
                   selectedCategory.icon === 'DoorOpen' ? '🚪' : '📦'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCategory.name}</h2>
                  <p className="text-sm text-blue-100">{selectedCategory.children.length} Sub-Services</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Category Details */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Base Price</p>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">₹{selectedCategory.base_price}</span>
                      {selectedCategory.price_type !== 'custom' && selectedCategory.unit_name && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">/{selectedCategory.unit_name}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      selectedCategory.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {selectedCategory.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Emergency Support</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      selectedCategory.supports_emergency
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {selectedCategory.supports_emergency ? '🚨 Yes' : 'No'}
                    </span>
                  </div>
                </div>
                {selectedCategory.description && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedCategory.description}</p>
                  </div>
                )}
              </div>

              {/* Sub-Services List */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">All Sub-Services</h3>
                {selectedCategory.children.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-8 text-center">
                    <Grid3x3 className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No sub-services added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCategory.children.map((child, index) => (
                      <div
                        key={child.id}
                        className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                                {index + 1}
                              </span>
                              <h4 className="font-semibold text-slate-900 dark:text-white">{child.name}</h4>
                              {child.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                  <CheckCircle className="h-3 w-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                  <XCircle className="h-3 w-3" />
                                  Inactive
                                </span>
                              )}
                            </div>
                            {child.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{child.description}</p>
                            )}
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-1 text-sm">
                                <IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="font-semibold text-slate-900 dark:text-white">₹{child.base_price}</span>
                                {child.price_type !== 'custom' && child.unit_name && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">/{child.unit_name}</span>
                                )}
                              </div>
                              {child.supports_emergency && (
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                  🚨 Emergency
                                </span>
                              )}
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                {child.price_type}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/admin/services/${child.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <Link
                href={`/admin/services/${selectedCategory.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Category
              </Link>
              <button
                onClick={() => setViewModalOpen(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

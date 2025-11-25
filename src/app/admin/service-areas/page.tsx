'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit, Trash2, MapPin, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ServiceArea {
  id: string
  parent_id: string | null
  level: 'state' | 'district' | 'city' | 'area'
  name: string
  slug: string
  latitude: number | null
  longitude: number | null
  pincode: string | null
  is_active: boolean
  display_order: number
}

export default function ServiceAreasPage() {
  const router = useRouter()
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [filteredAreas, setFilteredAreas] = useState<ServiceArea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedParent, setSelectedParent] = useState<string>('all')

  useEffect(() => {
    loadAreas()
  }, [])

  useEffect(() => {
    filterAreas()
  }, [searchQuery, selectedLevel, selectedParent, areas])

  const loadAreas = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .order('level', { ascending: true })
      .order('display_order', { ascending: true })

    if (error) {
      toast.error('Failed to load service areas')
      console.error(error)
    } else {
      setAreas(data || [])
    }
    setLoading(false)
  }

  const filterAreas = () => {
    let filtered = [...areas]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(area =>
        area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(area => area.level === selectedLevel)
    }

    // Filter by parent
    if (selectedParent !== 'all') {
      filtered = filtered.filter(area => area.parent_id === selectedParent)
    }

    setFilteredAreas(filtered)
  }

  const deleteArea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service area? All child areas will also be deleted.')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('service_areas')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete service area')
      console.error(error)
    } else {
      toast.success('Service area deleted successfully')
      loadAreas()
    }
  }

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-'
    const parent = areas.find(a => a.id === parentId)
    return parent ? parent.name : '-'
  }

  const getHierarchyPath = (area: ServiceArea): string => {
    const path: string[] = [area.name]
    let current = area

    while (current.parent_id) {
      const parent = areas.find(a => a.id === current.parent_id)
      if (!parent) break
      path.unshift(parent.name)
      current = parent
    }

    return path.join(' > ')
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'state': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      case 'district': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'city': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'area': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const states = areas.filter(a => a.level === 'state')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Service Areas</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage hierarchical service areas (State → District → City → Area)
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/service-areas/new')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Service Area
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">States</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {areas.filter(a => a.level === 'state').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Districts</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {areas.filter(a => a.level === 'district').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Cities</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {areas.filter(a => a.level === 'city').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Areas</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {areas.filter(a => a.level === 'area').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Levels</option>
            <option value="state">States</option>
            <option value="district">Districts</option>
            <option value="city">Cities</option>
            <option value="area">Areas</option>
          </select>

          {/* Parent Filter */}
          <select
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Parents</option>
            <option value="null">Root Level</option>
            {states.map(state => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>

          {/* Results Count */}
          <div className="flex items-center justify-end text-sm text-slate-600 dark:text-slate-400">
            Showing {filteredAreas.length} of {areas.length} areas
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Hierarchy Path
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Coordinates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pincode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredAreas.map((area) => (
                <tr key={area.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {getHierarchyPath(area)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {area.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(area.level)}`}>
                      {area.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {area.latitude && area.longitude ? (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {area.pincode || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      area.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {area.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => router.push(`/admin/service-areas/${area.id}`)}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => deleteArea(area.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAreas.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No service areas found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Get started by creating a new service area.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

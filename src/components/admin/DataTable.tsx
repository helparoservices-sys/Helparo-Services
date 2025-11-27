'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Search, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import { ButtonLoader } from '@/components/ui/loading'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  itemsPerPage?: number
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  onRowClick,
  actions,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  itemsPerPage = 10
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data based on search query
  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    
    return columns.some(column => {
      const value = (item as any)[column.key]
      if (!value) return false
      return String(value).toLowerCase().includes(searchQuery.toLowerCase())
    })
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0
    
    const aValue = (a as any)[sortKey]
    const bValue = (b as any)[sortKey]
    
    if (aValue === bValue) return 0
    
    const comparison = aValue > bValue ? 1 : -1
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return
    
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedData.slice(startIndex, endIndex)

  // Reset to page 1 when search query changes
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg">
        <div className="p-12 flex flex-col items-center justify-center gap-4">
          <ButtonLoader size="lg" />
          <p className="text-slate-600 dark:text-slate-400">Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key, column.sortable)}
                  className={`px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none' : ''
                  } ${column.width || ''}`}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortKey === column.key && (
                      <>
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider min-w-[200px]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''
                  } transition-colors`}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {column.render ? column.render(item) : String((item as any)[column.key])}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    {emptyIcon || <Search className="h-12 w-12 text-slate-300 dark:text-slate-600" />}
                    <p className="text-slate-600 dark:text-slate-400">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer with count */}
      {data.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {paginatedData.length} of {data.length} total {data.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      )}
    </div>
  )
}

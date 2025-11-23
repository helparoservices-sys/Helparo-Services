import { Skeleton } from '@/components/ui/loader'

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header Skeleton */}
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div className="p-6 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

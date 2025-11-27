import { Skeleton } from '@/components/ui/loading'

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header Skeleton */}
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      {/* Stats Cards Skeleton - 8 cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings Skeleton */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gradient-to-br from-slate-300 to-slate-400 rounded-lg p-6 shadow-lg">
            <Skeleton className="h-6 w-40 bg-white/30" />
            <Skeleton className="h-8 w-16 mt-2 bg-white/30" />
            <Skeleton className="h-4 w-32 mt-2 bg-white/30" />
          </div>
        ))}
      </div>
    </div>
  )
}

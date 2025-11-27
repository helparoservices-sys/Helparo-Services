import { Skeleton } from '@/components/ui/loading'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <Skeleton className="h-10 w-32" />

        {/* User Profile Card Skeleton */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-9 w-64" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          {/* Actions Skeleton */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-xl p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-5 w-5" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

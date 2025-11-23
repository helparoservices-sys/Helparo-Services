import { Skeleton } from '@/components/ui/loader'

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header Skeleton */}
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      {/* Content Skeleton */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-200 dark:border-slate-700 last:border-0">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

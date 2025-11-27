import React from 'react'

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary border-t-transparent`} />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border bg-white p-6 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-4 rounded border bg-white p-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export function ButtonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ${className}`} />
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
  )
}

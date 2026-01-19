'use client'

import React from 'react'

/**
 * Loading Spinner Component
 */
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <div className="h-full w-full animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600"></div>
    </div>
  )
}

/**
 * Full Page Loading Spinner
 */
export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-neutral-600">{message}</p>
      </div>
    </div>
  )
}

/**
 * Button Loading State
 */
export function ButtonLoading({ children, loading, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${props.className || ''} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}

/**
 * Skeleton Screen Component
 */
export function Skeleton({ className = '', lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="mb-2 h-4 animate-pulse rounded bg-neutral-200"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

/**
 * Card Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <Skeleton lines={3} />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20" lines={1} />
        <Skeleton className="h-8 w-20" lines={1} />
      </div>
    </div>
  )
}

/**
 * Table Skeleton
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <table className="w-full">
        <thead className="bg-neutral-50">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-24" lines={1} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t border-neutral-200">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <Skeleton className="h-4 w-32" lines={1} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

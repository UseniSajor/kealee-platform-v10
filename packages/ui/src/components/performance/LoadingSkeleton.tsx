'use client';

/**
 * Loading Skeletons — Shimmer-animated placeholders
 *
 * Drop-in loading states for every major view type.
 * Use inside Next.js loading.tsx files or Suspense boundaries.
 *
 * Usage:
 *   <Suspense fallback={<DashboardSkeleton />}>
 *     <Dashboard />
 *   </Suspense>
 */

import React from 'react';

// ── Base Shimmer Skeleton ──
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  const roundedClass = {
    sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg',
    xl: 'rounded-xl', '2xl': 'rounded-2xl', full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={`animate-pulse bg-gray-200 ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  );
}

// ── Dashboard Skeleton ──
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
          <Skeleton className="h-5 w-40 mb-6" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 mb-4">
              <Skeleton className="h-10 w-10" rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" rounded="full" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <Skeleton className="h-5 w-32 mb-6" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Project Detail Skeleton ──
export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8" rounded="full" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-6 w-20 ml-auto" rounded="full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-40 w-full" rounded="xl" />
      </div>
    </div>
  );
}

// ── Table Skeleton ──
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex gap-4">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="border-b border-gray-100 px-6 py-4 flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Card Grid Skeleton ──
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10" rounded="lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-4/5 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" rounded="full" />
            <Skeleton className="h-6 w-16" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Photo Gallery Skeleton ──
export function PhotoGallerySkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full" rounded="xl" />
      ))}
    </div>
  );
}

// ── Form Skeleton ──
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
      {[...Array(fields)].map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-4" rounded="xl" />
    </div>
  );
}

// ── Chat/Timeline Skeleton ──
export function TimelineSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8" rounded="full" />
            {i < (items ?? 5) - 1 && <div className="w-px h-12 bg-gray-200 my-1" />}
          </div>
          <div className="flex-1 pb-4">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

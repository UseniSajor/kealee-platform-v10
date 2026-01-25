// packages/ui/src/components/DataTable.tsx
// Kealee Platform Data Table Component - Enterprise Data Display

'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyState,
  onRowClick,
  className,
  striped = false,
  hoverable = true,
  compact = false,
  stickyHeader = false,
}: DataTableProps<T>) {
  const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';

  if (loading) {
    return (
      <div className={cn('overflow-hidden rounded-lg border border-gray-200', className)}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    cellPadding,
                    'text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'
                  )}
                  style={{ width: col.width }}
                >
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} className={cellPadding}>
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('overflow-hidden rounded-lg border border-gray-200', className)}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    cellPadding,
                    'text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="bg-white py-12">
          {emptyState || (
            <div className="text-center text-gray-500">
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-gray-200', className)}>
      <div className={cn(stickyHeader && 'max-h-[600px] overflow-auto')}>
        <table className="w-full">
          <thead className={cn(
            'bg-gray-50 border-b border-gray-200',
            stickyHeader && 'sticky top-0 z-10'
          )}>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    cellPadding,
                    'text-xs font-semibold text-gray-600 uppercase tracking-wider',
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(item, rowIndex)}
                className={cn(
                  'transition-colors',
                  striped && rowIndex % 2 === 1 && 'bg-gray-50',
                  hoverable && 'hover:bg-blue-50',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      cellPadding,
                      'text-sm text-gray-900',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.render ? col.render(item, rowIndex) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

DataTable.displayName = 'DataTable';

export { DataTable };
export default DataTable;

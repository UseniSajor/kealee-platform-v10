// packages/ui/src/components/data-display/DataTable.tsx
// Reusable data table component with sorting, filtering, and pagination

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => React.ReactNode;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  // Sorting
  sortable?: boolean;
  defaultSortColumn?: string;
  defaultSortDirection?: SortDirection;
  onSortChange?: (column: string, direction: SortDirection) => void;
  // Filtering
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  // Pagination
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Selection
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (selectedRows: Set<string>) => void;
  // Row actions
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  // Styling
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  bordered?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string | number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  sortable = true,
  defaultSortColumn,
  defaultSortDirection = null,
  onSortChange,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  paginated = false,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  totalCount,
  currentPage: controlledPage,
  onPageChange,
  onPageSizeChange,
  selectable = false,
  selectedRows: controlledSelectedRows,
  onSelectionChange,
  onRowClick,
  rowClassName,
  striped = false,
  hoverable = true,
  compact = false,
  bordered = false,
  stickyHeader = false,
  maxHeight,
  className,
}: DataTableProps<T>) {
  // Internal state for uncontrolled mode
  const [internalSortColumn, setInternalSortColumn] = useState(defaultSortColumn || '');
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());

  // Use controlled or internal values
  const currentPage = controlledPage ?? internalPage;
  const selectedRows = controlledSelectedRows ?? internalSelectedRows;

  // Handle sort
  const handleSort = useCallback((columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column?.sortable && sortable) return;
    if (column?.sortable === false) return;

    let newDirection: SortDirection;
    if (internalSortColumn !== columnId) {
      newDirection = 'asc';
    } else if (internalSortDirection === 'asc') {
      newDirection = 'desc';
    } else if (internalSortDirection === 'desc') {
      newDirection = null;
    } else {
      newDirection = 'asc';
    }

    setInternalSortColumn(columnId);
    setInternalSortDirection(newDirection);
    onSortChange?.(columnId, newDirection);
  }, [columns, internalSortColumn, internalSortDirection, sortable, onSortChange]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
    setInternalPage(1);
  }, [onSearch]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (controlledPage === undefined) {
      setInternalPage(page);
    }
    onPageChange?.(page);
  }, [controlledPage, onPageChange]);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setInternalPage(1);
    onPageSizeChange?.(newPageSize);
  }, [onPageSizeChange]);

  // Handle selection
  const handleRowSelect = useCallback((rowKey: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowKey)) {
      newSelected.delete(rowKey);
    } else {
      newSelected.add(rowKey);
    }

    if (controlledSelectedRows === undefined) {
      setInternalSelectedRows(newSelected);
    }
    onSelectionChange?.(newSelected);
  }, [selectedRows, controlledSelectedRows, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    const allKeys = data.map((row) => String(row[keyField]));
    const allSelected = allKeys.every((key) => selectedRows.has(key));

    const newSelected = allSelected ? new Set<string>() : new Set(allKeys);

    if (controlledSelectedRows === undefined) {
      setInternalSelectedRows(newSelected);
    }
    onSelectionChange?.(newSelected);
  }, [data, keyField, selectedRows, controlledSelectedRows, onSelectionChange]);

  // Processed data (client-side sorting/filtering/pagination)
  const processedData = useMemo(() => {
    let result = [...data];

    // Client-side search if no external handler
    if (searchQuery && !onSearch) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = col.accessorKey ? row[col.accessorKey] : col.accessorFn?.(row);
          return String(value || '').toLowerCase().includes(lowerQuery);
        })
      );
    }

    // Client-side sort if no external handler
    if (internalSortColumn && internalSortDirection && !onSortChange) {
      const column = columns.find((c) => c.id === internalSortColumn);
      if (column) {
        result.sort((a, b) => {
          const aVal = column.accessorKey ? a[column.accessorKey] : column.accessorFn?.(a);
          const bVal = column.accessorKey ? b[column.accessorKey] : column.accessorFn?.(b);

          if (aVal === bVal) return 0;
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;

          const comparison = aVal < bVal ? -1 : 1;
          return internalSortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, searchQuery, onSearch, internalSortColumn, internalSortDirection, onSortChange, columns]);

  // Pagination calculations
  const total = totalCount ?? processedData.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  // Client-side pagination if no external handler
  const displayedData = useMemo(() => {
    if (!paginated || onPageChange) return processedData;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, paginated, onPageChange, startIndex, endIndex]);

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Search bar */}
      {searchable && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Table container */}
      <div
        className={cn(
          'relative overflow-auto rounded-lg',
          bordered && 'border border-gray-200'
        )}
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse">
          <thead
            className={cn(
              'bg-gray-50',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {selectable && (
                <th className={cn(cellPadding, 'w-10')}>
                  <input
                    type="checkbox"
                    checked={data.length > 0 && data.every((row) => selectedRows.has(String(row[keyField])))}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    cellPadding,
                    'text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                    bordered && 'border-b border-gray-200',
                    column.sticky && 'sticky left-0 bg-gray-50 z-10',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    (column.sortable !== false && sortable) && 'cursor-pointer select-none hover:bg-gray-100',
                    column.headerClassName
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={() => (column.sortable !== false && sortable) && handleSort(column.id)}
                >
                  <div className="flex items-center gap-1">
                    <span className="flex-1">{column.header}</span>
                    {(column.sortable !== false && sortable) && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            'w-3 h-3 -mb-1',
                            internalSortColumn === column.id && internalSortDirection === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'w-3 h-3',
                            internalSortColumn === column.id && internalSortDirection === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="text-center py-12"
                >
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Loading...</p>
                </td>
              </tr>
            ) : displayedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="text-center py-12"
                >
                  {emptyIcon && <div className="mb-2">{emptyIcon}</div>}
                  <p className="text-gray-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              displayedData.map((row, index) => {
                const rowKey = String(row[keyField]);
                const isSelected = selectedRows.has(rowKey);
                const computedRowClass = typeof rowClassName === 'function'
                  ? rowClassName(row, index)
                  : rowClassName;

                return (
                  <tr
                    key={rowKey}
                    className={cn(
                      striped && index % 2 === 1 && 'bg-gray-50',
                      hoverable && 'hover:bg-gray-50',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-blue-50',
                      computedRowClass
                    )}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {selectable && (
                      <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(rowKey)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => {
                      const value = column.cell
                        ? column.cell(row, index)
                        : column.accessorKey
                          ? row[column.accessorKey]
                          : column.accessorFn?.(row);

                      return (
                        <td
                          key={column.id}
                          className={cn(
                            cellPadding,
                            'text-sm text-gray-700',
                            bordered && 'border-b border-gray-100',
                            column.sticky && 'sticky left-0 bg-inherit',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right',
                            column.className
                          )}
                          style={{
                            width: column.width,
                            minWidth: column.minWidth,
                            maxWidth: column.maxWidth,
                          }}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && !loading && displayedData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Showing {startIndex + 1} to {endIndex} of {total} results
            </span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-200 rounded px-2 py-1 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={cn(
                'p-1 rounded hover:bg-gray-100',
                currentPage === 1 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                'p-1 rounded hover:bg-gray-100',
                currentPage === 1 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      'w-8 h-8 text-sm rounded',
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                'p-1 rounded hover:bg-gray-100',
                currentPage === totalPages && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={cn(
                'p-1 rounded hover:bg-gray-100',
                currentPage === totalPages && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;

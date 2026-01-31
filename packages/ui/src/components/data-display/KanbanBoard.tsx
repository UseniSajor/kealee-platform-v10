// packages/ui/src/components/data-display/KanbanBoard.tsx
// Kanban board component for task/project visualization

'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus,
  MoreHorizontal,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '../../utils';

export interface KanbanItem {
  id: string;
  columnId: string;
  order: number;
  [key: string]: any;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  icon?: React.ReactNode;
  limit?: number;
  collapsed?: boolean;
}

export interface KanbanBoardProps<T extends KanbanItem> {
  columns: KanbanColumn[];
  items: T[];
  renderCard: (item: T, isDragging: boolean) => React.ReactNode;
  onItemMove?: (itemId: string, fromColumnId: string, toColumnId: string, newOrder: number) => void;
  onColumnAdd?: () => void;
  onItemAdd?: (columnId: string) => void;
  onColumnCollapse?: (columnId: string, collapsed: boolean) => void;
  columnActions?: (column: KanbanColumn) => React.ReactNode;
  showAddColumn?: boolean;
  showAddItem?: boolean;
  emptyColumnMessage?: string;
  className?: string;
  columnClassName?: string;
  cardClassName?: string;
}

export function KanbanBoard<T extends KanbanItem>({
  columns,
  items,
  renderCard,
  onItemMove,
  onColumnAdd,
  onItemAdd,
  onColumnCollapse,
  columnActions,
  showAddColumn = false,
  showAddItem = true,
  emptyColumnMessage = 'No items',
  className,
  columnClassName,
  cardClassName,
}: KanbanBoardProps<T>) {
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Get items for a specific column, sorted by order
  const getColumnItems = useCallback(
    (columnId: string) =>
      items
        .filter((item) => item.columnId === columnId)
        .sort((a, b) => a.order - b.order),
    [items]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent, item: T) => {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.id);

      // Add a slight delay to show the dragging state
      setTimeout(() => {
        const element = e.target as HTMLElement;
        element.style.opacity = '0.5';
      }, 0);
    },
    []
  );

  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const element = e.target as HTMLElement;
    element.style.opacity = '1';
    setDraggedItem(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  }, []);

  // Handle drag over column
  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string, index?: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverColumn(columnId);
      if (index !== undefined) {
        setDragOverIndex(index);
      }
    },
    []
  );

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the column entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('[data-kanban-column]')) {
      setDragOverColumn(null);
      setDragOverIndex(null);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent, columnId: string, index?: number) => {
      e.preventDefault();

      if (!draggedItem || !onItemMove) return;

      const columnItems = getColumnItems(columnId);
      const newOrder = index !== undefined
        ? index
        : columnItems.length;

      if (draggedItem.columnId !== columnId || draggedItem.order !== newOrder) {
        onItemMove(draggedItem.id, draggedItem.columnId, columnId, newOrder);
      }

      setDraggedItem(null);
      setDragOverColumn(null);
      setDragOverIndex(null);
    },
    [draggedItem, onItemMove, getColumnItems]
  );

  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
      {columns.map((column) => {
        const columnItems = getColumnItems(column.id);
        const isOverLimit = column.limit !== undefined && columnItems.length >= column.limit;
        const isCollapsed = column.collapsed;

        return (
          <div
            key={column.id}
            data-kanban-column={column.id}
            className={cn(
              'flex-shrink-0 bg-gray-50 rounded-xl',
              isCollapsed ? 'w-12' : 'w-80',
              columnClassName
            )}
          >
            {/* Column Header */}
            <div
              className={cn(
                'p-3 border-b border-gray-200',
                isCollapsed && 'flex flex-col items-center py-4'
              )}
            >
              {isCollapsed ? (
                <>
                  <button
                    onClick={() => onColumnCollapse?.(column.id, false)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  <div
                    className="writing-mode-vertical mt-3 text-sm font-semibold text-gray-700"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    {column.title}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {columnItems.length}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {column.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                    )}
                    {column.icon}
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        isOverLimit
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {columnItems.length}
                      {column.limit && `/${column.limit}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {onColumnCollapse && (
                      <button
                        onClick={() => onColumnCollapse(column.id, true)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    {columnActions?.(column)}
                    {showAddItem && onItemAdd && !isOverLimit && (
                      <button
                        onClick={() => onItemAdd(column.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Column Body */}
            {!isCollapsed && (
              <div
                className={cn(
                  'p-2 min-h-[200px] space-y-2 transition-colors',
                  dragOverColumn === column.id && 'bg-blue-50'
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {columnItems.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">
                    {emptyColumnMessage}
                  </div>
                ) : (
                  columnItems.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, column.id, index)}
                      className={cn(
                        'cursor-grab active:cursor-grabbing',
                        draggedItem?.id === item.id && 'opacity-50',
                        dragOverColumn === column.id &&
                          dragOverIndex === index &&
                          'border-t-2 border-blue-500',
                        cardClassName
                      )}
                    >
                      {renderCard(item, draggedItem?.id === item.id)}
                    </div>
                  ))
                )}

                {/* Drop zone at end */}
                {draggedItem && dragOverColumn === column.id && (
                  <div
                    onDragOver={(e) => handleDragOver(e, column.id, columnItems.length)}
                    onDrop={(e) => handleDrop(e, column.id, columnItems.length)}
                    className={cn(
                      'h-16 border-2 border-dashed border-blue-300 rounded-lg',
                      'flex items-center justify-center text-sm text-blue-500',
                      dragOverIndex === columnItems.length && 'bg-blue-100 border-blue-500'
                    )}
                  >
                    Drop here
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Column Button */}
      {showAddColumn && onColumnAdd && (
        <button
          onClick={onColumnAdd}
          className={cn(
            'flex-shrink-0 w-80 min-h-[200px] rounded-xl',
            'border-2 border-dashed border-gray-200 hover:border-gray-300',
            'flex flex-col items-center justify-center gap-2',
            'text-gray-400 hover:text-gray-500 transition-colors'
          )}
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">Add Column</span>
        </button>
      )}
    </div>
  );
}

export default KanbanBoard;

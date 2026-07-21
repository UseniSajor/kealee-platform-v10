// ============================================================
// PERMITS KANBAN VIEW
// Drag-and-drop Kanban board
// ============================================================

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const STATUS_COLUMNS = [
  { id: 'DRAFT', title: 'Draft', color: 'bg-gray-100' },
  { id: 'AI_PRE_REVIEW', title: 'AI Review', color: 'bg-blue-100' },
  { id: 'READY_TO_SUBMIT', title: 'Ready', color: 'bg-yellow-100' },
  { id: 'SUBMITTED', title: 'Submitted', color: 'bg-purple-100' },
  { id: 'UNDER_REVIEW', title: 'In Review', color: 'bg-orange-100' },
  { id: 'APPROVED', title: 'Approved', color: 'bg-green-100' },
  { id: 'ISSUED', title: 'Issued', color: 'bg-green-200' },
];

interface PermitCardProps {
  permit: any;
}

function PermitCard({ permit }: PermitCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: permit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-3 cursor-move">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div {...attributes} {...listeners} className="cursor-grab">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <h3 className="font-semibold text-sm">{permit.permitType}</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">{permit.scope}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {permit.permitNumber && (
                  <Badge variant="outline" className="text-xs">
                    {permit.permitNumber}
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {formatDate(permit.createdAt)}
                </span>
              </div>
            </div>
            <Link href={`/dashboard/permits/${permit.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PermitsKanbanView() {
  const supabase = createClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: permits, isLoading } = useQuery({
    queryKey: ['permits', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Permit')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const newStatus = over.id as string;
    const permitId = active.id as string;

    // Update permit status
    await supabase
      .from('Permit')
      .update({ kealeeStatus: newStatus })
      .eq('id', permitId);
  };

  const permitsByStatus = STATUS_COLUMNS.reduce((acc, column) => {
    acc[column.id] = permits?.filter((p: any) => p.kealeeStatus === column.id) || [];
    return acc;
  }, {} as Record<string, any[]>);

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading permits...</div>;
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          const columnPermits = permitsByStatus[column.id] || [];
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Card>
                <CardHeader className={`${column.color} pb-3`}>
                  <CardTitle className="text-sm font-semibold">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {columnPermits.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <SortableContext
                    items={columnPermits.map((p: any) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnPermits.map((permit: any) => (
                      <PermitCard key={permit.id} permit={permit} />
                    ))}
                  </SortableContext>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeId ? (
          <Card className="w-80">
            <CardContent className="p-4">
              <div className="font-semibold text-sm">
                {permits?.find((p: any) => p.id === activeId)?.permitType}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

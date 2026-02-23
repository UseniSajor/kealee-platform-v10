// ============================================================
// PERMITS DASHBOARD
// Kanban and Timeline views
// ============================================================

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@permits/src/components/ui/tabs';
import { PermitsKanbanView } from '@permits/src/components/permit/permits-kanban-view';
import { PermitsTimelineView } from '@permits/src/components/permit/permits-timeline-view';
import { Button } from '@permits/src/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function PermitsPage() {
  const [view, setView] = useState<'kanban' | 'timeline'>('kanban');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permits</h1>
          <p className="text-gray-500 mt-1">Manage your permit applications</p>
        </div>
        <Link href="/permits/dashboard/permits/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'timeline')}>
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-6">
          <PermitsKanbanView />
        </TabsContent>
        <TabsContent value="timeline" className="mt-6">
          <PermitsTimelineView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

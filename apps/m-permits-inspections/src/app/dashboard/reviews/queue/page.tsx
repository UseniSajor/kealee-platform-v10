// ============================================================
// REVIEW QUEUE - Smart Assignment Queue with AI Prioritization
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Calendar,
  TrendingUp,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ReviewQueueItem } from '@/components/reviews/review-queue-item';
import { ReviewQueueFilters } from '@/components/reviews/review-queue-filters';
import { WorkloadBalancer } from '@/components/reviews/workload-balancer';

interface ReviewQueueItem {
  id: string;
  permitId: string;
  permitNumber: string;
  permitType: string;
  projectName: string;
  submittedAt: Date;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  complexity: number; // 1-10
  estimatedReviewTime: number; // minutes
  assignedTo?: string;
  assignedToName?: string;
  discipline: string;
  aiScore?: number; // AI readiness score
  aiFindings?: number; // Number of AI-identified issues
  status: 'unassigned' | 'assigned' | 'in_progress' | 'completed';
}

export default function ReviewQueuePage() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'queue' | 'workload'>('queue');

  // Fetch review queue
  const { data: queueItems, isLoading } = useQuery({
    queryKey: ['review-queue', selectedDiscipline, selectedPriority],
    queryFn: async () => {
      const response = await fetch(
        `/api/reviews/queue?discipline=${selectedDiscipline}&priority=${selectedPriority}`
      );
      if (!response.ok) throw new Error('Failed to fetch queue');
      return response.json() as Promise<ReviewQueueItem[]>;
    },
  });

  // Fetch workload stats
  const { data: workloadStats } = useQuery({
    queryKey: ['review-workload'],
    queryFn: async () => {
      const response = await fetch('/api/reviews/workload');
      if (!response.ok) throw new Error('Failed to fetch workload');
      return response.json();
    },
  });

  // Auto-assign based on workload
  const handleAutoAssign = async () => {
    const response = await fetch('/api/reviews/auto-assign', {
      method: 'POST',
    });
    if (response.ok) {
      // Refetch queue
      window.location.reload();
    }
  };

  const highPriorityItems = queueItems?.filter(item => item.priority === 'high') || [];
  const mediumPriorityItems = queueItems?.filter(item => item.priority === 'medium') || [];
  const lowPriorityItems = queueItems?.filter(item => item.priority === 'low') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Queue</h1>
          <p className="text-muted-foreground mt-1">
            AI-prioritized permit review assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoAssign}>
            <User className="w-4 h-4 mr-2" />
            Auto-Assign
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueItems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {highPriorityItems.length} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueItems?.length 
                ? Math.round(
                    queueItems.reduce((sum, item) => sum + item.estimatedReviewTime, 0) / 
                    queueItems.length
                  )
                : 0
              }m
            </div>
            <p className="text-xs text-muted-foreground">Estimated average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Findings</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueItems?.reduce((sum, item) => sum + (item.aiFindings || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total issues identified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Workload Balance</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workloadStats?.balanceScore || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Distribution quality</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="queue">Priority Queue</TabsTrigger>
          <TabsTrigger value="workload">Workload View</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* High Priority */}
          {highPriorityItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-semibold">High Priority</h2>
                <Badge variant="destructive">{highPriorityItems.length}</Badge>
              </div>
              <div className="space-y-2">
                {highPriorityItems.map((item) => (
                  <ReviewQueueItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Medium Priority */}
          {mediumPriorityItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Medium Priority</h2>
                <Badge variant="secondary">{mediumPriorityItems.length}</Badge>
              </div>
              <div className="space-y-2">
                {mediumPriorityItems.map((item) => (
                  <ReviewQueueItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Low Priority */}
          {lowPriorityItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-semibold">Low Priority</h2>
                <Badge variant="outline">{lowPriorityItems.length}</Badge>
              </div>
              <div className="space-y-2">
                {lowPriorityItems.map((item) => (
                  <ReviewQueueItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading review queue...
            </div>
          )}

          {!isLoading && queueItems?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No reviews in queue
            </div>
          )}
        </TabsContent>

        <TabsContent value="workload">
          <WorkloadBalancer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

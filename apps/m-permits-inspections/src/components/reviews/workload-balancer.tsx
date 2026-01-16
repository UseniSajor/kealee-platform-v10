// ============================================================
// WORKLOAD BALANCER COMPONENT
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReviewerWorkload {
  reviewerId: string;
  reviewerName: string;
  discipline: string;
  assignedCount: number;
  inProgressCount: number;
  completedToday: number;
  estimatedHoursRemaining: number;
  workloadScore: number; // 0-100, higher = more balanced
}

export function WorkloadBalancer() {
  const { data: workloads, isLoading } = useQuery({
    queryKey: ['reviewer-workloads'],
    queryFn: async () => {
      const response = await fetch('/api/reviews/workload-balance');
      if (!response.ok) throw new Error('Failed to fetch workloads');
      return response.json() as Promise<ReviewerWorkload[]>;
    },
  });

  const handleRebalance = async () => {
    const response = await fetch('/api/reviews/rebalance', {
      method: 'POST',
    });
    if (response.ok) {
      window.location.reload();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading workload data...</div>;
  }

  const chartData = workloads?.map(w => ({
    name: w.reviewerName,
    assigned: w.assignedCount,
    inProgress: w.inProgressCount,
    hours: w.estimatedHoursRemaining,
  })) || [];

  const avgWorkload = workloads?.length
    ? workloads.reduce((sum, w) => sum + w.assignedCount, 0) / workloads.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workload Distribution</h2>
          <p className="text-muted-foreground text-sm">
            Balance review assignments across reviewers
          </p>
        </div>
        <Button onClick={handleRebalance}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Rebalance Workload
        </Button>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Reviewer Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="assigned" fill="#8884d8" name="Assigned" />
              <Bar dataKey="inProgress" fill="#82ca9d" name="In Progress" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Reviewer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workloads?.map((reviewer) => {
          const isOverloaded = reviewer.assignedCount > avgWorkload * 1.5;
          const isUnderloaded = reviewer.assignedCount < avgWorkload * 0.5;

          return (
            <Card key={reviewer.reviewerId} className={isOverloaded ? 'border-red-500' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{reviewer.reviewerName}</CardTitle>
                  <Badge variant={isOverloaded ? 'destructive' : isUnderloaded ? 'secondary' : 'default'}>
                    {reviewer.workloadScore}% balanced
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{reviewer.discipline}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Assigned:</span>
                  <span className="font-medium">{reviewer.assignedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">In Progress:</span>
                  <span className="font-medium">{reviewer.inProgressCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed Today:</span>
                  <span className="font-medium">{reviewer.completedToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Hours Remaining:</span>
                  <span className="font-medium">{reviewer.estimatedHoursRemaining}h</span>
                </div>
                {isOverloaded && (
                  <div className="flex items-center gap-1 text-sm text-red-500 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Overloaded</span>
                  </div>
                )}
                {isUnderloaded && (
                  <div className="flex items-center gap-1 text-sm text-blue-500 mt-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Available for more</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

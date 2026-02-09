'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  ClipboardList,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface StatsData {
  active: number;
  pending: number;
  completed: number;
}

interface EstimateData {
  id: string;
  name: string;
  amount: number;
  totalCost?: number;
  status: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentEstimates, setRecentEstimates] = useState<EstimateData[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [estimatesError, setEstimatesError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoadingStats(true);
      setStatsError(null);
      try {
        const response = await apiClient.getStats();
        if (response.success && response.data) {
          const metricsData = response.data as any;
          setStats({
            active: metricsData.active ?? metricsData.activeEstimates ?? 0,
            pending: metricsData.pending ?? metricsData.pendingReview ?? 0,
            completed: metricsData.completed ?? metricsData.completedThisMonth ?? 0,
          });
        } else {
          setStatsError(response.error || 'Failed to load stats');
        }
      } catch {
        setStatsError('Failed to load stats');
      } finally {
        setIsLoadingStats(false);
      }
    }

    async function fetchRecentEstimates() {
      setIsLoadingEstimates(true);
      setEstimatesError(null);
      try {
        const response = await apiClient.getEstimates({ limit: 5 });
        if (response.success && response.data) {
          const data = response.data as any;
          const estimates = Array.isArray(data) ? data : (data.estimates || data.items || []);
          setRecentEstimates(estimates);
        } else {
          setEstimatesError(response.error || 'Failed to load estimates');
        }
      } catch {
        setEstimatesError('Failed to load estimates');
      } finally {
        setIsLoadingEstimates(false);
      }
    }

    fetchStats();
    fetchRecentEstimates();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estimation Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your construction cost estimates
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Estimates
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : statsError ? (
              <p className="text-sm text-destructive">--</p>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.active ?? 0}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : statsError ? (
              <p className="text-sm text-destructive">--</p>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.pending ?? 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed This Month
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : statsError ? (
              <p className="text-sm text-destructive">--</p>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.completed ?? 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Estimates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Estimates</CardTitle>
          <CardDescription>
            Your most recently updated estimates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingEstimates ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Loading estimates...</span>
            </div>
          ) : estimatesError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{estimatesError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : recentEstimates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">No estimates yet</p>
              <Button asChild size="sm">
                <Link href="/dashboard/estimates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Estimate
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEstimates.map((estimate) => (
                <div
                  key={estimate.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{estimate.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Updated{' '}
                        {formatDate(estimate.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(estimate.amount ?? estimate.totalCost ?? 0)}
                      </p>
                      <Badge
                        variant={
                          estimate.status === 'draft'
                            ? 'outline'
                            : estimate.status === 'review'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {estimate.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/estimates/${estimate.id}/edit`}>
                        {estimate.status === 'draft' ? 'Edit' : 'View'}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild className="h-auto py-6 flex-col gap-2">
              <Link href="/dashboard/estimates/new">
                <Plus className="h-6 w-6" />
                <span>New Estimate</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
            >
              <Link href="/dashboard/estimates/new/from-bid">
                <ClipboardList className="h-6 w-6" />
                <span>From Bid Request</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
            >
              <Link href="/dashboard/assemblies">
                <Upload className="h-6 w-6" />
                <span>Browse Assemblies</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Use AI Scope Analysis when creating estimates to automatically detect work items from project descriptions.</li>
            <li>Browse the Assembly Library for pre-built cost groups that speed up estimate creation.</li>
            <li>Review cost database rates regularly to keep your estimates competitive and accurate.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

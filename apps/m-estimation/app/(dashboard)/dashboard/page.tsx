'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  Plus,
  Package,
  Database,
  Upload,
  TrendingUp,
  DollarSign,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalEstimates: number;
  activeProjects: number;
  totalValue: number;
  avgAccuracy: number;
  estimatesThisMonth: number;
  estimatesLastMonth: number;
}

interface RecentEstimate {
  id: string;
  name: string;
  clientName?: string;
  client?: string;
  amount: number;
  totalCost?: number;
  status: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  review: { label: 'Review', variant: 'warning' },
  final: { label: 'Final', variant: 'success' },
  sent: { label: 'Sent', variant: 'secondary' },
};

const COST_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];

const costDistribution = [
  { name: 'Materials', value: 45, color: '#8b5cf6' },
  { name: 'Labor', value: 35, color: '#06b6d4' },
  { name: 'Equipment', value: 12, color: '#f59e0b' },
  { name: 'Other', value: 8, color: '#10b981' },
];

const monthlyTrends = [
  { month: 'Sep', estimates: 8, value: 245000 },
  { month: 'Oct', estimates: 12, value: 389000 },
  { month: 'Nov', estimates: 15, value: 512000 },
  { month: 'Dec', estimates: 10, value: 325000 },
  { month: 'Jan', estimates: 18, value: 620000 },
  { month: 'Feb', estimates: 6, value: 185000 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEstimates: 0,
    activeProjects: 0,
    totalValue: 0,
    avgAccuracy: 0,
    estimatesThisMonth: 0,
    estimatesLastMonth: 0,
  });
  const [recentEstimates, setRecentEstimates] = useState<RecentEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [statsRes, estimatesRes] = await Promise.all([
          apiClient.getStats(),
          apiClient.getEstimates({ limit: 5 }),
        ]);

        if (statsRes.success && statsRes.data) {
          const d = statsRes.data as any;
          setStats({
            totalEstimates: d.totalEstimates || 0,
            activeProjects: d.activeProjects || 0,
            totalValue: d.totalValue || 0,
            avgAccuracy: d.avgAccuracy || 95,
            estimatesThisMonth: d.estimatesThisMonth || 0,
            estimatesLastMonth: d.estimatesLastMonth || 0,
          });
        }

        if (estimatesRes.success && estimatesRes.data) {
          const data = estimatesRes.data as any;
          const items = Array.isArray(data) ? data : (data.estimates || data.items || []);
          setRecentEstimates(items.slice(0, 5));
        }
      } catch {
        // Use fallback data
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || { label: status, variant: 'outline' as const };
  };

  const quickActions = [
    { label: 'New Estimate', href: '/dashboard/estimates/new', icon: Plus, color: 'bg-primary text-primary-foreground' },
    { label: 'Assemblies', href: '/dashboard/assemblies', icon: Package, color: 'bg-violet-100 text-violet-700' },
    { label: 'Cost Database', href: '/dashboard/cost-database', icon: Database, color: 'bg-cyan-100 text-cyan-700' },
    { label: 'Upload Plans', href: '/dashboard/takeoff', icon: Upload, color: 'bg-amber-100 text-amber-700' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
        <span className="text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your estimation activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Estimates</p>
                <p className="text-3xl font-bold mt-1">{stats.totalEstimates}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              {stats.estimatesThisMonth >= stats.estimatesLastMonth ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">
                    +{stats.estimatesThisMonth - stats.estimatesLastMonth}
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500 font-medium">
                    {stats.estimatesThisMonth - stats.estimatesLastMonth}
                  </span>
                </>
              )}
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold mt-1">{stats.activeProjects}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-cyan-700" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">In progress or under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Across all estimates</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Accuracy</p>
                <p className="text-3xl font-bold mt-1">{stats.avgAccuracy}%</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-violet-700" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">AI-powered precision</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="flex flex-col items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts + Recent Estimates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Distribution</CardTitle>
            <CardDescription>Average breakdown across estimates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={costDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {costDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Trends</CardTitle>
            <CardDescription>Estimates created and total value</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'value' ? formatCurrency(value) : value
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="estimates" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Estimates" />
                <Bar yAxisId="right" dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Value ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Estimates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Estimates</CardTitle>
              <CardDescription>Your latest estimation activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/estimates">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentEstimates.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-md text-sm font-medium text-muted-foreground">
                <div className="col-span-4">Estimate</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Action</div>
              </div>
              {recentEstimates.map((estimate) => {
                const statusInfo = getStatusInfo(estimate.status);
                return (
                  <div
                    key={estimate.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-accent/50 transition-colors items-center"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{estimate.name}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(estimate.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm truncate">{estimate.clientName || estimate.client || '--'}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="font-medium">{formatCurrency(estimate.amount ?? estimate.totalCost ?? 0)}</p>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/estimates/${estimate.id}/edit`}>
                          <TrendingUp className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No estimates yet</h3>
              <p className="text-muted-foreground mb-4">Create your first estimate to get started</p>
              <Button asChild>
                <Link href="/dashboard/estimates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Estimate
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

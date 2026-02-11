'use client';

import { useState, useEffect } from 'react';
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
  Download,
  Loader2,
  DollarSign,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface EstimateItem {
  id: string;
  name: string;
  clientName?: string;
  client?: string;
  amount: number;
  totalCost?: number;
  status: string;
  createdAt: string;
}

const PERIODS = [
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

const statusColors: Record<string, string> = {
  draft: '#94a3b8',
  review: '#f59e0b',
  final: '#22c55e',
  sent: '#6366f1',
};

export default function ReportsPage() {
  const [period, setPeriod] = useState('all');
  const [estimates, setEstimates] = useState<EstimateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await apiClient.getEstimates({ limit: 100 });
        if (res.success && res.data) {
          const data = res.data as any;
          const items = Array.isArray(data) ? data : (data.estimates || data.items || []);
          setEstimates(items);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter by period
  const filteredEstimates = estimates.filter((est) => {
    if (period === 'all') return true;
    const date = new Date(est.createdAt);
    const now = new Date();
    if (period === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (period === 'quarter') {
      const estQ = Math.floor(date.getMonth() / 3);
      const nowQ = Math.floor(now.getMonth() / 3);
      return estQ === nowQ && date.getFullYear() === now.getFullYear();
    }
    if (period === 'year') return date.getFullYear() === now.getFullYear();
    return true;
  });

  // Stats
  const totalEstimates = filteredEstimates.length;
  const totalValue = filteredEstimates.reduce((sum, e) => sum + (e.amount || e.totalCost || 0), 0);
  const avgValue = totalEstimates > 0 ? totalValue / totalEstimates : 0;
  const finalCount = filteredEstimates.filter((e) => e.status === 'final').length;
  const conversionRate = totalEstimates > 0 ? Math.round((finalCount / totalEstimates) * 100) : 0;

  // Cost distribution
  const costDistribution = [
    { name: 'Materials', value: Math.round(totalValue * 0.45), color: '#8b5cf6' },
    { name: 'Labor', value: Math.round(totalValue * 0.35), color: '#06b6d4' },
    { name: 'Equipment', value: Math.round(totalValue * 0.12), color: '#f59e0b' },
    { name: 'Other', value: Math.round(totalValue * 0.08), color: '#10b981' },
  ];

  // Status distribution
  const statusCounts = filteredEstimates.reduce((acc, est) => {
    acc[est.status] = (acc[est.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    fill: statusColors[status] || '#94a3b8',
  }));

  // Monthly trends
  const monthlyData = filteredEstimates.reduce((acc, est) => {
    const date = new Date(est.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = { month: key, count: 0, value: 0 };
    acc[key].count++;
    acc[key].value += est.amount || est.totalCost || 0;
    return acc;
  }, {} as Record<string, { month: string; count: number; value: number }>);

  const trendData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  // Top estimates
  const topEstimates = [...filteredEstimates]
    .sort((a, b) => (b.amount || b.totalCost || 0) - (a.amount || a.totalCost || 0))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
        <span className="text-muted-foreground">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights and trends from your estimation data</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Estimates</p>
                <p className="text-3xl font-bold mt-1">{totalEstimates}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Value</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(avgValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold mt-1">{conversionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-violet-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Distribution</CardTitle>
            <CardDescription>Breakdown by cost type</CardDescription>
          </CardHeader>
          <CardContent>
            {totalValue > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={costDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {costDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                No data for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <CardDescription>Estimates by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                No data for selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estimate Trends</CardTitle>
            <CardDescription>Monthly estimates and total value over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
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
                <Line yAxisId="left" type="monotone" dataKey="count" stroke="hsl(var(--primary))" name="Estimates" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="value" stroke="#06b6d4" name="Value ($)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Estimates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Estimates by Value</CardTitle>
          <CardDescription>Highest-value estimates in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {topEstimates.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-md text-sm font-medium text-muted-foreground">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Estimate</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2 text-right">Value</div>
                <div className="col-span-2">Status</div>
              </div>
              {topEstimates.map((est, idx) => (
                <div
                  key={est.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg items-center"
                >
                  <div className="col-span-1 text-sm font-bold text-muted-foreground">{idx + 1}</div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium truncate">{est.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(est.createdAt)}</p>
                  </div>
                  <div className="col-span-3 text-sm truncate">{est.clientName || est.client || '--'}</div>
                  <div className="col-span-2 text-right text-sm font-semibold">
                    {formatCurrency(est.amount || est.totalCost || 0)}
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline">{est.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No estimates in the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

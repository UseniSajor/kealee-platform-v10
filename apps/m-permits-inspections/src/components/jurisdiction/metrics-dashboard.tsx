/**
 * Usage Metrics Dashboard
 * Display permits processed, revenue collected, and other metrics
 */

'use client';

import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {TrendingUp, TrendingDown, DollarSign, FileText, Users, Clock} from 'lucide-react';
import {formatCurrency} from '@/lib/utils';

interface MetricsDashboardProps {
  jurisdictionId: string;
}

export function MetricsDashboard({jurisdictionId}: MetricsDashboardProps) {
  const {data: summary, isLoading} = useQuery({
    queryKey: ['jurisdiction-metrics', jurisdictionId],
    queryFn: async () => {
      const response = await fetch(`/api/jurisdictions/${jurisdictionId}/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading metrics...</div>;
  }

  if (!summary) {
    return <div className="text-center py-8">No metrics available</div>;
  }

  const {thisMonth, trends} = summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usage Metrics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Track permits processed, revenue collected, and system usage
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Permits Processed"
          value={thisMonth.permits.total}
          subtitle={`${thisMonth.permits.issued} issued`}
          trend={trends.permits}
          icon={FileText}
        />

        <MetricCard
          title="Revenue Collected"
          value={formatCurrency(thisMonth.revenue.thisMonth)}
          subtitle={`${formatCurrency(thisMonth.revenue.total)} total`}
          trend={trends.revenue}
          icon={DollarSign}
        />

        <MetricCard
          title="Active Reviews"
          value={thisMonth.reviews.total}
          subtitle={`${thisMonth.reviews.averageDays.toFixed(1)} days avg`}
          trend={trends.reviews}
          icon={Clock}
        />

        <MetricCard
          title="Staff Users"
          value={thisMonth.staff.total}
          subtitle={`${thisMonth.inspections.total} inspections`}
          trend={0}
          icon={Users}
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Permits by Type</CardTitle>
            <CardDescription>This month's permit breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(thisMonth.permits.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm">{type}</span>
                  <Badge>{count as number}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews by Discipline</CardTitle>
            <CardDescription>Review distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(thisMonth.reviews.byDiscipline).map(([discipline, count]) => (
                <div key={discipline} className="flex justify-between items-center">
                  <span className="text-sm">{discipline}</span>
                  <Badge>{count as number}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  trend: number;
  icon: any;
}) {
  const isPositive = trend >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(trend).toFixed(1)}% from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

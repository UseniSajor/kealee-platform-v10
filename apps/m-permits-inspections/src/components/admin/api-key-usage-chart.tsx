/**
 * API Key Usage Analytics Chart
 */

'use client';

import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Activity, TrendingUp, AlertCircle, Clock} from 'lucide-react';

interface ApiKeyUsageChartProps {
  keyId: string;
}

interface UsageData {
  keyId: string;
  period: {days: number; startDate: string};
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    avgResponseTime: number;
  };
  byEndpoint: Array<{
    endpoint: string;
    requests: number;
    avgResponseTime: number;
    errors: number;
    errorRate: number;
  }>;
  byDay: Array<{
    date: string;
    requests: number;
    errors: number;
  }>;
}

async function fetchUsage(keyId: string, days: number = 7): Promise<UsageData> {
  const response = await fetch(`/api/admin/api-keys/${keyId}/usage?days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch usage data');
  return response.json();
}

export function ApiKeyUsageChart({keyId}: ApiKeyUsageChartProps) {
  const {data: usage, isLoading} = useQuery({
    queryKey: ['api-key-usage', keyId],
    queryFn: () => fetchUsage(keyId, 7),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">Loading usage data...</CardContent>
      </Card>
    );
  }

  if (!usage || usage.summary.totalRequests === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
          <CardDescription>No usage data available for this API key</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-2xl">{usage.summary.totalRequests.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {usage.summary.successRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed Requests</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {usage.summary.failedRequests.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Response Time</CardDescription>
            <CardTitle className="text-2xl">{usage.summary.avgResponseTime}ms</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* By Endpoint */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Endpoint</CardTitle>
          <CardDescription>Request statistics per API endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usage.byEndpoint.map((endpoint) => (
              <div key={endpoint.endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{endpoint.endpoint}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {endpoint.requests.toLocaleString()} requests • {endpoint.avgResponseTime}ms avg
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {endpoint.errors > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {endpoint.errors} errors ({endpoint.errorRate.toFixed(1)}%)
                    </Badge>
                  )}
                  {endpoint.errors === 0 && (
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      <Activity className="h-3 w-3 mr-1" />
                      All successful
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage</CardTitle>
          <CardDescription>Requests and errors over the last {usage.period.days} days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {usage.byDay.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{day.requests} requests</span>
                  {day.errors > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {day.errors} errors
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

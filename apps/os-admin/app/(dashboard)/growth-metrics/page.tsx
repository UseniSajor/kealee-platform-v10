'use client';

import { useEffect, useState } from 'react';
import { Card } from '@kealee/ui';
import { GrowthAnalytics } from '@kealee/core-llm/analytics/growth-queries';

interface ExecutiveSummary {
  currentOwners: number;
  dailyUserGrowth: number;
  averageCAC: number;
  cacTrend: number;
  monthlyAcquisitions: number;
  estimatedLTV: number;
  churnRate: number;
  conversionRate: string;
}

interface GrowthTrend {
  date: string;
  owners: number;
  contractors: number;
  newOwners: number;
  cac: number;
}

interface ChannelMetric {
  channel: string;
  users: number;
  spend: number;
  cac: number;
  roi: number;
  conversionRate: number;
  retentionRate: number;
}

function MiniChart({
  data,
  color = '#2563eb',
}: {
  data: Array<{ value: number }>;
  color?: string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="flex h-[300px] items-end gap-1" role="img" aria-label="Metric trend chart">
      {data.map((item, index) => (
        <div
          key={index}
          className="min-w-1 flex-1 rounded-t"
          style={{ height: `${Math.max((item.value / max) * 100, 2)}%`, backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export default function GrowthMetricsPage() {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [trend, setTrend] = useState<GrowthTrend[]>([]);
  const [channels, setChannels] = useState<ChannelMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);
      const [summaryData, trendData, channelData] = await Promise.all([
        fetch('/api/growth/summary').then((r) => r.json()),
        fetch('/api/growth/trend?days=30').then((r) => r.json()),
        fetch('/api/growth/channels').then((r) => r.json()),
      ]);

      setSummary(summaryData);
      setTrend(trendData);
      setChannels(channelData);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !summary) {
    return <div className="p-8">Loading growth metrics...</div>;
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Growth Metrics Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time platform growth tracking and analytics</p>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <p className="text-gray-600 text-sm">Current Owners</p>
            <p className="text-3xl font-bold mt-2">{summary.currentOwners.toLocaleString()}</p>
            <p className={`text-sm mt-2 ${summary.dailyUserGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.dailyUserGrowth >= 0 ? '+' : ''}{summary.dailyUserGrowth.toFixed(1)}% vs yesterday
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm">Average CAC</p>
            <p className="text-3xl font-bold mt-2">${summary.averageCAC.toFixed(0)}</p>
            <p className={`text-sm mt-2 ${summary.cacTrend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.cacTrend >= 0 ? '+' : ''}{summary.cacTrend.toFixed(1)}% vs yesterday
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm">Estimated LTV</p>
            <p className="text-3xl font-bold mt-2">${summary.estimatedLTV.toFixed(0)}</p>
            <p className="text-sm mt-2 text-blue-600">LTV/CAC: {(summary.estimatedLTV / summary.averageCAC).toFixed(1)}x</p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm">Churn Rate</p>
            <p className="text-3xl font-bold mt-2">{summary.churnRate.toFixed(1)}%</p>
            <p className="text-sm mt-2 text-gray-600">Monthly</p>
          </Card>
        </div>
      )}

      {/* Growth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Owner Growth (30 Days)</h2>
          <MiniChart
            data={trend.map((d) => ({
              date: d.date,
              value: d.owners,
            }))}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">CAC Trend</h2>
          <MiniChart
            data={trend.map((d) => ({
              date: d.date,
              value: d.cac,
            }))}
            color="#ef4444"
          />
        </Card>
      </div>

      {/* Channel Performance */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Channel Performance</h2>
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              {['Channel', 'Users', 'Spend', 'CAC', 'ROI', 'Conv. Rate', 'Retention'].map((label) => (
                <th key={label} className="p-3 font-semibold">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.channel} className="border-b">
                <td className="p-3 font-medium">{channel.channel}</td>
                <td className="p-3">{channel.users.toLocaleString()}</td>
                <td className="p-3">${channel.spend.toLocaleString()}</td>
                <td className="p-3">${channel.cac.toFixed(0)}</td>
                <td className={`p-3 ${channel.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {channel.roi.toFixed(1)}%
                </td>
                <td className="p-3">{(channel.conversionRate * 100).toFixed(1)}%</td>
                <td className="p-3">{(channel.retentionRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Acquisition Breakdown */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Monthly Acquisitions Breakdown</h2>
        <MiniChart
          data={[
            { value: summary?.monthlyAcquisitions ? (summary.monthlyAcquisitions * 0.3) : 0 },
            { value: summary?.monthlyAcquisitions ? (summary.monthlyAcquisitions * 0.5) : 0 },
            { value: summary?.monthlyAcquisitions ? (summary.monthlyAcquisitions * 0.2) : 0 },
          ]}
        />
      </Card>

      {/* Funnel Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600">Conversion Rate</h3>
          <p className="text-2xl font-bold mt-2">{summary?.conversionRate}%</p>
          <p className="text-xs text-gray-500 mt-2">Signup to Project</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600">Payback Period</h3>
          <p className="text-2xl font-bold mt-2">
            {summary ? (summary.averageCAC / (25 * 1)).toFixed(1) : '0'} months
          </p>
          <p className="text-xs text-gray-500 mt-2">CAC / Monthly ARPU</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600">Annual Contract Value</h3>
          <p className="text-2xl font-bold mt-2">${summary ? (summary.currentOwners * 25 * 12).toLocaleString() : '0'}</p>
          <p className="text-xs text-gray-500 mt-2">Estimated Annual Revenue</p>
        </Card>
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-right text-xs text-gray-500">
        Auto-refreshing every minute • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

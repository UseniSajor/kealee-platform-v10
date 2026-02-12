'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

interface ScoreComponent {
  name: string;
  score: number;
  weight: number;
  trend: 'up' | 'down' | 'stable';
}

interface MonthlyEarning {
  month: string;
  amount: number;
}

interface MonthlyBid {
  month: string;
  submitted: number;
  won: number;
}

interface TopTrade {
  trade: string;
  projectCount: number;
  totalValue: number;
}

interface RatingDistribution {
  stars: number;
  count: number;
}

interface AnalyticsDashboard {
  contractorId: string;
  companyName: string;
  overallScore: {
    score: number;
    confidence: 'low' | 'medium' | 'high';
    trend: 'up' | 'down' | 'stable';
    trendValue: number;
  };
  scoreComponents: ScoreComponent[];
  earnings: {
    totalEarnings: number;
    last30Days: number;
    pendingPayments: number;
    earningsTrend: 'up' | 'down' | 'stable';
    monthlyEarnings: MonthlyEarning[];
  };
  bidPerformance: {
    winRate: number;
    totalSubmitted: number;
    totalWon: number;
    activeBids: number;
    bidsByMonth: MonthlyBid[];
  };
  portfolio: {
    projectsCompleted: number;
    activeProjects: number;
    onTimeRate: number;
    totalProjectValue: number;
    topTrades: TopTrade[];
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    distribution: RatingDistribution[];
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return '\u2191';
  if (trend === 'down') return '\u2193';
  return '\u2192';
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return 'text-green-600';
  if (trend === 'down') return 'text-red-600';
  return 'text-gray-500';
}

function getConfidenceBadge(confidence: 'low' | 'medium' | 'high'): {
  label: string;
  className: string;
} {
  switch (confidence) {
    case 'high':
      return { label: 'High Confidence', className: 'bg-green-100 text-green-700' };
    case 'medium':
      return { label: 'Medium Confidence', className: 'bg-yellow-100 text-yellow-700' };
    case 'low':
      return { label: 'Low Confidence', className: 'bg-gray-100 text-gray-600' };
  }
}

const COMPONENT_COLORS: Record<string, string> = {
  Responsiveness: 'bg-blue-500',
  'Bid Accuracy': 'bg-purple-500',
  'Schedule Adherence': 'bg-indigo-500',
  Quality: 'bg-green-500',
  'Client Satisfaction': 'bg-amber-500',
  Safety: 'bg-red-500',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// ============================================================================
// MAIN PAGE (with Suspense boundary for useSearchParams)
// ============================================================================

export default function ContractorAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading analytics...</p>
          </div>
        </div>
      }
    >
      <AnalyticsDashboardContent />
    </Suspense>
  );
}

// ============================================================================
// DASHBOARD CONTENT
// ============================================================================

function AnalyticsDashboardContent() {
  const searchParams = useSearchParams();
  const contractorId = searchParams.get('contractorId') || searchParams.get('id') || '';

  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractorId) {
      setError('No contractor ID provided. Add ?contractorId=xxx to the URL.');
      setLoading(false);
      return;
    }

    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API_BASE}/analytics/dashboard/contractor/${contractorId}`
        );
        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load analytics';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [contractorId]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading contractor analytics...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Analytics
          </h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ---------------------------------------------------------------------------
  // Dashboard Render
  // ---------------------------------------------------------------------------
  const confidenceBadge = getConfidenceBadge(data.overallScore.confidence);
  const maxMonthlyEarning = Math.max(...data.earnings.monthlyEarnings.map((m) => m.amount), 1);
  const maxMonthlyBids = Math.max(
    ...data.bidPerformance.bidsByMonth.map((m) => Math.max(m.submitted, m.won)),
    1
  );
  const maxDistCount = Math.max(...data.reviews.distribution.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Contractor Performance Scorecard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {data.companyName} &middot; ID: {data.contractorId}
              </p>
            </div>
            <a
              href={`/contractor-profile/${data.contractorId}`}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Profile &rarr;
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ================================================================= */}
        {/* 1. OVERALL SCORE HEADER                                          */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular Score */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 144 144">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  fill="none"
                  stroke={
                    data.overallScore.score >= 80
                      ? '#22c55e'
                      : data.overallScore.score >= 60
                        ? '#3b82f6'
                        : data.overallScore.score >= 40
                          ? '#eab308'
                          : '#ef4444'
                  }
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(data.overallScore.score / 100) * 389.56} 389.56`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreTextColor(data.overallScore.score)}`}>
                  {data.overallScore.score}
                </span>
                <span className="text-xs text-gray-400">out of 100</span>
              </div>
            </div>

            {/* Score Meta */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold text-gray-900">Overall Performance</h2>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${confidenceBadge.className}`}
                >
                  {confidenceBadge.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${getTrendColor(data.overallScore.trend)}`}
                >
                  {getTrendIcon(data.overallScore.trend)}{' '}
                  {data.overallScore.trendValue > 0 ? '+' : ''}
                  {data.overallScore.trendValue}% this quarter
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Composite score based on responsiveness, bid accuracy, schedule adherence,
                quality, client satisfaction, and safety.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. SCORE COMPONENTS                                              */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {data.scoreComponents.map((component) => {
              const barColor = COMPONENT_COLORS[component.name] || 'bg-blue-500';
              return (
                <div key={component.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {component.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${getTrendColor(component.trend)}`}
                      >
                        {getTrendIcon(component.trend)}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {component.score}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${component.score}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Weight: {(component.weight * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-column grid for Earnings + Bid Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ================================================================= */}
          {/* 3. EARNINGS OVERVIEW                                             */}
          {/* ================================================================= */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Overview</h3>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data.earnings.totalEarnings)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Last 30 Days</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data.earnings.last30Days)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Payments</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {formatCurrency(data.earnings.pendingPayments)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Trend</p>
                <p
                  className={`text-2xl font-bold mt-1 ${getTrendColor(data.earnings.earningsTrend)}`}
                >
                  {getTrendIcon(data.earnings.earningsTrend)}{' '}
                  {data.earnings.earningsTrend === 'up'
                    ? 'Growing'
                    : data.earnings.earningsTrend === 'down'
                      ? 'Declining'
                      : 'Stable'}
                </p>
              </div>
            </div>

            {/* Monthly Earnings Bar Chart */}
            <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Earnings</h4>
            <div className="flex items-end gap-2 h-32">
              {data.earnings.monthlyEarnings.map((m) => {
                const heightPct = Math.max((m.amount / maxMonthlyEarning) * 100, 4);
                return (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <span className="text-[10px] text-gray-500 mb-1">
                      {formatCurrency(m.amount)}
                    </span>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-gray-400 mt-1">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* 4. BID PERFORMANCE                                               */}
          {/* ================================================================= */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid Performance</h3>

            {/* Win Rate Gauge */}
            <div className="flex items-center gap-6 mb-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.bidPerformance.winRate / 100) * 251.33} 251.33`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-purple-600">
                    {data.bidPerformance.winRate}%
                  </span>
                  <span className="text-[10px] text-gray-400">Win Rate</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-xl font-bold text-gray-900">
                    {data.bidPerformance.totalSubmitted}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Won</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.bidPerformance.totalWon}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-purple-600">Active Bids</p>
                  <p className="text-xl font-bold text-purple-700">
                    {data.bidPerformance.activeBids}
                  </p>
                </div>
              </div>
            </div>

            {/* Bids by Month Chart */}
            <h4 className="text-sm font-medium text-gray-700 mb-3">Bids by Month</h4>
            <div className="flex items-end gap-2 h-32">
              {data.bidPerformance.bidsByMonth.map((m) => {
                const submittedPct = Math.max(
                  (m.submitted / maxMonthlyBids) * 100,
                  4
                );
                const wonPct = Math.max((m.won / maxMonthlyBids) * 100, 4);
                return (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <div className="flex items-end gap-0.5 w-full justify-center h-full">
                      <div
                        className="flex-1 bg-gray-300 rounded-t max-w-4"
                        style={{ height: `${submittedPct}%` }}
                        title={`${m.submitted} submitted`}
                      />
                      <div
                        className="flex-1 bg-purple-500 rounded-t max-w-4"
                        style={{ height: `${wonPct}%` }}
                        title={`${m.won} won`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">{m.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-gray-300 rounded-sm" />
                <span className="text-[10px] text-gray-500">Submitted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-purple-500 rounded-sm" />
                <span className="text-[10px] text-gray-500">Won</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column grid for Portfolio + Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ================================================================= */}
          {/* 5. PORTFOLIO INSIGHTS                                            */}
          {/* ================================================================= */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Insights</h3>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">
                  {data.portfolio.projectsCompleted}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="text-center bg-blue-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-600">
                  {data.portfolio.activeProjects}
                </p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="text-center bg-green-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-600">
                  {data.portfolio.onTimeRate}%
                </p>
                <p className="text-xs text-gray-500">On-Time</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Total Project Value
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.portfolio.totalProjectValue)}
              </p>
            </div>

            {/* Top Trades Table */}
            <h4 className="text-sm font-medium text-gray-700 mb-3">Top Trades</h4>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                      Trade
                    </th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase text-center">
                      Projects
                    </th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase text-right">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.portfolio.topTrades.map((trade) => (
                    <tr key={trade.trade} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {trade.trade}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">
                        {trade.projectCount}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {formatCurrency(trade.totalValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 6. REVIEWS                                                       */}
          {/* ================================================================= */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>

            {/* Average Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">
                  {data.reviews.averageRating.toFixed(1)}
                </p>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= Math.round(data.reviews.averageRating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      &#9733;
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {data.reviews.totalReviews} reviews
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((starLevel) => {
                  const dist = data.reviews.distribution.find(
                    (d) => d.stars === starLevel
                  );
                  const count = dist?.count ?? 0;
                  const pct =
                    data.reviews.totalReviews > 0
                      ? (count / maxDistCount) * 100
                      : 0;
                  return (
                    <div key={starLevel} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3 text-right">
                        {starLevel}
                      </span>
                      <span className="text-yellow-400 text-xs">&#9733;</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-yellow-400 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Total Reviews
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.reviews.totalReviews}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  5-Star Reviews
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {data.reviews.distribution.find((d) => d.stars === 5)?.count ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

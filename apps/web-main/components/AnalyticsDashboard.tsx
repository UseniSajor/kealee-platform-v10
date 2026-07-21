/**
 * Analytics Dashboard Component
 * Displays funnel metrics, conversion rates, and revenue tracking
 * Used by admins and business stakeholders
 */

'use client'

import React, { useState, useEffect } from 'react'

interface DashboardData {
  period: string
  aggregateMetrics: {
    totalViews: number
    totalConversions: number
    totalRevenue: string
    overallConversionRate: string
    averageOrderValue: string
  }
  byService: {
    concept: any
    estimation: any
    permits: any
  }
  insights: Array<{
    title: string
    value: string
    details: string
  }>
}

export default function AnalyticsDashboard({ days = 30 }: { days?: number }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch(`/api/v1/analytics/dashboard/summary?days=${days}`)
        if (!response.ok) throw new Error('Failed to fetch analytics')

        const result = await response.json()
        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [days])

  if (loading) {
    return <div className='dashboard-loader'>📊 Loading analytics...</div>
  }

  if (error || !data) {
    return <div className='dashboard-error'>⚠️ {error || 'No data available'}</div>
  }

  return (
    <div className='analytics-dashboard'>
      {/* Header */}
      <div className='dashboard-header'>
        <h2>📊 Conversion Funnel Analytics</h2>
        <p className='period'>{data.period}</p>
      </div>

      {/* Aggregate Metrics Cards */}
      <div className='metrics-grid'>
        <MetricCard label='Total Views' value={data.aggregateMetrics.totalViews.toLocaleString()} icon='👁️' />
        <MetricCard label='Conversions' value={data.aggregateMetrics.totalConversions.toLocaleString()} icon='✅' />
        <MetricCard label='Conversion Rate' value={data.aggregateMetrics.overallConversionRate} icon='📈' />
        <MetricCard label='Total Revenue' value={`$${data.aggregateMetrics.totalRevenue}`} icon='💰' />
        <MetricCard label='Average Order' value={`$${data.aggregateMetrics.averageOrderValue}`} icon='💳' />
      </div>

      {/* Insights */}
      <div className='insights-section'>
        <h3>🎯 Key Insights</h3>
        <div className='insights-grid'>
          {data.insights.map((insight, idx) => (
            <InsightCard key={idx} title={insight.title} value={insight.value} details={insight.details} />
          ))}
        </div>
      </div>

      {/* Service Breakdown */}
      <div className='service-breakdown'>
        <h3>📈 By Service</h3>
        <div className='service-grid'>
          <ServiceMetrics
            name='Concept'
            metrics={data.byService.concept}
            color='#FF6B6B'
          />
          <ServiceMetrics
            name='Estimation'
            metrics={data.byService.estimation}
            color='#4ECDC4'
          />
          <ServiceMetrics
            name='Permits'
            metrics={data.byService.permits}
            color='#FFE66D'
          />
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .analytics-dashboard {
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f7fa;
          border-radius: 8px;
        }

        .dashboard-loader,
        .dashboard-error {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          background: white;
          border-radius: 8px;
          margin: 20px 0;
        }

        .dashboard-error {
          background: #fff3cd;
          color: #856404;
        }

        .dashboard-header {
          margin-bottom: 32px;
        }

        .dashboard-header h2 {
          margin: 0;
          color: #333;
          font-size: 28px;
        }

        .period {
          color: #999;
          font-size: 14px;
          margin-top: 4px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .insights-section {
          margin-bottom: 32px;
        }

        .insights-section h3,
        .service-breakdown h3 {
          color: #333;
          font-size: 18px;
          margin: 0 0 16px;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .service-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
      `}</style>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className='metric-card'>
      <div className='metric-icon'>{icon}</div>
      <div className='metric-content'>
        <p className='metric-label'>{label}</p>
        <p className='metric-value'>{value}</p>
      </div>
      <style jsx>{`
        .metric-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .metric-icon {
          font-size: 32px;
        }

        .metric-content {
          flex: 1;
        }

        .metric-label {
          margin: 0;
          color: #999;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          margin: 4px 0 0;
          color: #333;
          font-size: 20px;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

function InsightCard({ title, value, details }: { title: string; value: string; details: string }) {
  return (
    <div className='insight-card'>
      <h4>{title}</h4>
      <p className='insight-value'>{value}</p>
      <p className='insight-details'>{details}</p>
      <style jsx>{`
        .insight-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #0066cc;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .insight-card h4 {
          margin: 0 0 8px;
          color: #333;
          font-size: 16px;
        }

        .insight-value {
          margin: 0;
          color: #0066cc;
          font-size: 24px;
          font-weight: bold;
        }

        .insight-details {
          margin: 8px 0 0;
          color: #999;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}

function ServiceMetrics({ name, metrics, color }: { name: string; metrics: any; color: string }) {
  return (
    <div className='service-metrics'>
      <h4 style={{ borderLeftColor: color }}>{name}</h4>
      <div className='metrics-list'>
        <div className='metric-row'>
          <span>Views</span>
          <strong>{metrics?.views || 0}</strong>
        </div>
        <div className='metric-row'>
          <span>Conversions</span>
          <strong>{metrics?.conversions || 0}</strong>
        </div>
        <div className='metric-row'>
          <span>Conversion Rate</span>
          <strong>{metrics?.conversionRate || '0%'}</strong>
        </div>
        <div className='metric-row'>
          <span>Revenue</span>
          <strong>${metrics?.totalRevenue || '0'}</strong>
        </div>
      </div>
      <style jsx>{`
        .service-metrics {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .service-metrics h4 {
          margin: 0 0 12px;
          padding-left: 8px;
          border-left: 4px solid ${color};
          color: #333;
          font-size: 16px;
        }

        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          padding: 8px;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .metric-row span {
          color: #666;
        }

        .metric-row strong {
          color: #333;
        }
      `}</style>
    </div>
  )
}

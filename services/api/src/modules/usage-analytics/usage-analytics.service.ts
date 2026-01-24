/**
 * Usage Analytics Service
 * Track API usage for billing and analytics
 */

import {getSupabaseClient} from '../../utils/supabase-client';

export interface UsageMetrics {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  jurisdictionId?: string;
  organizationId?: string;
}

export interface UsageSummary {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  requestsByStatus: Record<number, number>;
  period: {
    start: Date;
    end: Date;
  };
}

export class UsageAnalyticsService {
  private supabase = getSupabaseClient();

  /**
   * Record API usage
   */
  async recordUsage(metrics: UsageMetrics): Promise<void> {
    await this.supabase.from('ApiUsage').insert({
      apiKeyId: metrics.apiKeyId,
      endpoint: metrics.endpoint,
      method: metrics.method,
      statusCode: metrics.statusCode,
      responseTime: metrics.responseTime,
      timestamp: metrics.timestamp.toISOString(),
      jurisdictionId: metrics.jurisdictionId,
      organizationId: metrics.organizationId,
    });
  }

  /**
   * Get usage summary
   */
  async getUsageSummary(
    apiKeyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageSummary> {
    const {data: usage} = await this.supabase
      .from('ApiUsage')
      .select('*')
      .eq('apiKeyId', apiKeyId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (!usage || usage.length === 0) {
      return {
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        requestsByEndpoint: {},
        requestsByStatus: {},
        period: {start: startDate, end: endDate},
      };
    }

    const totalRequests = usage.length;
    const totalErrors = usage.filter(u => u.statusCode >= 400).length;
    const averageResponseTime =
      usage.reduce((sum, u) => sum + u.responseTime, 0) / totalRequests;

    const requestsByEndpoint: Record<string, number> = {};
    const requestsByStatus: Record<number, number> = {};

    for (const u of usage) {
      requestsByEndpoint[u.endpoint] = (requestsByEndpoint[u.endpoint] || 0) + 1;
      requestsByStatus[u.statusCode] = (requestsByStatus[u.statusCode] || 0) + 1;
    }

    return {
      totalRequests,
      totalErrors,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      requestsByEndpoint,
      requestsByStatus,
      period: {start: startDate, end: endDate},
    };
  }

  /**
   * Get billing usage (for integration with billing service)
   */
  async getBillingUsage(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    billableRequests: number;
    estimatedCost: number;
  }> {
    const {data: usage} = await this.supabase
      .from('ApiUsage')
      .select('*')
      .eq('organizationId', organizationId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (!usage || usage.length === 0) {
      return {
        totalRequests: 0,
        billableRequests: 0,
        estimatedCost: 0,
      };
    }

    const totalRequests = usage.length;
    // Billable requests exclude errors and health checks
    const billableRequests = usage.filter(
      u => u.statusCode < 400 && !u.endpoint.includes('/health')
    ).length;

    // Simple pricing: $0.001 per request
    const estimatedCost = billableRequests * 0.001;

    return {
      totalRequests,
      billableRequests,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
    };
  }
}

export const usageAnalyticsService = new UsageAnalyticsService();

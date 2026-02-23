/**
 * API Key Usage Analytics
 */

import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/api-keys/[id]/usage - Get usage stats for API key
export async function GET(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get usage data
    const {data: usage, error} = await supabase
      .from('ApiKeyUsage')
      .select('*')
      .eq('keyId', id)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', {ascending: false});

    if (error) throw error;

    // Calculate stats
    const totalRequests = usage?.length || 0;
    const successfulRequests =
      usage?.filter(u => u.statusCode >= 200 && u.statusCode < 300).length || 0;
    const failedRequests = totalRequests - successfulRequests;
    const avgResponseTime =
      usage?.reduce((sum, u) => sum + (u.responseTime || 0), 0) / totalRequests || 0;

    // Group by endpoint
    const endpointStats = (usage || []).reduce((acc: any, u) => {
      const endpoint = u.endpoint || 'unknown';
      if (!acc[endpoint]) {
        acc[endpoint] = {count: 0, totalTime: 0, errors: 0};
      }
      acc[endpoint].count++;
      acc[endpoint].totalTime += u.responseTime || 0;
      if (u.statusCode >= 400) acc[endpoint].errors++;
      return acc;
    }, {});

    // Group by day
    const dailyStats = (usage || []).reduce((acc: any, u) => {
      const date = new Date(u.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {requests: 0, errors: 0};
      }
      acc[date].requests++;
      if (u.statusCode >= 400) acc[date].errors++;
      return acc;
    }, {});

    return NextResponse.json({
      keyId: id,
      period: {days, startDate: startDate.toISOString()},
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
      },
      byEndpoint: Object.entries(endpointStats).map(([endpoint, stats]: [string, any]) => ({
        endpoint,
        requests: stats.count,
        avgResponseTime: Math.round(stats.totalTime / stats.count),
        errors: stats.errors,
        errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0,
      })),
      byDay: Object.entries(dailyStats)
        .map(([date, stats]: [string, any]) => ({
          date,
          requests: stats.requests,
          errors: stats.errors,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}

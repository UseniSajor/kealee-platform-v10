import {NextRequest, NextResponse} from 'next/server';
import {metricsService} from '@permits/src/services/jurisdiction/metrics-service';

/**
 * GET /api/jurisdictions/:jurisdictionId/metrics
 * Get usage metrics for jurisdiction
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string}}
) {
  try {
    const {jurisdictionId} = params;

    const summary = await metricsService.getDashboardSummary(jurisdictionId);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Metrics error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

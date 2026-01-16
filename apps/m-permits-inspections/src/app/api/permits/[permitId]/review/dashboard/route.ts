import {NextRequest, NextResponse} from 'next/server';
import {reviewProgressTrackingService} from '@/services/review-workflow/progress-tracking';

/**
 * GET /api/permits/:permitId/review/dashboard
 * Get review dashboard for permit
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {permitId: string}}
) {
  try {
    const {permitId} = params;

    const dashboard = await reviewProgressTrackingService.getReviewDashboard(permitId);

    return NextResponse.json(dashboard);
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

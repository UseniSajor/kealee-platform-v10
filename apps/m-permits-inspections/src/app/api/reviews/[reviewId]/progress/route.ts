import {NextRequest, NextResponse} from 'next/server';
import {progressTrackerService} from '@/services/review-preparation/progress-tracker';

/**
 * GET /api/reviews/:reviewId/progress
 * Get review progress
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {reviewId: string}}
) {
  try {
    const {reviewId} = params;

    const progress = await progressTrackerService.trackProgress(reviewId);

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Progress tracking error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

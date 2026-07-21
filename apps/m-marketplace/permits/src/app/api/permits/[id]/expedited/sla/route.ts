import {NextRequest, NextResponse} from 'next/server';
import {slaTrackingService} from '@permits/src/services/expedited/sla-tracking';

/**
 * GET /api/permits/:permitId/expedited/sla
 * Get SLA tracking for expedited permit
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {permitId: string}}
) {
  try {
    const {permitId} = params;

    const tracking = await slaTrackingService.trackSLA(permitId);

    return NextResponse.json(tracking);
  } catch (error: any) {
    console.error('SLA tracking error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

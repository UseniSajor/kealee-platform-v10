import {NextRequest, NextResponse} from 'next/server';
import {escalationService} from '@/services/permit-routing/escalation-service';

/**
 * POST /api/escalations/check
 * Check and trigger escalations for overdue reviews
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {jurisdictionId} = body;

    // Check escalations
    const events = await escalationService.checkEscalations(jurisdictionId);

    return NextResponse.json({
      success: true,
      eventsTriggered: events.length,
      events,
    });
  } catch (error: any) {
    console.error('Escalation check error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

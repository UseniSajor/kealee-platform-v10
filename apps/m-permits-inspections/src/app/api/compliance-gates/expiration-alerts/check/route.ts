import {NextRequest, NextResponse} from 'next/server';
import {expirationAlertsService} from '@/services/compliance-gates/expiration-alerts';

/**
 * POST /api/compliance-gates/expiration-alerts/check
 * Check for expiring permits and send alerts (cron job endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const alerts = await expirationAlertsService.checkAndSendExpirationAlerts();

    return NextResponse.json({
      alertsSent: alerts.length,
      alerts,
    });
  } catch (error: any) {
    console.error('Expiration alerts error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

/**
 * GET /api/compliance-gates/expiration-alerts?daysAhead=30&jurisdictionId=xxx
 * Get expiring permits
 */
export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('daysAhead') || '30');
    const jurisdictionId = searchParams.get('jurisdictionId') || undefined;

    const expiringPermits = await expirationAlertsService.getExpiringPermits(
      daysAhead,
      jurisdictionId
    );

    return NextResponse.json(expiringPermits);
  } catch (error: any) {
    console.error('Get expiring permits error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

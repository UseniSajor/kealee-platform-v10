import { NextResponse } from 'next/server';

/**
 * GET /api/webhooks/events
 * Fetches webhook events from the backend API
 */
export async function GET(request: Request) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    // Fetch webhook status from backend
    const response = await fetch(`${apiBaseUrl}/webhooks/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch webhook events' }));
      return NextResponse.json(
        { error: error.error || 'Failed to fetch webhook events' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform backend audit logs to webhook events format
    const events = (data.recentLogs || []).map((log: any) => {
      const after = log.after || {};
      const status = log.action === 'STRIPE_WEBHOOK_ERROR' 
        ? 'failed' 
        : after.status === 'VERIFIED' 
        ? 'success' 
        : 'pending';
      
      return {
        id: log.id,
        event_type: after.eventType || 'unknown',
        event_id: after.eventId || log.entityId || 'unknown',
        status,
        received_at: log.createdAt,
        processed_at: status === 'success' ? log.createdAt : undefined,
        error: after.error || (status === 'failed' ? 'Processing failed' : undefined),
      };
    });

    return NextResponse.json({ events });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch webhook events';
    console.error('Webhook events fetch error:', error);
    return NextResponse.json(
      { error: message, events: [] },
      { status: 500 }
    );
  }
}

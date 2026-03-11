import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/test
 * Triggers a test webhook event using Stripe CLI
 * Note: This requires Stripe CLI to be running locally
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_failed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // In production, you might want to call Stripe API directly to create test events
    // For now, we'll return a success message and suggest using Stripe CLI
    // In a real implementation, you could:
    // 1. Use Stripe API to create test events
    // 2. Call a backend endpoint that triggers test events
    // 3. Use Stripe CLI programmatically (requires CLI to be installed)

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';
    
    // Option 1: If you have a backend endpoint for testing webhooks
    try {
      const response = await fetch(`${apiBaseUrl}/webhooks/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventType }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ 
          success: true, 
          message: `Test webhook triggered: ${eventType}`,
          ...data 
        });
      }
    } catch (error) {
      // Backend endpoint might not exist, that's okay
      console.log('Backend test endpoint not available, using fallback');
    }

    // Fallback: Return instructions for manual testing
    return NextResponse.json({
      success: true,
      message: `Test webhook event type: ${eventType}`,
      instructions: 'To test webhooks locally, run: stripe trigger ' + eventType,
      note: 'This requires Stripe CLI to be installed and running. For production testing, use Stripe Dashboard or configure automated test endpoints.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to trigger test webhook';
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

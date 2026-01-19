import { NextResponse } from "next/server";

/**
 * Stripe Webhook Handler
 * 
 * IMPORTANT: For production, configure Stripe to send webhooks directly to the backend API:
 * https://your-api-domain.com/billing/stripe/webhook
 * 
 * This route forwards webhooks to the backend API for processing.
 * The backend API has proper signature verification and subscription sync.
 */
export async function POST(req: Request) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe-Signature header' },
        { status: 400 }
      );
    }

    // Forward to backend API for processing
    const response = await fetch(`${apiBaseUrl}/billing/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: rawBody,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Webhook processing failed' }));
      return NextResponse.json(
        { error: error.error || 'Webhook processing failed' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook processing error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


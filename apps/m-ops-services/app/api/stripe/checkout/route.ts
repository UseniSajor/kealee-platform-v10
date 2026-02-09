// apps/m-ops-services/app/api/stripe/checkout/route.ts
// Stripe Checkout Session creation - proxies to backend API

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, email, name } = body;

    if (!packageId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Proxy to backend Stripe checkout endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/api/stripe/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth token if present
        ...(request.headers.get('authorization')
          ? { Authorization: request.headers.get('authorization')! }
          : {}),
      },
      body: JSON.stringify({
        packageId,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
        customerEmail: email,
      }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: 'Backend checkout failed' }));
      return NextResponse.json(
        { error: error.error || error.message || 'Failed to create checkout session' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({
      id: data.sessionId || data.id,
      url: data.url,
      customerId: data.customerId,
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

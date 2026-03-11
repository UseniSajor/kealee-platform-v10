// apps/m-ops-services/app/api/checkout/route.ts
export const dynamic = 'force-dynamic';
// API route for processing checkout - proxies to backend Stripe checkout

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.packageId || !body.email || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate package ID
    const validPackages = ['a', 'b', 'c', 'd'];
    if (!validPackages.includes(body.packageId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    // Proxy to backend billing checkout endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/billing/stripe/checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth token if present
        ...(request.headers.get('authorization')
          ? { Authorization: request.headers.get('authorization')! }
          : {}),
      },
      body: JSON.stringify({
        orgId: body.orgId || undefined,
        planSlug: `package-${body.packageId}`,
        interval: body.interval || 'month',
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
        customerEmail: body.email,
      }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: 'Backend checkout failed' }));
      return NextResponse.json(
        { success: false, error: error.error || 'Failed to process checkout' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json(
      {
        success: true,
        message: 'Checkout session created',
        checkoutSessionId: data.id,
        checkoutUrl: data.url,
        subscription: {
          packageId: body.packageId,
          email: body.email,
          name: body.name,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}

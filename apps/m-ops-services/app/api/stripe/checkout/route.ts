// apps/m-ops-services/app/api/stripe/checkout/route.ts
// Stripe Checkout Session creation

import { NextRequest, NextResponse } from 'next/server';

const PACKAGE_PRICES: Record<string, number> = {
  a: 1750,
  b: 4500,
  c: 8500,
  d: 16500,
};

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

    const price = PACKAGE_PRICES[packageId];
    if (!price) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    // TODO: Integrate with actual Stripe API
    // For now, return mock checkout session
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Package ${packageId.toUpperCase()} - Project Management`,
            },
            unit_amount: price * 100, // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          packageId,
          customerName: name,
        },
      },
      metadata: {
        packageId,
        customerName: name,
      },
    });

    return NextResponse.json({
      id: session.id,
      url: session.url,
      customerId: session.customer,
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// ── Stripe client — only initialize if secret key is available ──
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
  : null;

// Price ID mapping — read from environment, filter out undefined
const PRICE_IDS: Record<string, string | undefined> = {
  A: process.env.STRIPE_PRICE_PACKAGE_A,
  B: process.env.STRIPE_PRICE_PACKAGE_B,
  C: process.env.STRIPE_PRICE_PACKAGE_C,
  D: process.env.STRIPE_PRICE_PACKAGE_D,
};

export async function POST(request: NextRequest) {
  try {
    // ── Guard: Stripe not configured ──
    if (!stripe) {
      console.error('[Checkout] STRIPE_SECRET_KEY is not set — cannot create checkout session');
      return NextResponse.json(
        { error: 'Payment processing is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const { packageId } = await request.json();

    if (!packageId || !(packageId in PRICE_IDS)) {
      return NextResponse.json(
        { error: 'Invalid package ID. Valid packages: A, B, C, D' },
        { status: 400 }
      );
    }

    // ── Guard: Price ID not configured for this package ──
    const priceId = PRICE_IDS[packageId];
    if (!priceId) {
      console.error(`[Checkout] STRIPE_PRICE_PACKAGE_${packageId} is not set in environment`);
      return NextResponse.json(
        {
          error: `Package ${packageId} pricing is not configured yet. Please contact support or set STRIPE_PRICE_PACKAGE_${packageId} in environment variables.`,
          missingEnvVar: `STRIPE_PRICE_PACKAGE_${packageId}`,
        },
        { status: 503 }
      );
    }

    // Get or create customer
    const customer = await stripe.customers.create({
      metadata: { packageId },
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
      metadata: { packageId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

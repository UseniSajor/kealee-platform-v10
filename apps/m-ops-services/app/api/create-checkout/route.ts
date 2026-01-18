import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16',
});

// Price ID mapping
const PRICE_IDS: Record<string, string> = {
  A: process.env.STRIPE_PRICE_PACKAGE_A!,
  B: process.env.STRIPE_PRICE_PACKAGE_B!,
  C: process.env.STRIPE_PRICE_PACKAGE_C!,
  D: process.env.STRIPE_PRICE_PACKAGE_D!,
};

export async function POST(request: NextRequest) {
  try {
    const { packageId } = await request.json();

    if (!packageId || !PRICE_IDS[packageId]) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    // Get or create customer (you'll want to tie this to your user auth)
    // For now, we'll create a new customer each time
    const customer = await stripe.customers.create({
      metadata: {
        packageId,
      },
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[packageId],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        packageId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

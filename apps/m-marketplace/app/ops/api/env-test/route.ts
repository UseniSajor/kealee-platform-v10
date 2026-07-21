import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

/**
 * GET /api/env-test
 * Test endpoint to verify environment variables are loaded correctly
 * Note: Only returns non-sensitive variables for security
 */
export async function GET() {
  try {
    // Only return safe, non-sensitive environment variables
    const safeEnvVars = {
      NODE_ENV: process.env.NODE_ENV,
      APP_NAME: process.env.APP_NAME || 'm-ops-services',
      APP_ENV: process.env.APP_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      // Check if critical variables exist (without exposing values)
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasStripePublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(safeEnvVars);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get environment variables';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

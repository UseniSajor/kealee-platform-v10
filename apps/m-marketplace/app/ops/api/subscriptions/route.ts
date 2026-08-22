import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthToken } from '@/lib/clerk-server-auth';
export const dynamic = 'force-dynamic';

/**
 * Subscription Management Routes (Proxy to Backend API)
 * 
 * These routes forward subscription requests to the backend API
 * which handles database sync, webhooks, and Stripe operations.
 * 
 * The backend API handles authentication and authorization.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * Get authentication token for backend API
 * Gets token from Authorization header or cookies (Supabase sets cookies)
 */
const getAuthToken = getRequestAuthToken;

/**
 * Check if user is authenticated (basic check)
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  return Boolean(await getAuthToken(request));
}

/**
 * GET /api/subscriptions - List all subscriptions for current user
 * Proxies to: GET /billing/subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    if (!(await isAuthenticated(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const authToken = await getAuthToken(request);
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/billing/subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch subscriptions' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching subscriptions:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch subscriptions';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions - Create subscription directly
 * Proxies to: POST /billing/subscriptions
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    if (!(await isAuthenticated(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const authToken = await getAuthToken(request);
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create subscription' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to create subscription';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscriptions - Update subscription (cancel, reactivate, upgrade, downgrade)
 * Note: subscriptionId should be provided in the request body
 * For URL-based updates, use: PATCH /api/subscriptions/:subscriptionId
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check if user is authenticated
    if (!(await isAuthenticated(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const authToken = await getAuthToken(request);
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, ...updateData } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required in request body' },
        { status: 400 }
      );
    }

    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/billing/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update subscription' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error updating subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to update subscription';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

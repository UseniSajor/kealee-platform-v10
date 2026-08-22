import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthToken } from '@/lib/clerk-server-auth';
export const dynamic = 'force-dynamic';

/**
 * Subscription Management Routes (Proxy to Backend API)
 * 
 * Route for updating subscriptions by ID from URL path
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
 * PATCH /api/subscriptions/:subscriptionId - Update subscription (cancel, reactivate, upgrade, downgrade)
 * Proxies to: PATCH /billing/subscriptions/:subscriptionId
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
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

    const { subscriptionId } = params;
    const body = await request.json();

    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/billing/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
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

import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthToken } from '@/lib/clerk-server-auth';
export const dynamic = 'force-dynamic';

/**
 * Payment Method Management Routes (Proxy to Backend API)
 * 
 * These routes forward payment method requests to the backend API
 * which handles Stripe operations for managing customer payment methods.
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
 * POST /api/payment-methods - Attach payment method to customer
 * Proxies to: POST /payments/payment-methods
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
    const response = await fetch(`${API_BASE_URL}/payments/payment-methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to attach payment method' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error('Error attaching payment method:', error);
    const message = error instanceof Error ? error.message : 'Failed to attach payment method';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment-methods - List payment methods for customer
 * Proxies to: GET /payments/payment-methods?customerId=...
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/payments/payment-methods?customerId=${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to list payment methods' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error listing payment methods:', error);
    const message = error instanceof Error ? error.message : 'Failed to list payment methods';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

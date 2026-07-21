import { NextRequest, NextResponse } from 'next/server';

/**
 * Payment Method Management Routes (Proxy to Backend API)
 * 
 * Route for managing individual payment methods by ID
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * Get authentication token for backend API
 */
async function getAuthToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const cookies = request.cookies;
    const accessToken = cookies.get('sb-access-token')?.value || 
                       cookies.get('supabase.auth.token')?.value;

    if (accessToken) {
      try {
        const parsed = JSON.parse(accessToken);
        return parsed?.access_token || accessToken;
      } catch {
        return accessToken;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return true;
  }

  const cookies = request.cookies;
  return !!(
    cookies.get('sb-access-token')?.value || 
    cookies.get('supabase.auth.token')?.value
  );
}

/**
 * DELETE /api/payment-methods/:paymentMethodId - Delete payment method
 * Proxies to: DELETE /payments/payment-methods/:paymentMethodId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { paymentMethodId: string } }
) {
  try {
    if (!isAuthenticated(request)) {
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

    const { paymentMethodId } = params;

    const response = await fetch(`${API_BASE_URL}/payments/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete payment method' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error deleting payment method:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete payment method';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payment-methods/:paymentMethodId/set-default - Set default payment method
 * Proxies to: POST /payments/payment-methods/:paymentMethodId/set-default
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { paymentMethodId: string } }
) {
  try {
    if (!isAuthenticated(request)) {
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

    const { paymentMethodId } = params;
    const body = await request.json();

    if (!body.customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/payments/payment-methods/${paymentMethodId}/set-default`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ customerId: body.customerId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to set default payment method' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error setting default payment method:', error);
    const message = error instanceof Error ? error.message : 'Failed to set default payment method';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

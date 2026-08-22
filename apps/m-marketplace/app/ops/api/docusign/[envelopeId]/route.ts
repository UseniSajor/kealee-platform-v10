import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthToken } from '@/lib/clerk-server-auth';
export const dynamic = 'force-dynamic';

/**
 * DocuSign Envelope Management Routes (Proxy to Backend API)
 * 
 * Route for managing individual envelopes by ID
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

const getAuthToken = getRequestAuthToken;

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  return Boolean(await getAuthToken(request));
}

/**
 * PUT /api/docusign/:envelopeId - Update envelope (void, remind, resend)
 * Proxies to: PUT /docusign/envelopes/:envelopeId
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { envelopeId: string } }
) {
  try {
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

    const { envelopeId } = params;
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/docusign/envelopes/${envelopeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update envelope' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error updating DocuSign envelope:', error);
    const message = error instanceof Error ? error.message : 'Failed to update envelope';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

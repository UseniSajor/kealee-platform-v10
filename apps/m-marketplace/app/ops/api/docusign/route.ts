import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

/**
 * DocuSign Management Routes (Proxy to Backend API)
 * 
 * These routes forward DocuSign requests to the backend API
 * which handles DocuSign operations, envelope management, and document tracking.
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
 * GET /api/docusign - List envelopes, get auth URL, get document info, or get envelope status
 * Proxies to: GET /docusign/envelopes, GET /docusign/auth, GET /docusign/envelopes/:envelopeId/documents/:documentId
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const documentId = searchParams.get('documentId');
    const envelopeId = searchParams.get('envelopeId');
    const action = searchParams.get('action');

    // Handle auth URL request
    if (action === 'auth') {
      const redirectUri = searchParams.get('redirectUri') || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/docusign/callback`;
      const response = await fetch(`${API_BASE_URL}/docusign/auth?redirectUri=${encodeURIComponent(redirectUri)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to get auth URL' }));
        return NextResponse.json(error, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Handle document info request
    if (envelopeId && documentId) {
      const response = await fetch(`${API_BASE_URL}/docusign/envelopes/${envelopeId}/documents/${documentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to get document info' }));
        return NextResponse.json(error, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Handle template-based envelope creation (legacy support)
    if (templateId) {
      // This would need to be handled via POST, but for backward compatibility
      // we'll return an error suggesting to use POST instead
      return NextResponse.json(
        { error: 'Use POST /api/docusign to create envelopes from templates' },
        { status: 400 }
      );
    }

    // List envelopes (default)
    const queryString = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}/docusign/envelopes${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to list envelopes' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error in DocuSign GET:', error);
    const message = error instanceof Error ? error.message : 'DocuSign API error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/docusign - Create envelope from template
 * Proxies to: POST /docusign/envelopes
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/docusign/envelopes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create envelope' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating DocuSign envelope:', error);
    const message = error instanceof Error ? error.message : 'Failed to create envelope';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/docusign - Update envelope (void, remind, resend)
 * Proxies to: PUT /docusign/envelopes/:envelopeId
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { envelopeId, ...updateData } = body;

    if (!envelopeId) {
      return NextResponse.json(
        { error: 'envelopeId is required in request body' },
        { status: 400 }
      );
    }

    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/docusign/envelopes/${envelopeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(updateData),
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

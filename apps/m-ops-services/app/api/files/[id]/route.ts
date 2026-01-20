import { NextRequest, NextResponse } from 'next/server';

/**
 * File Management Routes (Proxy to Backend API)
 *
 * Routes for getting, downloading, and deleting files by ID
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * Get authentication token for backend API
 * Gets token from Authorization header or cookies (Supabase sets cookies)
 */
async function getAuthToken(request: NextRequest): Promise<string | null> {
  try {
    // First, try to get from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get from cookies (Supabase sets 'sb-access-token' cookie)
    const cookies = request.cookies;
    const accessToken = cookies.get('sb-access-token')?.value ||
                       cookies.get('supabase.auth.token')?.value;

    if (accessToken) {
      try {
        // If it's JSON, parse it
        const parsed = JSON.parse(accessToken);
        return parsed?.access_token || accessToken;
      } catch {
        // If it's already a string, use it directly
        return accessToken;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (basic check)
 */
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
 * GET /api/files/:id - Get file metadata
 * Proxies to: GET /files/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    let backendUrl = `${API_BASE_URL}/files/${id}`;
    if (action === 'download') {
      backendUrl = `${API_BASE_URL}/files/${id}/download`;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch file' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching file:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch file';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/:id - Delete file
 * Proxies to: DELETE /files/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete file' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error deleting file:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete file';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

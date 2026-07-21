import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

/**
 * File Upload/Management Routes (Proxy to Backend API)
 *
 * These routes forward file operations to the backend API
 * which handles S3/R2 uploads, validation, and database operations.
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
 * POST /api/files - Upload file directly
 * Proxies to: POST /files
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

    // Forward multipart/form-data to backend
    const formData = await request.formData();

    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        // Don't set Content-Type - let fetch set it with boundary for multipart
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'File upload failed' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error('File upload error:', error);
    const message = error instanceof Error ? error.message : 'File upload failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/files - List user's files
 * Proxies to: GET /files
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
    const queryString = searchParams.toString();

    const response = await fetch(`${API_BASE_URL}/files${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch files' }));
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching files:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch files';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

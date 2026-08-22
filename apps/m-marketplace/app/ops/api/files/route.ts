import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthToken } from '@/lib/clerk-server-auth';
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
const getAuthToken = getRequestAuthToken;

/**
 * Check if user is authenticated (basic check)
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  return Boolean(await getAuthToken(request));
}

/**
 * POST /api/files - Upload file directly
 * Proxies to: POST /files
 */
export async function POST(request: NextRequest) {
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

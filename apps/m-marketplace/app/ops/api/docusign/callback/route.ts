import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * DocuSign Callback Route (Proxy to Backend API)
 * 
 * Handles DocuSign OAuth redirects and signing completion callbacks.
 * This route forwards callback requests to the backend API which handles
 * database updates and event creation.
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
 * GET /api/docusign/callback - Handle DocuSign callback
 * Proxies to: GET /docusign/callback
 * 
 * This endpoint handles:
 * - OAuth redirects from DocuSign
 * - Signing completion callbacks
 * - Document status updates
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    if (!isAuthenticated(request)) {
      // Redirect to sign in if not authenticated
      const signInUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin`;
      return NextResponse.redirect(signInUrl);
    }

    const authToken = await getAuthToken(request);
    if (!authToken) {
      const signInUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin`;
      return NextResponse.redirect(signInUrl);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const envelopeId = searchParams.get('envelopeId');
    const event = searchParams.get('event');
    const state = searchParams.get('state');

    // Build query string for backend
    const queryParams = new URLSearchParams();
    if (envelopeId) queryParams.append('envelopeId', envelopeId);
    if (event) queryParams.append('event', event);
    if (state) queryParams.append('state', state);

    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/docusign/callback?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Backend will return a redirect, so we need to get the redirect URL from the response
    if (response.redirected) {
      return NextResponse.redirect(response.url);
    }

    // If backend doesn't redirect, try to get redirect URL from response
    if (response.ok) {
      try {
        const data = await response.json();
        if (data.redirectUrl) {
          return NextResponse.redirect(data.redirectUrl);
        }
      } catch {
        // If response is not JSON, it might be a redirect
        // Use the state parameter or default redirect
        const redirectUrl = state || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents`;
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Fallback: redirect to documents page
    const redirectUrl = state || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents`;
    return NextResponse.redirect(redirectUrl);
  } catch (error: unknown) {
    console.error('DocuSign callback error:', error);
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents?error=callback_failed`;
    return NextResponse.redirect(errorUrl);
  }
}

/**
 * API Key Admin Routes
 * Proxy to Fastify API service
 */

import {NextRequest, NextResponse} from 'next/server';
import {createServerComponentClient} from '@supabase/auth-helpers-nextjs';
import {cookies} from 'next/headers';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function getSessionToken(): Promise<string | null> {
  const supabase = createServerComponentClient({cookies});
  const {
    data: {session},
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// GET /api/admin/api-keys - List all API keys
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const searchParams = request.nextUrl.searchParams;
    const jurisdictionId = searchParams.get('jurisdictionId');
    const organizationId = searchParams.get('organizationId');

    const url = new URL(`${API_BASE_URL}/api/v1/api-keys`);
    if (jurisdictionId) url.searchParams.set('jurisdictionId', jurisdictionId);
    if (organizationId) url.searchParams.set('organizationId', organizationId);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}

// POST /api/admin/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/v1/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {status: 201});
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}

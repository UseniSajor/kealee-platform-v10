// apps/m-project-owner/app/api/owner/projects/draft/route.ts
// API route for saving project drafts - proxies to backend pre-con API

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Map the wizard form data to the backend createPreCon schema.
 *
 * The wizard collects: name, location, type, budget, startDate, endDate,
 * description, contractorChoice.
 *
 * The backend POST /owner/precon/owner/projects expects: name, category, description,
 * address (optional), city (optional), state (optional), zipCode (optional),
 * squareFootage (optional), etc.
 */
function mapFormToPrecon(body: Record<string, unknown>) {
  const typeToCategory: Record<string, string> = {
    Renovation: 'RENOVATION',
    'New Build': 'NEW_CONSTRUCTION',
    Addition: 'ADDITION',
    Remodel: 'KITCHEN',
  };

  // Construct a description from the form data if not provided
  const description =
    (body.description as string) ||
    `Draft project: ${body.name || 'Untitled'}. Location: ${body.location || 'TBD'}. Budget: ${body.budget || 'TBD'}.`;

  return {
    name: (body.name as string) || 'Untitled Draft',
    category: typeToCategory[(body.type as string) || ''] || 'OTHER',
    description,
    address: (body.location as string) || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get auth token from Supabase session
    const token = await getSessionToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Map form data to precon schema and proxy to backend API
    const backendBody = mapFormToPrecon(body);

    const backendResponse = await fetch(`${API_URL}/owner/precon/owner/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(backendBody),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || data.message || 'Failed to save draft',
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Draft saved successfully',
        draftId: data.precon?.id,
        precon: data.precon,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

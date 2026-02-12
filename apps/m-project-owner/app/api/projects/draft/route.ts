// apps/m-project-owner/app/api/projects/draft/route.ts
// API route for saving project drafts - proxies to backend pre-con API

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Map the wizard form data to the backend createPreCon schema.
 *
 * The wizard collects: name, location, type, budget, startDate, endDate,
 * description, contractorChoice.
 *
 * The backend POST /precon/projects expects: name, category, description,
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

    // Forward the auth token from the incoming request
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    let token: string | null = null;
    if (authHeader) {
      token = authHeader;
    } else if (cookieHeader) {
      const match = cookieHeader.match(/sb-access-token=([^;]+)/);
      if (match) {
        token = `Bearer ${match[1]}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token;
    }

    // Map form data to precon schema and proxy to backend API
    const backendBody = mapFormToPrecon(body);

    const backendResponse = await fetch(`${API_URL}/precon/projects`, {
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

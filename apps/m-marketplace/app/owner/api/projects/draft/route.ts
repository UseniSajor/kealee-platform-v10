// apps/m-project-owner/app/api/owner/projects/draft/route.ts
export const dynamic = 'force-dynamic';
// API route for saving project drafts - proxies to backend pre-con API

import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthToken } from '@/lib/clerk-server-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

    const token = await getRequestAuthToken(request);
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    headers['Authorization'] = `Bearer ${token}`;

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

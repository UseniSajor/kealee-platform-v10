// apps/m-project-owner/app/api/projects/route.ts
// API route for creating projects - proxies to backend API

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Map the wizard form data to the backend createProject schema.
 *
 * The wizard collects: name, location, type, budget, startDate, endDate,
 * description, contractorChoice.
 *
 * The backend POST /projects expects: name, description, category,
 * orgId (optional), categoryMetadata (optional).
 */
function mapFormToBackend(body: Record<string, unknown>) {
  // Map the wizard "type" field to a valid ProjectCategory enum value
  const typeToCategory: Record<string, string> = {
    Renovation: 'RENOVATION',
    'New Build': 'NEW_CONSTRUCTION',
    Addition: 'ADDITION',
    Remodel: 'KITCHEN', // closest match for remodels
  };

  return {
    name: body.name as string,
    description: (body.description as string) || undefined,
    category: typeToCategory[(body.type as string) || ''] || 'OTHER',
    categoryMetadata: {
      location: body.location,
      budget: body.budget,
      startDate: body.startDate,
      endDate: body.endDate,
      contractorChoice: body.contractorChoice,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.location) {
      return NextResponse.json(
        { success: false, error: 'Name and location are required' },
        { status: 400 }
      );
    }

    // Forward the auth token from the incoming request
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // Try to extract token from Authorization header or from sb-access-token cookie
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

    // Map form data to backend schema and proxy to backend API
    const backendBody = mapFormToBackend(body);

    const backendResponse = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(backendBody),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || data.message || 'Failed to create project',
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Project created successfully',
        projectId: data.project?.id,
        project: data.project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

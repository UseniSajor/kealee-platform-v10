// apps/m-project-owner/app/api/owner/projects/route.ts
export const dynamic = 'force-dynamic';
// API route for creating projects - proxies to backend API

import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuthToken } from '@/lib/clerk-server-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Map the wizard form data to the backend createProject schema.
 *
 * The wizard collects: name, location, type, budget, startDate, endDate,
 * description, contractorChoice.
 *
 * The backend POST /owner/projects expects: name, description, category,
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

    const token = await getRequestAuthToken(request);
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    headers['Authorization'] = `Bearer ${token}`;

    // Map form data to backend schema and proxy to backend API
    const backendBody = mapFormToBackend(body);

    const backendResponse = await fetch(`${API_URL}/owner/projects`, {
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

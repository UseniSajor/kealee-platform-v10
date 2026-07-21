// apps/m-permits-inspections/app/api/permits/route.ts
// API route for creating permit applications - proxies to backend /permits/applications

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.address || !body.jurisdiction) {
      return NextResponse.json(
        { success: false, error: 'Address and jurisdiction are required' },
        { status: 400 }
      );
    }

    if (!body.permitTypes || body.permitTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one permit type is required' },
        { status: 400 }
      );
    }

    // Forward auth header from the incoming request
    const authHeader = request.headers.get('Authorization') || '';

    // Map frontend payload to the backend /permits/applications schema
    const backendPayload = {
      jurisdictionId: body.jurisdiction,
      permitType: (body.permitTypes[0] || 'BUILDING').toUpperCase(),
      projectData: {
        address: body.address,
        parcelId: body.parcelNumber || undefined,
        valuation: body.projectDetails?.valuation || body.valuation || 1000,
        scope: body.projectDetails?.scopeOfWork || body.projectDetails?.description || body.scope || '',
        ownerName: body.applicantInfo?.name || body.applicantName || '',
        contractorName: body.applicantInfo?.contractorName || '',
        contractorLicense: body.applicantInfo?.licenseNumber || '',
        squareFootage: body.projectDetails?.squareFootage || undefined,
      },
      documents: (body.documents || []).map((doc: any) => ({
        type: doc.type || 'general',
        url: doc.url || doc.fileUrl || '',
      })),
      expedited: body.priority === 'expedited' || body.priority === 'emergency',
    };

    // Call the backend permit application service
    const response = await fetch(`${API_URL}/permits/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(backendPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to create application on backend' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Permit application submitted successfully',
        applicationId: data.id || data.application?.id,
        application: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating permit application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

// apps/m-architect/app/api/quote/route.ts
// API route for submitting quote requests

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const projectType = formData.get('projectType') as string;
    const scope = formData.get('scope') as string;
    const timeline = formData.get('timeline') as string;
    const budget = formData.get('budget') as string;
    const files = formData.getAll('files') as File[];

    // Validate required fields
    if (!name || !email || !projectType || !scope) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // TODO: Implement actual quote request processing
    // - Save to database
    // - Upload files to S3
    // - Send confirmation email
    // - Notify team
    // - Create tracking record

    const quoteId = 'QUO-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

    return NextResponse.json(
      {
        success: true,
        message: 'Quote request submitted successfully',
        quoteId,
        quote: {
          id: quoteId,
          name,
          email,
          phone,
          projectType,
          scope,
          timeline,
          budget,
          fileCount: files.length,
          submittedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting quote request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit quote request' },
      { status: 500 }
    );
  }
}

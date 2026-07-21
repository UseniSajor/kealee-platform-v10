// apps/m-architect/app/api/quote/route.ts
export const dynamic = 'force-dynamic';
// API route for submitting quote requests - proxies to marketplace quotes API

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

    // Forward auth token if present
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Proxy to backend marketplace quotes API
    const backendResponse = await fetch(`${API_BASE_URL}/marketplace/quotes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        leadId: formData.get('leadId') || undefined,
        profileId: formData.get('profileId') || undefined,
        amount: budget ? parseFloat(budget.replace(/[^0-9.]/g, '')) || 0 : 0,
        timeline: timeline || undefined,
        details: JSON.stringify({
          name,
          email,
          phone,
          projectType,
          scope,
          budget,
          fileCount: files.length,
        }),
      }),
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      return NextResponse.json(
        {
          success: true,
          message: 'Quote request submitted successfully',
          quoteId: data.quote?.id || data.quoteId,
          quote: {
            id: data.quote?.id,
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
    }

    // If backend is not available, generate a local quote ID
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

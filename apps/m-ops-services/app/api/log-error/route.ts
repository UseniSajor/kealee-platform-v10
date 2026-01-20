import { NextRequest, NextResponse } from 'next/server';

/**
 * Error Logging API Route
 * Receives client-side errors and forwards them to the backend API
 * for centralized error tracking and monitoring
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * POST /api/log-error - Log client-side error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate error data
    if (!body.error && !body.message) {
      return NextResponse.json(
        { error: 'Error message is required' },
        { status: 400 }
      );
    }

    // Forward to backend API if error logging endpoint exists
    // For now, we'll just log it server-side
    console.error('Client-side error logged:', {
      error: body.error || body.message,
      stack: body.stack,
      componentStack: body.componentStack,
      url: body.url,
      pathname: body.pathname,
      userAgent: body.userAgent,
      timestamp: body.timestamp,
    });

    // Optionally forward to backend API for centralized logging
    // Uncomment when backend error logging endpoint is available:
    /*
    try {
      await fetch(`${API_BASE_URL}/errors/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'client',
          error: body.error || body.message,
          stack: body.stack,
          componentStack: body.componentStack,
          url: body.url,
          pathname: body.pathname,
          userAgent: body.userAgent,
          timestamp: body.timestamp,
        }),
      });
    } catch (backendError) {
      console.error('Failed to forward error to backend:', backendError);
    }
    */

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in log-error route:', error);
    const message = error instanceof Error ? error.message : 'Failed to log error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

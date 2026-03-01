/**
 * Next.js API Route — KeaBot Chat Proxy
 *
 * Proxies chat requests from the frontend widget to the Fastify API.
 * This avoids CORS issues and keeps the API URL server-side.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${API_URL}/keabot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Chat service unavailable' },
      { status: 503 },
    );
  }
}

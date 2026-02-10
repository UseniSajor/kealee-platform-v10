import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_URL}/v1/scope-analysis/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errorText = await res.text().catch(() => 'Unknown error');
    return NextResponse.json(
      { error: 'Analysis service unavailable', details: errorText },
      { status: res.status },
    );
  } catch (error) {
    console.error('Scope analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze project scope' },
      { status: 500 },
    );
  }
}

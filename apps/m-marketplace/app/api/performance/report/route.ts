import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Performance report endpoint - accept silently
    console.log('Performance report received:', Object.keys(body).length, 'metrics');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}

import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.error('Client error:', body.message, body.context);
    return NextResponse.json({ logged: true });
  } catch {
    return NextResponse.json({ logged: true });
  }
}

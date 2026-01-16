import { NextResponse } from "next/server";

// NOTE: Placeholder Stripe webhook handler.
// Real implementation should verify the signature and use the raw body.
export async function POST() {
  return NextResponse.json({ ok: true, received: true });
}


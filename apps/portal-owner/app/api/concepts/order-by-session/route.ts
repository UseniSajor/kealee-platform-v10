import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId)
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    const authHeader = req.headers.get("authorization");
    const res = await fetch(
      `${API_BASE}/api/v1/concepts/order-by-session?session_id=${sessionId}`,
      {
        headers: authHeader ? { authorization: authHeader } : {},
      },
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

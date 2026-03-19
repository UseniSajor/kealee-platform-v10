import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("authorization");
    const res = await fetch(`${API_BASE}/api/v1/concepts/intake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

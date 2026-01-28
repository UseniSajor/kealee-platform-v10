import { NextResponse } from "next/server";

// Note: ServiceRequest model doesn't exist in Prisma schema yet
// This is a stub implementation that returns empty data

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      data: [],
      message: "Service requests feature not yet implemented",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      ok: true,
      data: {
        id: `sr-${Date.now()}`,
        ...body,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
      message: "Service request created (stub)",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      ok: true,
      data: body,
      message: "Service request updated (stub)",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

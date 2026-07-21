import { NextRequest, NextResponse } from "next/server";
import { executeExteriorConceptWorkflow } from "@kealee/ai/exterior-concept";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await executeExteriorConceptWorkflow({
      userMessageHistory: body.messages ?? [],
      intakeData: body.intakeData ?? {},
      humanDecision: body.humanDecision,
      intakeId: body.intakeId,
      status: body.status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[exterior-concept] error:", error);
    return NextResponse.json(
      {
        ok: false,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

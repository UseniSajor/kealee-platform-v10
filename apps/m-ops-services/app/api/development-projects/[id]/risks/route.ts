import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-projects/[id]/risks - List risk alerts for project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const searchParams = request.nextUrl.searchParams;

    // Verify project exists
    const project = await prisma.developmentProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Optional filters
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("activeOnly") !== "false"; // defaults to true

    const where: any = { projectId };
    if (severity) where.severity = severity;
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;

    const risks = await prisma.devRiskAlert.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });

    // Compute summary
    const summary = {
      total: risks.length,
      bySeverity: {
        CRITICAL: risks.filter((r) => r.severity === "CRITICAL").length,
        HIGH: risks.filter((r) => r.severity === "HIGH").length,
        MEDIUM: risks.filter((r) => r.severity === "MEDIUM").length,
        LOW: risks.filter((r) => r.severity === "LOW").length,
      },
      totalEstimatedCostImpact: risks
        .filter((r) => r.estimatedCostImpact)
        .reduce((sum, r) => sum + Number(r.estimatedCostImpact), 0),
      totalEstimatedScheduleImpact: risks
        .filter((r) => r.estimatedScheduleImpact)
        .reduce((sum, r) => sum + (r.estimatedScheduleImpact || 0), 0),
      acknowledged: risks.filter((r) => r.acknowledgedAt).length,
      unacknowledged: risks.filter((r) => !r.acknowledgedAt).length,
    };

    return NextResponse.json({
      risks,
      summary,
    });
  } catch (error) {
    console.error("Error fetching risk alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk alerts" },
      { status: 500 }
    );
  }
}

// POST /api/development-projects/[id]/risks - Create risk alert
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body = await request.json();

    // Verify project exists
    const project = await prisma.developmentProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!body.title || !body.description || !body.severity || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, severity, category" },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (!validSeverities.includes(body.severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(", ")}` },
        { status: 400 }
      );
    }

    const risk = await prisma.devRiskAlert.create({
      data: {
        projectId,
        title: body.title,
        description: body.description,
        severity: body.severity,
        category: body.category,
        aiDetected: body.aiDetected || false,
        aiConfidence: body.aiConfidence,
        aiRecommendation: body.aiRecommendation,
        estimatedCostImpact: body.estimatedCostImpact,
        estimatedScheduleImpact: body.estimatedScheduleImpact,
        probabilityPercent: body.probabilityPercent,
        mitigationPlan: body.mitigationPlan,
        isActive: true,
      },
    });

    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    console.error("Error creating risk alert:", error);
    return NextResponse.json(
      { error: "Failed to create risk alert" },
      { status: 500 }
    );
  }
}

// PATCH /api/development-projects/[id]/risks - Acknowledge or resolve risk (requires riskId in body)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body = await request.json();

    if (!body.riskId) {
      return NextResponse.json(
        { error: "Missing required field: riskId" },
        { status: 400 }
      );
    }

    // Verify risk belongs to project
    const existing = await prisma.devRiskAlert.findFirst({
      where: { id: body.riskId, projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Risk alert not found for this project" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Handle acknowledge action
    if (body.action === "acknowledge") {
      if (existing.acknowledgedAt) {
        return NextResponse.json(
          { error: "Risk alert has already been acknowledged" },
          { status: 400 }
        );
      }
      updateData.acknowledgedAt = new Date();
      updateData.acknowledgedBy = body.userId || body.acknowledgedBy;
    }

    // Handle resolve action
    if (body.action === "resolve") {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = body.userId || body.resolvedBy;
      updateData.isActive = false;
      // Auto-acknowledge if not yet acknowledged
      if (!existing.acknowledgedAt) {
        updateData.acknowledgedAt = new Date();
        updateData.acknowledgedBy = body.userId || body.resolvedBy;
      }
    }

    // Handle mitigate action
    if (body.action === "mitigate") {
      updateData.mitigatedAt = new Date();
      updateData.mitigatedBy = body.userId || body.mitigatedBy;
      if (body.mitigationPlan) {
        updateData.mitigationPlan = body.mitigationPlan;
      }
    }

    // Allow direct field updates as well
    const directFields = [
      "title",
      "description",
      "severity",
      "category",
      "estimatedCostImpact",
      "estimatedScheduleImpact",
      "probabilityPercent",
      "mitigationPlan",
      "aiRecommendation",
      "isActive",
    ];

    for (const field of directFields) {
      if (body[field] !== undefined && !updateData[field]) {
        updateData[field] = body[field];
      }
    }

    const risk = await prisma.devRiskAlert.update({
      where: { id: body.riskId },
      data: updateData,
    });

    return NextResponse.json(risk);
  } catch (error) {
    console.error("Error updating risk alert:", error);
    return NextResponse.json(
      { error: "Failed to update risk alert" },
      { status: 500 }
    );
  }
}

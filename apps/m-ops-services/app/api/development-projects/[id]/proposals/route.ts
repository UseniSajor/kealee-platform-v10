import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-projects/[id]/proposals - List proposals for project
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
    const status = searchParams.get("status");
    const serviceTier = searchParams.get("serviceTier");

    const where: any = { projectId };
    if (status) where.status = status;
    if (serviceTier) where.serviceTier = serviceTier;

    const proposals = await prisma.devProposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Summary
    const summary = {
      total: proposals.length,
      draft: proposals.filter((p) => p.status === "DRAFT").length,
      sent: proposals.filter((p) => p.status === "SENT").length,
      accepted: proposals.filter((p) => p.status === "ACCEPTED").length,
      rejected: proposals.filter((p) => p.status === "REJECTED").length,
      totalEstimatedValue: proposals
        .filter((p) => p.totalEstimate)
        .reduce((sum, p) => sum + Number(p.totalEstimate), 0),
    };

    return NextResponse.json({
      proposals,
      summary,
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

// POST /api/development-projects/[id]/proposals - Create proposal
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

    if (!body.title || !body.serviceTier || !body.scopeOfWork) {
      return NextResponse.json(
        { error: "Missing required fields: title, serviceTier, scopeOfWork" },
        { status: 400 }
      );
    }

    // Auto-generate proposal number: DEV-PROP-{YYYYMM}-{seq}
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `DEV-PROP-${yearMonth}-`;

    // Find the latest proposal number with this prefix to determine sequence
    const latestProposal = await prisma.devProposal.findFirst({
      where: {
        proposalNumber: { startsWith: prefix },
      },
      orderBy: { proposalNumber: "desc" },
      select: { proposalNumber: true },
    });

    let seq = 1;
    if (latestProposal) {
      const lastSeq = parseInt(latestProposal.proposalNumber.replace(prefix, ""));
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    const proposalNumber = `${prefix}${String(seq).padStart(3, "0")}`;

    // Calculate totalSavingsEstimate if applicable
    let totalSavingsEstimate = body.totalSavingsEstimate;
    if (!totalSavingsEstimate && (body.cpaceEstimate || body.taxCreditEstimate)) {
      totalSavingsEstimate =
        (Number(body.cpaceEstimate) || 0) + (Number(body.taxCreditEstimate) || 0);
    }

    const proposal = await prisma.devProposal.create({
      data: {
        projectId,
        proposalNumber,
        title: body.title,
        version: body.version || 1,
        serviceTier: body.serviceTier,
        scopeOfWork: body.scopeOfWork,
        exclusions: body.exclusions,
        assumptions: body.assumptions,
        timeline: body.timeline,
        monthlyFee: body.monthlyFee,
        setupFee: body.setupFee,
        totalEstimate: body.totalEstimate,
        paymentTerms: body.paymentTerms,
        cpaceEstimate: body.cpaceEstimate,
        taxCreditEstimate: body.taxCreditEstimate,
        totalSavingsEstimate: totalSavingsEstimate,
        status: "DRAFT",
        documentUrl: body.documentUrl,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 }
    );
  }
}

// PATCH /api/development-projects/[id]/proposals - Update proposal status (requires proposalId in body)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body = await request.json();

    if (!body.proposalId) {
      return NextResponse.json(
        { error: "Missing required field: proposalId" },
        { status: 400 }
      );
    }

    // Verify proposal belongs to project
    const existing = await prisma.devProposal.findFirst({
      where: { id: body.proposalId, projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Proposal not found for this project" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Handle status transitions with timestamps
    if (body.status) {
      updateData.status = body.status;

      switch (body.status) {
        case "SENT":
          updateData.sentAt = new Date();
          break;
        case "VIEWED":
          updateData.viewedAt = new Date();
          break;
        case "ACCEPTED":
          updateData.acceptedAt = new Date();
          // Auto-set viewed if not already
          if (!existing.viewedAt) {
            updateData.viewedAt = new Date();
          }
          break;
        case "REJECTED":
          updateData.rejectedAt = new Date();
          updateData.rejectionReason = body.rejectionReason || null;
          // Auto-set viewed if not already
          if (!existing.viewedAt) {
            updateData.viewedAt = new Date();
          }
          break;
      }
    }

    // Allow updating other fields
    const directFields = [
      "title",
      "version",
      "serviceTier",
      "scopeOfWork",
      "exclusions",
      "assumptions",
      "timeline",
      "monthlyFee",
      "setupFee",
      "totalEstimate",
      "paymentTerms",
      "cpaceEstimate",
      "taxCreditEstimate",
      "totalSavingsEstimate",
      "documentUrl",
      "signatureUrl",
      "rejectionReason",
    ];

    for (const field of directFields) {
      if (body[field] !== undefined && updateData[field] === undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle signed date
    if (body.signedAt) {
      updateData.signedAt = new Date(body.signedAt);
    }

    const proposal = await prisma.devProposal.update({
      where: { id: body.proposalId },
      data: updateData,
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 }
    );
  }
}

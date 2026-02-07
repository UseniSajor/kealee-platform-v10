import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-projects - List projects with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filters
    const status = searchParams.get("status");
    const assignedPmId = searchParams.get("assignedPmId");
    const clientEmail = searchParams.get("clientEmail");
    const search = searchParams.get("search");
    const serviceTier = searchParams.get("serviceTier");
    const assetType = searchParams.get("assetType");

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (assignedPmId) where.assignedPmId = assignedPmId;
    if (clientEmail) where.clientEmail = clientEmail;
    if (serviceTier) where.serviceTier = serviceTier;
    if (assetType) where.assetType = assetType;

    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
        { clientCompany: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch projects with milestone counts and latest report
    const [projects, total] = await Promise.all([
      prisma.developmentProject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          milestones: {
            select: {
              id: true,
              status: true,
            },
          },
          reports: {
            orderBy: { reportNumber: "desc" },
            take: 1,
            select: {
              id: true,
              reportNumber: true,
              title: true,
              status: true,
              periodStart: true,
              periodEnd: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              milestones: true,
              reports: true,
              riskAlerts: true,
              proposals: true,
              documents: true,
            },
          },
        },
      }),
      prisma.developmentProject.count({ where }),
    ]);

    // Transform to include milestone summary
    const projectsWithSummary = projects.map((project) => {
      const milestonesByStatus = project.milestones.reduce(
        (acc: Record<string, number>, m) => {
          acc[m.status] = (acc[m.status] || 0) + 1;
          return acc;
        },
        {}
      );

      return {
        ...project,
        milestoneSummary: {
          total: project.milestones.length,
          byStatus: milestonesByStatus,
        },
        latestReport: project.reports[0] || null,
        milestones: undefined,
        reports: undefined,
      };
    });

    return NextResponse.json({
      projects: projectsWithSummary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching development projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch development projects" },
      { status: 500 }
    );
  }
}

// POST /api/development-projects - Create project from lead conversion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If converting from a lead, fetch lead data
    if (body.leadId) {
      const lead = await prisma.developmentLead.findUnique({
        where: { id: body.leadId },
      });

      if (!lead) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        );
      }

      if (lead.status === "WON") {
        return NextResponse.json(
          { error: "Lead has already been converted" },
          { status: 400 }
        );
      }

      // Create project from lead data
      const project = await prisma.developmentProject.create({
        data: {
          leadId: lead.id,
          clientName: lead.fullName,
          clientCompany: lead.company,
          clientEmail: lead.email,
          clientPhone: lead.phone,
          projectName: body.projectName || `${lead.company} - ${lead.assetType} Development`,
          address: body.address || lead.location,
          city: body.city,
          state: body.state,
          assetType: lead.assetType,
          totalUnits: body.totalUnits || (lead.notUnitBased ? null : parseInt(lead.units) || null),
          totalBudget: body.totalBudget,
          status: "INTAKE",
          estimatedStart: body.estimatedStart ? new Date(body.estimatedStart) : undefined,
          estimatedEnd: body.estimatedEnd ? new Date(body.estimatedEnd) : undefined,
          assignedPmId: body.assignedPmId || lead.assignedTo,
          assignedTeam: body.assignedTeam || [],
          serviceTier: body.serviceTier,
          monthlyFee: body.monthlyFee,
          contractStartDate: body.contractStartDate ? new Date(body.contractStartDate) : undefined,
          contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : undefined,
          cpaceApplicable: body.cpaceApplicable || false,
          historicTaxCredits: body.historicTaxCredits || false,
          lihtcApplicable: body.lihtcApplicable || false,
          opportunityZone: body.opportunityZone || false,
          incentiveNotes: body.incentiveNotes,
        },
        include: {
          _count: {
            select: {
              milestones: true,
              reports: true,
              riskAlerts: true,
              proposals: true,
              documents: true,
            },
          },
        },
      });

      // Update lead status to WON
      await prisma.developmentLead.update({
        where: { id: lead.id },
        data: {
          status: "WON",
          closedAt: new Date(),
          closedAmount: body.totalBudget || lead.estimatedValue,
        },
      });

      // Create activity on the lead
      await prisma.developmentLeadActivity.create({
        data: {
          leadId: lead.id,
          activityType: "LEAD_CONVERTED",
          description: `Lead converted to project: ${project.projectName} (ID: ${project.id})`,
          createdBy: body.createdBy || "system",
        },
      });

      return NextResponse.json(project, { status: 201 });
    }

    // Direct project creation (not from lead)
    if (!body.clientName || !body.clientCompany || !body.clientEmail || !body.projectName || !body.assetType) {
      return NextResponse.json(
        { error: "Missing required fields: clientName, clientCompany, clientEmail, projectName, assetType" },
        { status: 400 }
      );
    }

    const project = await prisma.developmentProject.create({
      data: {
        clientName: body.clientName,
        clientCompany: body.clientCompany,
        clientEmail: body.clientEmail,
        clientPhone: body.clientPhone,
        projectName: body.projectName,
        address: body.address,
        city: body.city,
        state: body.state,
        assetType: body.assetType,
        totalUnits: body.totalUnits,
        totalBudget: body.totalBudget,
        status: "INTAKE",
        estimatedStart: body.estimatedStart ? new Date(body.estimatedStart) : undefined,
        estimatedEnd: body.estimatedEnd ? new Date(body.estimatedEnd) : undefined,
        assignedPmId: body.assignedPmId,
        assignedTeam: body.assignedTeam || [],
        serviceTier: body.serviceTier,
        monthlyFee: body.monthlyFee,
        contractStartDate: body.contractStartDate ? new Date(body.contractStartDate) : undefined,
        contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : undefined,
        cpaceApplicable: body.cpaceApplicable || false,
        historicTaxCredits: body.historicTaxCredits || false,
        lihtcApplicable: body.lihtcApplicable || false,
        opportunityZone: body.opportunityZone || false,
        incentiveNotes: body.incentiveNotes,
      },
      include: {
        _count: {
          select: {
            milestones: true,
            reports: true,
            riskAlerts: true,
            proposals: true,
            documents: true,
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating development project:", error);
    return NextResponse.json(
      { error: "Failed to create development project" },
      { status: 500 }
    );
  }
}

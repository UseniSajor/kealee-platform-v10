import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/gc-ops-engagements - List engagements with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filters
    const status = searchParams.get("status");
    const packageTier = searchParams.get("packageTier");
    const assignedOpsManagerId = searchParams.get("assignedOpsManagerId");
    const search = searchParams.get("search");

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
    if (packageTier) where.packageTier = packageTier;
    if (assignedOpsManagerId) where.assignedOpsManagerId = assignedOpsManagerId;

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch engagements with task count and latest weekly report
    const [engagements, total] = await Promise.all([
      prisma.gCOpsEngagement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
          weeklyReports: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              reportNumber: true,
              weekStartDate: true,
              weekEndDate: true,
              status: true,
              totalHoursWorked: true,
              sentAt: true,
            },
          },
        },
      }),
      prisma.gCOpsEngagement.count({ where }),
    ]);

    // Transform to include computed task counts
    const enriched = engagements.map((engagement) => {
      const totalTasks = engagement.tasks.length;
      const completedTasks = engagement.tasks.filter(
        (t) => t.status === "COMPLETED"
      ).length;
      const pendingTasks = engagement.tasks.filter(
        (t) => t.status === "PENDING"
      ).length;
      const inProgressTasks = engagement.tasks.filter(
        (t) => t.status === "IN_PROGRESS"
      ).length;

      return {
        ...engagement,
        taskCounts: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
        },
        latestReport: engagement.weeklyReports[0] || null,
        tasks: undefined,
        weeklyReports: undefined,
      };
    });

    return NextResponse.json({
      engagements: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching GC ops engagements:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagements" },
      { status: 500 }
    );
  }
}

// POST /api/gc-ops-engagements - Create engagement from lead conversion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      leadId,
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      packageTier,
      monthlyFee,
      hoursPerWeek,
      maxProjects,
      slaResponseHours,
      slaLevel,
      assignedOpsManagerId,
      assignedTeam,
      startDate,
      trialEndDate,
      stripeSubscriptionId,
    } = body;

    // If converting from a lead, validate the lead exists and is not already converted
    if (leadId) {
      const lead = await prisma.gCOpsLead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        );
      }

      if (lead.status === "CONVERTED") {
        return NextResponse.json(
          { error: "Lead has already been converted" },
          { status: 400 }
        );
      }
    }

    // Create the engagement
    const engagement = await prisma.gCOpsEngagement.create({
      data: {
        leadId: leadId || null,
        companyName,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null,
        packageTier,
        status: "ONBOARDING",
        monthlyFee,
        hoursPerWeek,
        maxProjects: maxProjects || 1,
        slaResponseHours: slaResponseHours || 48,
        slaLevel: slaLevel || "STANDARD",
        assignedOpsManagerId: assignedOpsManagerId || null,
        assignedTeam: assignedTeam || [],
        startDate: startDate ? new Date(startDate) : new Date(),
        trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
        stripeSubscriptionId: stripeSubscriptionId || null,
      },
    });

    // If created from a lead, update the lead status to CONVERTED
    if (leadId) {
      await prisma.gCOpsLead.update({
        where: { id: leadId },
        data: {
          status: "CONVERTED",
          convertedDate: new Date(),
          selectedPackage: packageTier,
          monthlyValue: monthlyFee,
        },
      });

      // Log activity on the lead
      await prisma.gCOpsLeadActivity.create({
        data: {
          leadId,
          activityType: "LEAD_CONVERTED",
          description: `Lead converted to engagement. Package: ${packageTier}, Monthly fee: $${monthlyFee}`,
          createdBy: body.createdBy || "system",
          metadata: {
            engagementId: engagement.id,
            packageTier,
            monthlyFee,
          },
        },
      });
    }

    return NextResponse.json(engagement, { status: 201 });
  } catch (error) {
    console.error("Error creating GC ops engagement:", error);
    return NextResponse.json(
      { error: "Failed to create engagement" },
      { status: 500 }
    );
  }
}

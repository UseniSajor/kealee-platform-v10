import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-leads - List all leads with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Filters
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");
    const search = searchParams.get("search");
    const assetType = searchParams.get("assetType");
    const projectStage = searchParams.get("projectStage");
    
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
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (assetType) where.assetType = assetType;
    if (projectStage) where.projectStage = projectStage;
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch leads
    const [leads, total] = await Promise.all([
      prisma.developmentLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.developmentLead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST /api/development-leads - Create a new lead (manual entry)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lead = await prisma.developmentLead.create({
      data: {
        fullName: body.fullName,
        company: body.company,
        email: body.email,
        phone: body.phone,
        role: body.role,
        location: body.location,
        assetType: body.assetType,
        units: body.units,
        notUnitBased: body.notUnitBased || false,
        projectStage: body.projectStage,
        budgetRange: body.budgetRange,
        timeline: body.timeline,
        needsHelp: body.needsHelp || [],
        message: body.message || "",
        status: body.status || 'NEW',
        priority: body.priority || 'MEDIUM',
        source: body.source || 'OTHER',
        assignedTo: body.assignedTo,
        consent: body.consent || false,
      },
    });

    // Create activity
    await prisma.developmentLeadActivity.create({
      data: {
        leadId: lead.id,
        activityType: 'LEAD_CREATED',
        description: `Lead manually created: ${body.fullName} from ${body.company}`,
        createdBy: body.createdBy || 'system',
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}

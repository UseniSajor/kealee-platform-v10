import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [leads, total] = await Promise.all([
      prisma.permitServiceLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          notes: { orderBy: { createdAt: 'desc' }, take: 5 },
          activities: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }),
      prisma.permitServiceLead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching permit leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

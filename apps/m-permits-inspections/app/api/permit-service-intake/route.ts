import { NextRequest, NextResponse } from "next/server";
import { permitServiceIntakeSchema } from "@/lib/validations/permit-service-intake";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = permitServiceIntakeSchema.parse(body);

    // Spam checks
    if (validatedData.website && validatedData.website.length > 0) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    const timeSincePageLoad = Date.now() - validatedData.submittedAt;
    if (timeSincePageLoad < 3000) {
      return NextResponse.json({ error: "Please review your submission" }, { status: 400 });
    }

    // Save to database
    const lead = await prisma.permitServiceLead.create({
      data: {
        fullName: validatedData.fullName,
        company: validatedData.company,
        email: validatedData.email,
        phone: validatedData.phone || null,
        role: validatedData.role,
        contractorType: validatedData.contractorType,
        licenseNumber: validatedData.licenseNumber || null,
        yearsInBusiness: validatedData.yearsInBusiness,
        jurisdictions: validatedData.jurisdictions,
        permitsPerMonth: validatedData.permitsPerMonth,
        servicesNeeded: validatedData.servicesNeeded,
        urgency: validatedData.urgency,
        message: validatedData.message,
        status: 'NEW',
        priority: 'MEDIUM',
        source: 'WEBSITE',
      },
    });

    await prisma.permitServiceLeadActivity.create({
      data: {
        leadId: lead.id,
        activityType: 'LEAD_CREATED',
        description: `New permit service request: ${validatedData.fullName} from ${validatedData.company}`,
        createdBy: 'system',
      },
    });

    console.log(`✓ Permit lead saved: ${lead.id}`);

    // Email notification (console mode for dev)
    console.log("📨 PERMIT SERVICE EMAIL:");
    console.log("To: permits@kealee.com");
    console.log(`Subject: New Permit Service Request: ${validatedData.company}`);

    return NextResponse.json({
      success: true,
      message: "Thank you! We'll contact you within 24 hours to process your first permit.",
    });
  } catch (error) {
    console.error("❌ Permit intake error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred. Please email permits@kealee.com" },
      { status: 500 }
    );
  }
}

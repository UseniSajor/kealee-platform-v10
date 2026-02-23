import { NextRequest, NextResponse } from "next/server";
import { gcIntakeSchema } from "@ops/lib/validations/gc-intake";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "console";

async function sendEmailNotification(data: any) {
  const emailHTML = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><style>body{font-family:sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#1e40af;color:white;padding:20px;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}.field{margin-bottom:15px}.label{font-weight:600;color:#374151}.value{color:#1f2937;margin-top:4px}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;font-size:24px;">New GC Operations Trial Request</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Contact</div>
              <div class="value"><strong>${data.fullName}</strong><br>${data.company}<br>${data.email}<br>${data.phone || 'No phone'}</div>
            </div>
            <div class="field">
              <div class="label">Business Details</div>
              <div class="value">
                <strong>Type:</strong> ${data.gcType}<br>
                <strong>Team Size:</strong> ${data.teamSize}<br>
                <strong>Projects/Year:</strong> ${data.projectsPerYear}<br>
                <strong>Avg Project Value:</strong> ${data.averageProjectValue}<br>
                <strong>Service Area:</strong> ${data.serviceArea}
              </div>
            </div>
            <div class="field">
              <div class="label">Current Challenges</div>
              <div class="value">${data.challenges.join(', ')}</div>
            </div>
            <div class="field">
              <div class="label">Package Interest</div>
              <div class="value">${data.packageInterest}</div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="value">${data.message}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  if (EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kealee Operations <ops@kealee.com>",
        to: ["getstarted@kealee.com"],
        subject: `New GC Operations Trial: ${data.company}`,
        html: emailHTML,
      }),
    });
  } else {
    console.log("📨 GC OPS EMAIL (Console Mode):");
    console.log("To: getstarted@kealee.com");
    console.log(`Subject: New GC Operations Trial: ${data.company}`);
  }
}

async function saveGCLeadToDatabase(data: any) {
  try {
    const lead = await prisma.gCOpsLead.create({
      data: {
        fullName: data.fullName,
        company: data.company,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        gcType: data.gcType,
        teamSize: data.teamSize,
        projectsPerYear: data.projectsPerYear,
        averageProjectValue: data.averageProjectValue,
        serviceArea: data.serviceArea,
        challenges: data.challenges,
        packageInterest: data.packageInterest,
        message: data.message,
        status: 'NEW',
        priority: 'MEDIUM',
        source: 'WEBSITE',
        submittedAt: new Date(),
      },
    });

    await prisma.gCOpsLeadActivity.create({
      data: {
        leadId: lead.id,
        activityType: 'LEAD_CREATED',
        description: `New GC ops trial request: ${data.fullName} from ${data.company}`,
        createdBy: 'system',
        metadata: {
          source: 'gc_ops_website',
          challenges: data.challenges,
          packageInterest: data.packageInterest,
        },
      },
    });

    console.log(`✓ GC lead saved: ${lead.id}`);
    return lead;
  } catch (error) {
    console.error("❌ Error saving GC lead:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = gcIntakeSchema.parse(body);

    if (validatedData.website && validatedData.website.length > 0) {
      console.log("⚠️ Honeypot triggered");
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    const timeSincePageLoad = Date.now() - validatedData.submittedAt;
    if (timeSincePageLoad < 3000) {
      console.log("⚠️ Submission too fast");
      return NextResponse.json(
        { error: "Please review your submission" },
        { status: 400 }
      );
    }

    console.log("📧 New GC ops trial request:", {
      company: validatedData.company,
      gcType: validatedData.gcType,
      packageInterest: validatedData.packageInterest,
    });

    const lead = await saveGCLeadToDatabase(validatedData);
    await sendEmailNotification(validatedData);

    return NextResponse.json({
      success: true,
      message: "Thank you! We'll contact you within 24 hours to start your free trial.",
    });
  } catch (error) {
    console.error("❌ GC intake error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred. Please try again or email us at getstarted@kealee.com" },
      { status: 500 }
    );
  }
}

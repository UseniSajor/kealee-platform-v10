import { NextRequest, NextResponse } from "next/server";
import { intakeSchema } from "@/lib/validations/intake";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Email sending logic - toggle between providers
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "console"; // 'resend', 'sendgrid', or 'console'

async function sendEmailResend(data: any) {
  // Resend implementation
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Kealee Development <intake@kealee.com>",
      to: ["getstarted@kealee.com"],
      subject: `New Project Review Request: ${data.company} - ${data.assetType}`,
      html: generateEmailHTML(data),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${await response.text()}`);
  }

  return await response.json();
}

async function sendEmailSendGrid(data: any) {
  // SendGrid implementation
  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: "getstarted@kealee.com",
    from: "intake@kealee.com",
    subject: `New Project Review Request: ${data.company} - ${data.assetType}`,
    html: generateEmailHTML(data),
  };

  return await sgMail.send(msg);
}

function generateEmailHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: 600; color: #374151; }
          .value { color: #1f2937; margin-top: 4px; }
          .needs-list { list-style: none; padding: 0; }
          .needs-list li { padding: 4px 0; }
          .needs-list li:before { content: "✓ "; color: #ea580c; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">New Project Review Request</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Kealee Development Intake</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Contact Information</div>
              <div class="value">
                <strong>${data.fullName}</strong><br>
                ${data.company}<br>
                ${data.email}<br>
                ${data.phone || 'No phone provided'}<br>
                Role: ${data.role}
              </div>
            </div>

            <div class="field">
              <div class="label">Project Details</div>
              <div class="value">
                <strong>Location:</strong> ${data.location}<br>
                <strong>Asset Type:</strong> ${data.assetType}<br>
                <strong>Units:</strong> ${data.units}${data.notUnitBased ? ' (Not unit-based)' : ''}<br>
                <strong>Stage:</strong> ${data.projectStage}<br>
                <strong>Budget Range:</strong> ${data.budgetRange}<br>
                <strong>Timeline:</strong> ${data.timeline}
              </div>
            </div>

            <div class="field">
              <div class="label">Areas of Need</div>
              <ul class="needs-list">
                ${data.needsHelp.map((need: string) => `<li>${need}</li>`).join('')}
              </ul>
            </div>

            <div class="field">
              <div class="label">Project Summary</div>
              <div class="value" style="white-space: pre-wrap;">${data.message}</div>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              Submitted: ${new Date().toLocaleString()}<br>
              Source: Kealee Development Website
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function saveLeadToDatabase(data: any) {
  try {
    // Map form data to database schema
    const lead = await prisma.developmentLead.create({
      data: {
        fullName: data.fullName,
        company: data.company,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        location: data.location,
        assetType: data.assetType.toUpperCase().replace(/-/g, '_') as any,
        units: data.units,
        notUnitBased: data.notUnitBased,
        projectStage: data.projectStage.toUpperCase().replace(/ /g, '_').replace(/-/g, '_').replace(/\//g, '_') as any,
        budgetRange: data.budgetRange,
        timeline: data.timeline,
        needsHelp: data.needsHelp,
        message: data.message,
        consent: data.consent,
        status: 'NEW',
        priority: 'MEDIUM',
        source: 'WEBSITE',
        submittedAt: new Date(),
      },
    });

    // Create initial activity
    await prisma.developmentLeadActivity.create({
      data: {
        leadId: lead.id,
        activityType: 'LEAD_CREATED',
        description: `New lead submitted from website: ${data.fullName} from ${data.company}`,
        createdBy: 'system',
        metadata: {
          source: 'website_intake_form',
          needsHelp: data.needsHelp,
          budgetRange: data.budgetRange,
        },
      },
    });

    console.log(`✓ Lead saved to database: ${lead.id}`);
    return lead;
  } catch (error) {
    console.error("❌ Error saving lead to database:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = intakeSchema.parse(body);

    // Check honeypot field
    if (validatedData.website && validatedData.website.length > 0) {
      console.log("⚠️ Honeypot triggered - potential spam");
      return NextResponse.json(
        { error: "Invalid submission" },
        { status: 400 }
      );
    }

    // Check minimum time-to-submit (3 seconds) to prevent instant bot submissions
    const timeSincePageLoad = Date.now() - validatedData.submittedAt;
    if (timeSincePageLoad < 3000) {
      console.log("⚠️ Submission too fast - potential spam");
      return NextResponse.json(
        { error: "Please take a moment to review your submission" },
        { status: 400 }
      );
    }

    // Log the submission
    console.log("📧 New intake submission:", {
      name: validatedData.fullName,
      company: validatedData.company,
      email: validatedData.email,
      assetType: validatedData.assetType,
      timestamp: new Date().toISOString(),
    });

    // Save to database
    const lead = await saveLeadToDatabase(validatedData);

    // Send email based on provider
    try {
      if (EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
        await sendEmailResend(validatedData);
        console.log("✓ Email sent via Resend");
      } else if (EMAIL_PROVIDER === "sendgrid" && process.env.SENDGRID_API_KEY) {
        await sendEmailSendGrid(validatedData);
        console.log("✓ Email sent via SendGrid");
      } else {
        // Console fallback for development
        console.log("📨 EMAIL CONTENT (Console Mode):");
        console.log("To: getstarted@kealee.com");
        console.log(`Subject: New Project Review Request: ${validatedData.company}`);
        console.log("Body:", generateEmailHTML(validatedData));
      }
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      // Continue anyway - we have the lead saved to file in dev
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your project review request has been submitted successfully. We'll be in touch within 24 hours.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Intake submission error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "An error occurred processing your request. Please try again or email us directly at getstarted@kealee.com",
      },
      { status: 500 }
    );
  }
}

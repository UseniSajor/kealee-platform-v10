import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, email, company, phone, companySize, currentProjects, interests, message } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Log the demo request (console mode for dev, replace with email service in production)
    console.log("📨 NEW DEMO REQUEST:")
    console.log("To: ops@kealee.com")
    console.log(`Subject: Demo Request from ${name} at ${company || "N/A"}`)
    console.log(`Name: ${name}`)
    console.log(`Email: ${email}`)
    console.log(`Company: ${company || "N/A"}`)
    console.log(`Phone: ${phone || "N/A"}`)
    console.log(`Company Size: ${companySize || "N/A"}`)
    console.log(`Active Projects: ${currentProjects || "N/A"}`)
    console.log(`Interests: ${(interests || []).join(", ") || "N/A"}`)
    console.log(`Message: ${message || "N/A"}`)

    // Try to save to database if available
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3001"
      await fetch(`${API_URL}/marketplace/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: company || undefined,
          phone: phone || undefined,
          description: `Demo Request — Company Size: ${companySize || "N/A"}, Active Projects: ${currentProjects || "N/A"}, Interests: ${(interests || []).join(", ") || "N/A"}. ${message || ""}`,
          category: "DEMO_REQUEST",
          source: "ops-services-demo",
        }),
      })
    } catch {
      // Non-fatal — lead storage is best-effort
      console.warn("Could not save demo lead to backend")
    }

    return NextResponse.json({
      success: true,
      message: "Demo request received. We'll contact you within one business day.",
    })
  } catch (error) {
    console.error("Demo request error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please email ops@kealee.com" },
      { status: 500 }
    )
  }
}

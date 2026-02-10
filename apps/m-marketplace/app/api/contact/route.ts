import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, company, phone, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Store the contact as a lead via the marketplace leads API
    let leadCreated = false;
    try {
      const leadResponse = await fetch(`${API_URL}/marketplace/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'CONTACT_FORM',
          description: `Contact from ${name} (${email}): ${message}`,
          estimatedValue: 0,
          location: company || 'Unknown',
          city: '',
          state: '',
          metadata: {
            source: 'marketplace_contact_form',
            senderName: name,
            senderEmail: email,
            company: company || null,
            phone: phone || null,
          },
        }),
      });

      if (leadResponse.ok) {
        leadCreated = true;
      }
    } catch (leadError) {
      // Non-fatal: lead storage failed but form submission still succeeds
      console.error('Failed to store lead in database:', leadError);
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      details: {
        leadCreated,
      },
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}

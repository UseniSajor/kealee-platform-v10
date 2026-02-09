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

    // 1. Store the contact as a lead in the database via the marketplace leads API
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
        }),
      });

      if (leadResponse.ok) {
        leadCreated = true;
      }
    } catch (leadError) {
      // Non-fatal: log but continue to send email notification
      console.error('Failed to store lead in database:', leadError);
    }

    // 2. Send email notification via the communication/notification service
    let emailSent = false;
    try {
      // Use the notification service to send an email about the contact form submission
      const emailResponse = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CONTACT_FORM',
          channel: 'EMAIL',
          recipientEmail: process.env.CONTACT_EMAIL || 'contact@kealee.com',
          subject: `New Contact Form Submission: ${name}`,
          body: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Company: ${company || 'N/A'}`,
            `Phone: ${phone || 'N/A'}`,
            '',
            `Message:`,
            message,
          ].join('\n'),
          metadata: {
            source: 'marketplace_contact_form',
            senderName: name,
            senderEmail: email,
            company: company || null,
            phone: phone || null,
          },
        }),
      });

      if (emailResponse.ok) {
        emailSent = true;
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    // 3. Also log in communication logs for audit trail
    try {
      await fetch(`${API_URL}/communication/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL',
          direction: 'INBOUND',
          subject: `Contact Form: ${name}`,
          body: message,
          senderName: name,
          senderEmail: email,
          metadata: {
            company: company || null,
            phone: phone || null,
            source: 'marketplace_contact_form',
          },
        }),
      });
    } catch (logError) {
      // Non-fatal
      console.error('Failed to log communication:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      details: {
        leadCreated,
        emailSent,
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

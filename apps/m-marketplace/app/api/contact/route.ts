import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, company, phone, message } = body;

    // TODO: Send email via SendGrid or other email service
    // TODO: Store in database for follow-up
    
    // For now, just log it
    console.log('Contact form submission:', {
      name,
      email,
      company,
      phone,
      message,
      timestamp: new Date().toISOString(),
    });

    // Simulate email sending
    // await sendEmail({
    //   to: 'contact@kealee.com',
    //   subject: `New Contact Form: ${name}`,
    //   body: `From: ${name} (${email})\nCompany: ${company || 'N/A'}\nPhone: ${phone || 'N/A'}\n\nMessage:\n${message}`,
    // });

    return NextResponse.json({ 
      success: true,
      message: 'Message sent successfully' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}


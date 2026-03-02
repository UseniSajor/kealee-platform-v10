import { NextResponse } from 'next/server'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, company, phone, message, service } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Store the contact as a lead via the marketplace leads API
    let leadCreated = false
    try {
      const leadPayload = {
        category: 'CONTACT_FORM',
        description: `Contact from ${name} (${email})${service ? ` [${service}]` : ''}: ${message}`,
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
          service: service || null,
        },
      }

      const leadResponse = await fetch(`${API_URL}/marketplace/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload),
      })

      if (leadResponse.ok) {
        leadCreated = true
      } else {
        const errorText = await leadResponse.text().catch(() => 'unknown')
        console.error(
          `[Contact API] Lead creation failed: ${leadResponse.status} ${leadResponse.statusText}`,
          { name, email, service, errorText }
        )
      }
    } catch (leadError) {
      console.error('[Contact API] Lead creation request failed:', {
        error: leadError instanceof Error ? leadError.message : String(leadError),
        name,
        email,
        service,
      })
    }

    // Send notification email via Resend if available
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Kealee <noreply@kealee.com>',
            to: ['contact@kealee.com'],
            subject: `New Contact: ${name}${service ? ` — ${service}` : ''}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              ${service ? `<p><strong>Service Interest:</strong> ${service}</p>` : ''}
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br/>')}</p>
            `,
          }),
        })
      } catch (emailError) {
        console.error('[Contact API] Email notification failed:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      details: { leadCreated },
    })
  } catch (error) {
    console.error('[Contact API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    )
  }
}

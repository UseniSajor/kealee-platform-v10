// apps/m-permits-inspections/app/api/email/route.ts
// Email sending API endpoint

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const emailTemplates: Record<string, (data: any) => { subject: string; html: string }> = {
  'permit-confirmation': (data) => ({
    subject: 'Permit Application Submitted - Kealee',
    html: `
      <h2>Permit Application Submitted</h2>
      <p>Your permit application has been successfully submitted.</p>
      <p><strong>Application ID:</strong> ${data.permitId}</p>
      <p><strong>Jurisdiction:</strong> ${data.jurisdiction}</p>
      <p><strong>Permit Types:</strong> ${data.permitTypes.join(', ')}</p>
      <p>You can track your application status at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/permits/status/${data.permitId}">View Status</a></p>
    `,
  }),
  'status-update': (data) => ({
    subject: `Permit Status Update - ${data.permitId}`,
    html: `
      <h2>Permit Status Update</h2>
      <p>Your permit application status has been updated.</p>
      <p><strong>Application ID:</strong> ${data.permitId}</p>
      <p><strong>New Status:</strong> ${data.status}</p>
      <p>View full details: <a href="${process.env.NEXT_PUBLIC_APP_URL}/permits/status/${data.permitId}">View Status</a></p>
    `,
  }),
  'inspection-scheduled': (data) => ({
    subject: 'Inspection Scheduled - Kealee',
    html: `
      <h2>Inspection Scheduled</h2>
      <p>Your site inspection has been scheduled.</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.time}</p>
      <p><strong>Type:</strong> ${data.type}</p>
      <p>Please ensure the site is accessible and ready for inspection.</p>
    `,
  }),
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, template, data } = body;

    if (!to || !template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const templateFn = emailTemplates[template];
    if (!templateFn) {
      return NextResponse.json(
        { error: 'Invalid template' },
        { status: 400 }
      );
    }

    const emailContent = templateFn(data);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@kealee.com',
      to,
      subject: subject || emailContent.subject,
      html: emailContent.html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

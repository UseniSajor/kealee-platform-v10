// apps/m-permits-inspections/lib/services/email.ts
// Email notification service

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

class EmailService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = '/api/email';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendPermitConfirmation(email: string, permitId: string, data: any): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: 'Permit Application Submitted - Kealee',
      template: 'permit-confirmation',
      data: {
        permitId,
        ...data,
      },
    });
  }

  async sendStatusUpdate(email: string, permitId: string, status: string): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `Permit Status Update - ${permitId}`,
      template: 'status-update',
      data: {
        permitId,
        status,
      },
    });
  }

  async sendInspectionScheduled(email: string, inspectionData: any): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: 'Inspection Scheduled - Kealee',
      template: 'inspection-scheduled',
      data: inspectionData,
    });
  }
}

export const emailService = new EmailService();

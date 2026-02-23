/**
 * Inspection Notifications Service
 * Automatic notification to contractors
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface InspectionNotification {
  inspectionId: string;
  recipientId: string;
  recipientType: 'CONTRACTOR' | 'OWNER' | 'INSPECTOR';
  notificationType: 'SCHEDULED' | 'RESULT' | 'CORRECTIONS' | 'REINSPECTION';
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject?: string;
  message: string;
  sentAt?: Date;
  sent: boolean;
}

export class InspectionNotificationsService {
  /**
   * Send inspection scheduled notification
   */
  async sendScheduledNotification(
    inspectionId: string,
    scheduledDate: Date,
    scheduledTime: string
  ): Promise<void> {
    const supabase = createClient();

    // Get inspection details
    const {data: inspection} = await supabase
      .from('Inspection')
      .select('*, permit:Permit(applicantId, ownerId), inspector:User(name, email)')
      .eq('id', inspectionId)
      .single();

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Get applicant (contractor)
    const {data: applicant} = await supabase
      .from('User')
      .select('email, phone, name')
      .eq('id', inspection.permit.applicantId)
      .single();

    if (applicant) {
      // Send email notification
      await this.sendEmail({
        to: applicant.email,
        subject: `Inspection Scheduled: ${inspection.type}`,
        body: this.buildScheduledEmail(inspection, scheduledDate, scheduledTime, applicant),
      });

      // Send SMS if phone available
      if (applicant.phone) {
        await this.sendSMS({
          to: applicant.phone,
          message: this.buildScheduledSMS(inspection, scheduledDate, scheduledTime),
        });
      }
    }
  }

  /**
   * Send inspection result notification
   */
  async sendResultNotification(inspectionId: string): Promise<void> {
    const supabase = createClient();

    // Get inspection result
    const {data: inspection} = await supabase
      .from('Inspection')
      .select('*, permit:Permit(applicantId, ownerId), inspector:User(name)')
      .eq('id', inspectionId)
      .single();

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Get result details
    const result = inspection.result || 'PENDING';

    // Get applicant (contractor)
    const {data: applicant} = await supabase
      .from('User')
      .select('email, phone, name')
      .eq('id', inspection.permit.applicantId)
      .single();

    if (applicant) {
      // Get corrections if failed
      let correctionsCount = 0;
      if (result === 'FAIL' || result === 'PARTIAL_PASS') {
        const {data: corrections} = await supabase
          .from('InspectionCorrection')
          .select('id')
          .eq('inspectionId', inspectionId)
          .eq('resolved', false);

        correctionsCount = corrections?.length || 0;
      }

      // Send email notification
      await this.sendEmail({
        to: applicant.email,
        subject: `Inspection Result: ${inspection.type} - ${result}`,
        body: this.buildResultEmail(inspection, result, correctionsCount, applicant),
      });

      // Send SMS if phone available
      if (applicant.phone) {
        await this.sendSMS({
          to: applicant.phone,
          message: this.buildResultSMS(inspection, result, correctionsCount),
        });
      }
    }
  }

  /**
   * Send corrections notification
   */
  async sendCorrectionsNotification(
    inspectionId: string,
    corrections: Array<{id: string; description: string; severity: string}>
  ): Promise<void> {
    const supabase = createClient();

    // Get inspection details
    const {data: inspection} = await supabase
      .from('Inspection')
      .select('*, permit:Permit(applicantId)')
      .eq('id', inspectionId)
      .single();

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Get applicant (contractor)
    const {data: applicant} = await supabase
      .from('User')
      .select('email, phone, name')
      .eq('id', inspection.permit.applicantId)
      .single();

    if (applicant) {
      // Send email notification
      await this.sendEmail({
        to: applicant.email,
        subject: `Corrections Required: ${inspection.type} Inspection`,
        body: this.buildCorrectionsEmail(inspection, corrections, applicant),
      });

      // Send SMS if phone available
      if (applicant.phone) {
        await this.sendSMS({
          to: applicant.phone,
          message: this.buildCorrectionsSMS(inspection, corrections),
        });
      }
    }
  }

  /**
   * Send reinspection scheduled notification
   */
  async sendReinspectionScheduledNotification(
    reinspectionId: string,
    scheduledDate: Date,
    scheduledTime: string
  ): Promise<void> {
    // Same as scheduled notification but with reinspection context
    await this.sendScheduledNotification(reinspectionId, scheduledDate, scheduledTime);
  }

  /**
   * Build scheduled email
   */
  private buildScheduledEmail(
    inspection: any,
    scheduledDate: Date,
    scheduledTime: string,
    recipient: any
  ): string {
    return `
Dear ${recipient.name},

Your inspection has been scheduled:

Inspection Type: ${inspection.type}
Inspection Number: ${inspection.inspectionNumber}
Date: ${scheduledDate.toLocaleDateString()}
Time: ${scheduledTime}
Inspector: ${inspection.inspector?.name || 'TBD'}

Please ensure the work is ready for inspection at the scheduled time.

Thank you,
Building Department
    `.trim();
  }

  /**
   * Build scheduled SMS
   */
  private buildScheduledSMS(
    inspection: any,
    scheduledDate: Date,
    scheduledTime: string
  ): string {
    return `Inspection ${inspection.type} scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledTime}. Inspection #${inspection.inspectionNumber}`;
  }

  /**
   * Build result email
   */
  private buildResultEmail(
    inspection: any,
    result: string,
    correctionsCount: number,
    recipient: any
  ): string {
    let correctionsText = '';
    if (correctionsCount > 0) {
      correctionsText = `\n\nCorrections Required: ${correctionsCount} item(s) must be addressed before reinspection.`;
    }

    return `
Dear ${recipient.name},

Inspection Result:

Inspection Type: ${inspection.type}
Inspection Number: ${inspection.inspectionNumber}
Result: ${result}${correctionsText}

Please log in to view detailed results and any required corrections.

Thank you,
Building Department
    `.trim();
  }

  /**
   * Build result SMS
   */
  private buildResultSMS(
    inspection: any,
    result: string,
    correctionsCount: number
  ): string {
    let correctionsText = correctionsCount > 0 ? `. ${correctionsCount} correction(s) required.` : '';
    return `Inspection ${inspection.type} result: ${result}${correctionsText} Inspection #${inspection.inspectionNumber}`;
  }

  /**
   * Build corrections email
   */
  private buildCorrectionsEmail(
    inspection: any,
    corrections: Array<{id: string; description: string; severity: string}>,
    recipient: any
  ): string {
    const correctionsList = corrections
      .map((c, i) => `${i + 1}. ${c.description} (${c.severity})`)
      .join('\n');

    return `
Dear ${recipient.name},

Corrections Required:

Inspection Type: ${inspection.type}
Inspection Number: ${inspection.inspectionNumber}

The following corrections must be addressed:

${correctionsList}

Please address these corrections and request a reinspection when complete.

Thank you,
Building Department
    `.trim();
  }

  /**
   * Build corrections SMS
   */
  private buildCorrectionsSMS(
    inspection: any,
    corrections: Array<{id: string; description: string; severity: string}>
  ): string {
    return `Inspection ${inspection.type} requires ${corrections.length} correction(s). Please review and address. Inspection #${inspection.inspectionNumber}`;
  }

  /**
   * Send email (mock - would integrate with email service)
   */
  private async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    // In production, would integrate with email service (SendGrid, AWS SES, etc.)
    console.log('Sending email:', data);
  }

  /**
   * Send SMS (mock - would integrate with SMS service)
   */
  private async sendSMS(data: {
    to: string;
    message: string;
  }): Promise<void> {
    // In production, would integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log('Sending SMS:', data);
  }
}

// Singleton instance
export const inspectionNotificationsService = new InspectionNotificationsService();

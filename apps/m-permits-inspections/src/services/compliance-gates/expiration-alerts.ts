/**
 * Expiration Alerts Service
 * Alert system for approaching permit expirations
 */

import {createClient} from '@/lib/supabase/client';

export interface ExpirationAlert {
  permitId: string;
  permitNumber: string;
  projectId?: string;
  expiresAt: Date;
  daysUntilExpiration: number;
  alertLevel: 'INFO' | 'WARNING' | 'CRITICAL';
  recipients: string[]; // User IDs to notify
  sent: boolean;
  sentAt?: Date;
}

export interface ExpirationAlertRule {
  daysBeforeExpiration: number;
  alertLevel: 'INFO' | 'WARNING' | 'CRITICAL';
  notifyApplicant: boolean;
  notifyProjectOwner?: boolean;
  notifyJurisdiction?: boolean;
}

export class ExpirationAlertsService {
  private alertRules: ExpirationAlertRule[] = [
    {daysBeforeExpiration: 90, alertLevel: 'INFO', notifyApplicant: true},
    {daysBeforeExpiration: 30, alertLevel: 'WARNING', notifyApplicant: true, notifyProjectOwner: true},
    {daysBeforeExpiration: 14, alertLevel: 'WARNING', notifyApplicant: true, notifyProjectOwner: true},
    {daysBeforeExpiration: 7, alertLevel: 'CRITICAL', notifyApplicant: true, notifyProjectOwner: true, notifyJurisdiction: true},
    {daysBeforeExpiration: 0, alertLevel: 'CRITICAL', notifyApplicant: true, notifyProjectOwner: true, notifyJurisdiction: true},
  ];

  /**
   * Check for expiring permits and send alerts
   */
  async checkAndSendExpirationAlerts(): Promise<ExpirationAlert[]> {
    const supabase = createClient();

    // Get all active permits with expiration dates
    const {data: permits} = await supabase
      .from('Permit')
      .select('id, permitNumber, expiresAt, applicantId, projectId, status')
      .in('status', ['ISSUED', 'ACTIVE'])
      .not('expiresAt', 'is', null);

    if (!permits || permits.length === 0) {
      return [];
    }

    const now = new Date();
    const alerts: ExpirationAlert[] = [];

    for (const permit of permits) {
      if (!permit.expiresAt) {
        continue;
      }

      const expiresAt = new Date(permit.expiresAt);
      const daysUntilExpiration = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check each alert rule
      for (const rule of this.alertRules) {
        if (daysUntilExpiration <= rule.daysBeforeExpiration && daysUntilExpiration >= rule.daysBeforeExpiration - 1) {
          // Check if alert already sent
          const {data: existingAlert} = await supabase
            .from('ExpirationAlert')
            .select('id')
            .eq('permitId', permit.id)
            .eq('daysBeforeExpiration', rule.daysBeforeExpiration)
            .eq('sent', true)
            .single();

          if (existingAlert) {
            continue; // Alert already sent
          }

          // Determine recipients
          const recipients: string[] = [];
          if (rule.notifyApplicant && permit.applicantId) {
            recipients.push(permit.applicantId);
          }

          // Create alert
          const alert: ExpirationAlert = {
            permitId: permit.id,
            permitNumber: permit.permitNumber,
            projectId: permit.projectId || undefined,
            expiresAt,
            daysUntilExpiration,
            alertLevel: rule.alertLevel,
            recipients,
            sent: false,
          };

          // Send alert
          await this.sendExpirationAlert(alert);

          // Record alert
          await supabase.from('ExpirationAlert').insert({
            permitId: permit.id,
            daysBeforeExpiration: rule.daysBeforeExpiration,
            alertLevel: rule.alertLevel,
            sent: true,
            sentAt: new Date().toISOString(),
          });

          alerts.push({
            ...alert,
            sent: true,
            sentAt: new Date(),
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Send expiration alert
   */
  private async sendExpirationAlert(alert: ExpirationAlert): Promise<void> {
    const supabase = createClient();

    // Get permit details
    const {data: permit} = await supabase
      .from('Permit')
      .select('*, applicant:User(email, name)')
      .eq('id', alert.permitId)
      .single();

    if (!permit) {
      return;
    }

    // Send notifications to recipients
    for (const recipientId of alert.recipients) {
      const {data: user} = await supabase
        .from('User')
        .select('email, name')
        .eq('id', recipientId)
        .single();

      if (user) {
        // Send email notification
        await this.sendEmailNotification(user.email, alert, permit);

        // Send in-app notification (would be handled by notification service)
        console.log(
          `Expiration alert sent to ${user.email} for permit ${alert.permitNumber}`
        );
      }
    }

    // Notify Project Owner module if applicable
    if (alert.projectId) {
      console.log(
        `Notifying Project Owner module about expiring permit ${alert.permitNumber} for project ${alert.projectId}`
      );
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: string,
    alert: ExpirationAlert,
    permit: any
  ): Promise<void> {
    const subject =
      alert.alertLevel === 'CRITICAL'
        ? `URGENT: Permit ${alert.permitNumber} Expiring Soon`
        : `Permit ${alert.permitNumber} Expiration Notice`;

    const message = this.buildExpirationEmail(alert, permit);

    // In production, would integrate with email service
    console.log(`Sending email to ${email}:`, {subject, message});
  }

  /**
   * Build expiration email
   */
  private buildExpirationEmail(alert: ExpirationAlert, permit: any): string {
    const urgency =
      alert.alertLevel === 'CRITICAL'
        ? 'URGENT'
        : alert.alertLevel === 'WARNING'
        ? 'IMPORTANT'
        : 'INFORMATIONAL';

    return `
${urgency}: Permit Expiration Notice

Permit Number: ${alert.permitNumber}
Expiration Date: ${alert.expiresAt.toLocaleDateString()}
Days Remaining: ${alert.daysUntilExpiration}

${alert.daysUntilExpiration <= 0
  ? '⚠️ This permit has EXPIRED. Work must stop until permit is renewed.'
  : alert.daysUntilExpiration <= 7
  ? '⚠️ This permit expires in less than a week. Please renew immediately to avoid work stoppage.'
  : alert.daysUntilExpiration <= 30
  ? '⚠️ This permit expires in less than 30 days. Please plan for renewal.'
  : 'This permit will expire soon. Please plan for renewal.'}

Action Required:
- Renew or extend permit before expiration date
- Contact jurisdiction if you need assistance
- Ensure all inspections are completed before expiration

Thank you,
Building Department
    `.trim();
  }

  /**
   * Get expiring permits
   */
  async getExpiringPermits(
    daysAhead: number = 30,
    jurisdictionId?: string
  ): Promise<Array<{
    permitId: string;
    permitNumber: string;
    expiresAt: Date;
    daysUntilExpiration: number;
    projectId?: string;
  }>> {
    const supabase = createClient();

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    let query = supabase
      .from('Permit')
      .select('id, permitNumber, expiresAt, projectId')
      .in('status', ['ISSUED', 'ACTIVE'])
      .not('expiresAt', 'is', null)
      .gte('expiresAt', now.toISOString())
      .lte('expiresAt', futureDate.toISOString())
      .order('expiresAt', {ascending: true});

    if (jurisdictionId) {
      query = query.eq('jurisdictionId', jurisdictionId);
    }

    const {data: permits} = await query;

    if (!permits) {
      return [];
    }

    return permits.map(permit => {
      const expiresAt = new Date(permit.expiresAt!);
      const daysUntilExpiration = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        permitId: permit.id,
        permitNumber: permit.permitNumber,
        expiresAt,
        daysUntilExpiration,
        projectId: permit.projectId || undefined,
      };
    });
  }
}

// Singleton instance
export const expirationAlertsService = new ExpirationAlertsService();

/**
 * Escalation Service
 * Handles escalation rules for delayed reviews
 */

import {createClient} from '@/lib/supabase/client';

export interface EscalationRule {
  id: string;
  name: string;
  triggerDays: number; // Days past due date
  action: 'notify' | 'reassign' | 'escalate_to_supervisor' | 'expedite';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notifyApplicant?: boolean;
  notifySupervisor?: boolean;
}

export interface EscalationEvent {
  id: string;
  reviewId: string;
  permitId: string;
  ruleId: string;
  triggeredAt: Date;
  action: string;
  resolved: boolean;
  resolvedAt?: Date;
}

export class EscalationService {
  private rules: EscalationRule[] = [
    {
      id: 'rule-1',
      name: 'First Reminder',
      triggerDays: 1, // 1 day past due
      action: 'notify',
      priority: 'medium',
      notifyApplicant: false,
      notifySupervisor: false,
    },
    {
      id: 'rule-2',
      name: 'Second Reminder',
      triggerDays: 3, // 3 days past due
      action: 'notify',
      priority: 'high',
      notifyApplicant: true,
      notifySupervisor: true,
    },
    {
      id: 'rule-3',
      name: 'Supervisor Escalation',
      triggerDays: 5, // 5 days past due
      action: 'escalate_to_supervisor',
      priority: 'high',
      notifyApplicant: true,
      notifySupervisor: true,
    },
    {
      id: 'rule-4',
      name: 'Reassignment',
      triggerDays: 7, // 7 days past due
      action: 'reassign',
      priority: 'urgent',
      notifyApplicant: true,
      notifySupervisor: true,
    },
    {
      id: 'rule-5',
      name: 'Expedite Processing',
      triggerDays: 10, // 10 days past due
      action: 'expedite',
      priority: 'urgent',
      notifyApplicant: true,
      notifySupervisor: true,
    },
  ];

  /**
   * Check and trigger escalations for overdue reviews
   */
  async checkEscalations(jurisdictionId?: string): Promise<EscalationEvent[]> {
    const supabase = createClient();
    const events: EscalationEvent[] = [];

    // Fetch overdue reviews
    const overdueReviews = await this.getOverdueReviews(jurisdictionId);

    for (const review of overdueReviews) {
      const daysOverdue = this.calculateDaysOverdue(review.dueDate);
      
      // Find applicable escalation rules
      const applicableRules = this.rules.filter(
        rule => daysOverdue >= rule.triggerDays
      );

      // Get highest priority rule that hasn't been triggered
      const highestRule = applicableRules.sort(
        (a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority)
      )[0];

      if (highestRule) {
        // Check if escalation already triggered for this review
        const existingEvent = await this.getExistingEscalation(review.id, highestRule.id);
        
        if (!existingEvent) {
          // Trigger escalation
          const event = await this.triggerEscalation(review, highestRule);
          events.push(event);
        }
      }
    }

    return events;
  }

  /**
   * Get overdue reviews
   */
  private async getOverdueReviews(jurisdictionId?: string) {
    const supabase = createClient();
    const now = new Date();

    let query = supabase
      .from('PermitReview')
      .select(`
        id,
        permitId,
        reviewerId,
        discipline,
        status,
        startedAt,
        permit:permitId (
          id,
          jurisdictionId,
          permitNumber,
          status
        )
      `)
      .in('status', ['ASSIGNED', 'IN_PROGRESS'])
      .lt('dueDate', now.toISOString());

    if (jurisdictionId) {
      query = query.eq('permit.jurisdictionId', jurisdictionId);
    }

    const {data: reviews} = await query;

    // Calculate due dates (would be stored in database)
    return (reviews || []).map((review: any) => ({
      ...review,
      dueDate: this.calculateDueDateFromStart(review.startedAt),
    }));
  }

  /**
   * Calculate days overdue
   */
  private calculateDaysOverdue(dueDate: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Calculate due date from start date (simplified - would use actual due date from DB)
   */
  private calculateDueDateFromStart(startedAt: string): Date {
    const start = new Date(startedAt);
    // Default: 10 business days
    let days = 0;
    let currentDate = new Date(start);

    while (days < 10) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
    }

    return currentDate;
  }

  /**
   * Trigger escalation
   */
  private async triggerEscalation(
    review: any,
    rule: EscalationRule
  ): Promise<EscalationEvent> {
    const supabase = createClient();
    const event: EscalationEvent = {
      id: `escalation-${Date.now()}`,
      reviewId: review.id,
      permitId: review.permitId,
      ruleId: rule.id,
      triggeredAt: new Date(),
      action: rule.action,
      resolved: false,
    };

    // Execute escalation action
    await this.executeEscalationAction(review, rule);

    // Store escalation event
    await supabase.from('PermitEvent').insert({
      permitId: review.permitId,
      type: 'ESCALATION',
      description: `Escalation triggered: ${rule.name} (${rule.action})`,
      metadata: {
        reviewId: review.id,
        ruleId: rule.id,
        daysOverdue: this.calculateDaysOverdue(review.dueDate),
      },
    });

    return event;
  }

  /**
   * Execute escalation action
   */
  private async executeEscalationAction(
    review: any,
    rule: EscalationRule
  ): Promise<void> {
    const supabase = createClient();

    switch (rule.action) {
      case 'notify':
        // Send notifications
        if (rule.notifyApplicant) {
          await this.notifyApplicant(review.permitId, rule);
        }
        if (rule.notifySupervisor) {
          await this.notifySupervisor(review, rule);
        }
        break;

      case 'reassign':
        // Reassign to different reviewer
        await this.reassignReview(review);
        break;

      case 'escalate_to_supervisor':
        // Assign supervisor to review
        await this.escalateToSupervisor(review);
        break;

      case 'expedite':
        // Mark as expedited and reassign
        await supabase
          .from('Permit')
          .update({expedited: true})
          .eq('id', review.permitId);
        await this.reassignReview(review);
        break;
    }
  }

  /**
   * Notify applicant
   */
  private async notifyApplicant(permitId: string, rule: EscalationRule): Promise<void> {
    // This would integrate with notification service
    // For now, create an event
    const supabase = createClient();
    await supabase.from('PermitEvent').insert({
      permitId,
      type: 'NOTIFICATION',
      description: `Applicant notified: ${rule.name}`,
    });
  }

  /**
   * Notify supervisor
   */
  private async notifySupervisor(review: any, rule: EscalationRule): Promise<void> {
    // This would integrate with notification service
    const supabase = createClient();
    await supabase.from('PermitEvent').insert({
      permitId: review.permitId,
      type: 'NOTIFICATION',
      description: `Supervisor notified: ${rule.name} for review ${review.id}`,
    });
  }

  /**
   * Reassign review
   */
  private async reassignReview(review: any): Promise<void> {
    // Import router service
    const {applicationRouterService} = await import('./application-router');
    
    // Re-route the permit
    await applicationRouterService.rerouteApplication(review.permitId, {
      excludePreviousReviewers: true,
      priority: 'urgent',
    });
  }

  /**
   * Escalate to supervisor
   */
  private async escalateToSupervisor(review: any): Promise<void> {
    const supabase = createClient();
    
    // Find supervisor
    const {data: supervisor} = await supabase
      .from('JurisdictionStaff')
      .select('userId')
      .eq('role', 'ADMINISTRATOR')
      .eq('active', true)
      .limit(1)
      .single();

    if (supervisor) {
      // Create supervisor review assignment
      // This would be handled by the routing system
      await supabase.from('PermitEvent').insert({
        permitId: review.permitId,
        type: 'ESCALATION',
        description: `Escalated to supervisor for review`,
        metadata: {
          reviewId: review.id,
          supervisorId: supervisor.userId,
        },
      });
    }
  }

  /**
   * Get existing escalation
   */
  private async getExistingEscalation(
    reviewId: string,
    ruleId: string
  ): Promise<EscalationEvent | null> {
    // Check if escalation already triggered
    // This would query from database
    return null;
  }

  /**
   * Get priority value for sorting
   */
  private getPriorityValue(priority: string): number {
    const values: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4,
    };
    return values[priority] || 0;
  }

  /**
   * Add custom escalation rule
   */
  addRule(rule: EscalationRule): void {
    this.rules.push(rule);
  }

  /**
   * Get all escalation rules
   */
  getAllRules(): EscalationRule[] {
    return [...this.rules];
  }
}

// Singleton instance
export const escalationService = new EscalationService();

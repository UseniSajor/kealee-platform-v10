/**
 * Permit Timeline Service
 * Public view of application status and timeline
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface PermitTimelineEvent {
  id: string;
  date: Date;
  type:
    | 'SUBMITTED'
    | 'REVIEW_STARTED'
    | 'CORRECTIONS_REQUIRED'
    | 'RESUBMITTED'
    | 'APPROVED'
    | 'ISSUED'
    | 'INSPECTION_SCHEDULED'
    | 'INSPECTION_COMPLETED'
    | 'COMPLETED'
    | 'EXPIRED'
    | 'CANCELLED';
  title: string;
  description: string;
  actor?: string; // Name of person/system who performed action
  documents?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface PermitTimeline {
  permitId: string;
  permitNumber: string;
  currentStatus: string;
  statusDescription: string;
  events: PermitTimelineEvent[];
  estimatedCompletion?: Date;
  nextSteps?: string[];
}

export class PermitTimelineService {
  /**
   * Get permit timeline
   */
  async getPermitTimeline(permitId: string): Promise<PermitTimeline> {
    const supabase = createClient();

    // Get permit
    const {data: permit} = await supabase
      .from('Permit')
      .select('*, applicant:User(name), jurisdiction:Jurisdiction(name)')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    // Get permit events
    const {data: events} = await supabase
      .from('PermitEvent')
      .select('*')
      .eq('permitId', permitId)
      .order('createdAt', {ascending: true});

    // Get inspections
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('id, type, scheduledDate, completedAt, status, result')
      .eq('permitId', permitId)
      .order('scheduledDate', {ascending: true});

    // Build timeline events
    const timelineEvents: PermitTimelineEvent[] = [];

    // Permit lifecycle events
    if (permit.submittedAt) {
      timelineEvents.push({
        id: `event-submitted`,
        date: new Date(permit.submittedAt),
        type: 'SUBMITTED',
        title: 'Application Submitted',
        description: `Permit application submitted by ${(permit.applicant as any)?.name || 'applicant'}`,
        actor: (permit.applicant as any)?.name || undefined,
      });
    }

    if (permit.reviewStartedAt) {
      timelineEvents.push({
        id: `event-review-started`,
        date: new Date(permit.reviewStartedAt),
        type: 'REVIEW_STARTED',
        title: 'Review Started',
        description: 'Plan review process initiated',
      });
    }

    if (permit.approvedAt) {
      timelineEvents.push({
        id: `event-approved`,
        date: new Date(permit.approvedAt),
        type: 'APPROVED',
        title: 'Application Approved',
        description: 'Permit application approved by jurisdiction',
      });
    }

    if (permit.issuedAt) {
      timelineEvents.push({
        id: `event-issued`,
        date: new Date(permit.issuedAt),
        type: 'ISSUED',
        title: 'Permit Issued',
        description: `Permit issued. Expires ${permit.expiresAt ? new Date(permit.expiresAt).toLocaleDateString() : 'N/A'}`,
      });
    }

    // Add custom events
    if (events) {
      events.forEach(event => {
        timelineEvents.push({
          id: event.id,
          date: new Date(event.createdAt),
          type: this.mapEventType(event.eventType),
          title: event.title || event.eventType,
          description: event.description || '',
          actor: event.createdBy || undefined,
        });
      });
    }

    // Add inspection events
    if (inspections) {
      inspections.forEach(inspection => {
        if (inspection.scheduledDate) {
          timelineEvents.push({
            id: `inspection-scheduled-${inspection.id}`,
            date: new Date(inspection.scheduledDate),
            type: 'INSPECTION_SCHEDULED',
            title: `${inspection.type} Inspection Scheduled`,
            description: `Inspection scheduled for ${inspection.type}`,
          });
        }

        if (inspection.completedAt) {
          const result = inspection.result || 'PENDING';
          timelineEvents.push({
            id: `inspection-completed-${inspection.id}`,
            date: new Date(inspection.completedAt),
            type: 'INSPECTION_COMPLETED',
            title: `${inspection.type} Inspection Completed`,
            description: `Inspection result: ${result}`,
          });
        }
      });
    }

    // Sort by date
    timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Generate status description
    const statusDescription = this.getStatusDescription(permit.status);

    // Determine next steps
    const nextSteps = this.getNextSteps(permit.status, inspections || []);

    // Estimate completion
    const estimatedCompletion = this.estimateCompletion(
      permit.status,
      permit.expiresAt,
      inspections || []
    );

    return {
      permitId: permit.id,
      permitNumber: permit.permitNumber,
      currentStatus: permit.status,
      statusDescription,
      events: timelineEvents,
      estimatedCompletion,
      nextSteps,
    };
  }

  /**
   * Map event type
   */
  private mapEventType(eventType: string): PermitTimelineEvent['type'] {
    const mapping: Record<string, PermitTimelineEvent['type']> = {
      SUBMITTED: 'SUBMITTED',
      REVIEW_STARTED: 'REVIEW_STARTED',
      CORRECTIONS_REQUIRED: 'CORRECTIONS_REQUIRED',
      RESUBMITTED: 'RESUBMITTED',
      APPROVED: 'APPROVED',
      ISSUED: 'ISSUED',
      COMPLETED: 'COMPLETED',
      EXPIRED: 'EXPIRED',
      CANCELLED: 'CANCELLED',
    };

    return mapping[eventType] || 'SUBMITTED';
  }

  /**
   * Get status description
   */
  private getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      DRAFT: 'Application is being prepared',
      SUBMITTED: 'Application has been submitted and is pending review',
      UNDER_REVIEW: 'Application is currently under review',
      CORRECTIONS_REQUIRED: 'Corrections are required before approval',
      RESUBMITTED: 'Corrected application has been resubmitted',
      APPROVED: 'Application has been approved',
      ISSUED: 'Permit has been issued and is active',
      ACTIVE: 'Permit is active and construction may proceed',
      INSPECTION_HOLD: 'Work is on hold pending inspection',
      EXPIRED: 'Permit has expired',
      COMPLETED: 'Permit work has been completed',
      CANCELLED: 'Permit has been cancelled',
    };

    return descriptions[status] || status;
  }

  /**
   * Get next steps
   */
  private getNextSteps(status: string, inspections: any[]): string[] {
    const steps: string[] = [];

    switch (status) {
      case 'SUBMITTED':
        steps.push('Application will be reviewed by jurisdiction staff');
        steps.push('You will be notified when review begins');
        break;
      case 'UNDER_REVIEW':
        steps.push('Review in progress');
        steps.push('You will be notified of any required corrections');
        break;
      case 'CORRECTIONS_REQUIRED':
        steps.push('Address required corrections');
        steps.push('Resubmit corrected documents');
        break;
      case 'APPROVED':
        steps.push('Pay permit fees');
        steps.push('Permit will be issued upon payment');
        break;
      case 'ISSUED':
      case 'ACTIVE':
        const pendingInspections = inspections.filter(
          i => i.status !== 'COMPLETED' && i.status !== 'CANCELLED'
        );
        if (pendingInspections.length > 0) {
          steps.push(`${pendingInspections.length} inspection(s) pending`);
          steps.push('Request inspections as work progresses');
        } else {
          steps.push('All inspections completed');
          steps.push('Request final inspection when work is complete');
        }
        break;
      case 'INSPECTION_HOLD':
        steps.push('Address inspection corrections');
        steps.push('Request reinspection when corrections are complete');
        break;
      case 'COMPLETED':
        steps.push('Permit work completed');
        break;
    }

    return steps;
  }

  /**
   * Estimate completion
   */
  private estimateCompletion(
    status: string,
    expiresAt: Date | null,
    inspections: any[]
  ): Date | undefined {
    // If expired, return expiration date
    if (status === 'EXPIRED' && expiresAt) {
      return new Date(expiresAt);
    }

    // If completed, return null
    if (status === 'COMPLETED') {
      return undefined;
    }

    // Estimate based on remaining inspections
    const pendingInspections = inspections.filter(
      i => i.status !== 'COMPLETED' && i.status !== 'CANCELLED'
    );

    if (pendingInspections.length > 0) {
      // Estimate 2 weeks per pending inspection
      const weeks = pendingInspections.length * 2;
      const estimated = new Date();
      estimated.setDate(estimated.getDate() + weeks * 7);
      return estimated;
    }

    // Use expiration date if available
    if (expiresAt) {
      return new Date(expiresAt);
    }

    return undefined;
  }
}

// Singleton instance
export const permitTimelineService = new PermitTimelineService();

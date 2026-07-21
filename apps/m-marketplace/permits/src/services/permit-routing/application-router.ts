/**
 * Application Router Service
 * Main service for routing permit applications to reviewers
 */

import {routingRulesService, PermitData} from './routing-rules';
import {workloadBalancerService, AssignmentOptions} from '@permits/src/services/jurisdiction-staff/workload-balancer';
import {JurisdictionStaff, ReviewDiscipline} from '@permits/src/types/jurisdiction-staff';
import {createClient} from '@permits/src/lib/supabase/client';

export interface RoutingResult {
  permitId: string;
  disciplines: ReviewDiscipline[];
  assignments: Array<{
    discipline: ReviewDiscipline;
    reviewerId: string;
    reviewerName: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedHours: number;
    dueDate: Date;
    reason: string;
  }>;
  autoApprove: boolean;
  routingReason: string;
}

export interface RoutingOptions {
  permitId: string;
  jurisdictionId: string;
  expedited?: boolean;
  excludeStaffIds?: string[];
  forceReassignment?: boolean;
}

export class ApplicationRouterService {
  /**
   * Route permit application to reviewers
   */
  async routeApplication(options: RoutingOptions): Promise<RoutingResult> {
    const supabase = createClient();

    // Fetch permit data
    const {data: permit, error: permitError} = await supabase
      .from('Permit')
      .select('*')
      .eq('id', options.permitId)
      .single();

    if (permitError || !permit) {
      throw new Error(`Permit not found: ${options.permitId}`);
    }

    // Fetch property data
    const {data: property} = await supabase
      .from('Property')
      .select('zoning')
      .eq('id', permit.propertyId)
      .single();

    // Check if this is a resubmission
    const {data: previousReviews} = await supabase
      .from('PermitReview')
      .select('id, status')
      .eq('permitId', options.permitId)
      .in('status', ['COMPLETED_CORRECTIONS_REQUIRED']);

    const isResubmission = (previousReviews?.length || 0) > 0;

    // Build permit data
    const permitData: PermitData = {
      id: permit.id,
      permitType: permit.type as any,
      subtype: permit.subtype || undefined,
      valuation: Number(permit.valuation),
      squareFootage: permit.squareFootage ? Number(permit.squareFootage) : undefined,
      expedited: options.expedited || permit.expedited || false,
      jurisdictionId: options.jurisdictionId,
      propertyId: permit.propertyId,
      zoning: property?.zoning || undefined,
      isResubmission,
      previousReviewId: previousReviews?.[0]?.id,
      correctionsRequired: isResubmission,
    };

    // Get required disciplines
    const disciplines = routingRulesService.getRequiredDisciplines(permitData);
    const priority = routingRulesService.getRoutingPriority(permitData);
    const estimatedHours = routingRulesService.getEstimatedHours(permitData);
    const autoApprove = routingRulesService.canAutoApprove(permitData);

    // Fetch available staff
    const staff = await this.getAvailableStaff(
      options.jurisdictionId,
      disciplines,
      options.excludeStaffIds
    );

    // Calculate due date
    const dueDate = this.calculateDueDate(priority, permitData.expedited);

    // Assign reviewers for each discipline
    const assignments = await Promise.all(
      disciplines.map(async (discipline) => {
        const assignment = await this.assignReviewer(
          staff,
          {
            permitId: options.permitId,
            discipline,
            priority,
            dueDate,
            estimatedHours,
            location: await this.getPropertyLocation(permit.propertyId),
            excludeStaffIds: options.excludeStaffIds,
          }
        );

        if (!assignment) {
          throw new Error(`No available reviewer for ${discipline}`);
        }

        // Find staff member for name
        const reviewer = staff.find(s => s.id === assignment.staffId);
        
        return {
          discipline,
          reviewerId: assignment.staffId,
          reviewerName: reviewer?.name || 'Unknown',
          priority,
          estimatedHours,
          dueDate,
          reason: assignment.reason,
        };
      })
    );

    // Generate routing reason
    const routingReason = this.generateRoutingReason(permitData, assignments, autoApprove);

    return {
      permitId: options.permitId,
      disciplines,
      assignments,
      autoApprove,
      routingReason,
    };
  }

  /**
   * Re-route application (for corrections/resubmittals)
   */
  async rerouteApplication(
    permitId: string,
    options?: {
      excludePreviousReviewers?: boolean;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }
  ): Promise<RoutingResult> {
    // Get previous reviewers if we should exclude them
    const excludeStaffIds = options?.excludePreviousReviewers
      ? await this.getPreviousReviewers(permitId)
      : undefined;

    // Get permit jurisdiction
    const supabase = createClient();
    const {data: permit} = await supabase
      .from('Permit')
      .select('jurisdictionId, expedited')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    return this.routeApplication({
      permitId,
      jurisdictionId: permit.jurisdictionId,
      expedited: permit.expedited,
      excludeStaffIds,
    });
  }

  /**
   * Get available staff for disciplines
   */
  private async getAvailableStaff(
    jurisdictionId: string,
    disciplines: ReviewDiscipline[],
    excludeStaffIds?: string[]
  ): Promise<JurisdictionStaff[]> {
    const supabase = createClient();

    // Fetch jurisdiction staff
    const {data: staffRecords, error} = await supabase
      .from('JurisdictionStaff')
      .select(`
        *,
        user:userId (
          id,
          name,
          email
        )
      `)
      .eq('jurisdictionId', jurisdictionId)
      .eq('active', true)
      .eq('role', 'PLAN_REVIEWER');

    if (error || !staffRecords) {
      return [];
    }

    // Filter by disciplines and convert to JurisdictionStaff format
    // Note: This is a simplified version - you'd need to fetch full staff data
    // including disciplines, workload, etc. from your database
    const staff: JurisdictionStaff[] = staffRecords
      .filter((record: any) => {
        if (excludeStaffIds?.includes(record.id)) return false;
        // In real implementation, check if staff has required disciplines
        return true;
      })
      .map((record: any) => ({
        id: record.id,
        userId: record.userId,
        jurisdictionId: record.jurisdictionId,
        name: record.user?.name || 'Unknown',
        email: record.user?.email || '',
        role: 'PLAN_REVIEWER' as any,
        disciplines: [], // Would fetch from database
        isActive: record.active,
        currentWorkload: 0, // Would calculate from database
        maxWorkload: 10, // Would fetch from database
        workingHours: {}, // Would fetch from database
        vacationDates: [], // Would fetch from database
      }));

    return staff;
  }

  /**
   * Assign reviewer for a discipline
   */
  private async assignReviewer(
    staff: JurisdictionStaff[],
    options: AssignmentOptions
  ) {
    return workloadBalancerService.assignWork(staff, options);
  }

  /**
   * Calculate due date based on priority
   */
  private calculateDueDate(
    priority: 'low' | 'medium' | 'high' | 'urgent',
    expedited: boolean
  ): Date {
    const now = new Date();
    const days = expedited
      ? 2 // 2 business days for expedited
      : priority === 'urgent'
      ? 3
      : priority === 'high'
      ? 5
      : priority === 'medium'
      ? 10
      : 15; // low priority

    // Add business days (skip weekends)
    let addedDays = 0;
    let currentDate = new Date(now);

    while (addedDays < days) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not weekend
        addedDays++;
      }
    }

    return currentDate;
  }

  /**
   * Get property location for proximity-based routing
   */
  private async getPropertyLocation(propertyId: string): Promise<{latitude: number; longitude: number} | undefined> {
    const supabase = createClient();
    const {data: property} = await supabase
      .from('Property')
      .select('latitude, longitude')
      .eq('id', propertyId)
      .single();

    if (property?.latitude && property?.longitude) {
      return {
        latitude: property.latitude,
        longitude: property.longitude,
      };
    }

    return undefined;
  }

  /**
   * Get previous reviewers for a permit
   */
  private async getPreviousReviewers(permitId: string): Promise<string[]> {
    const supabase = createClient();
    const {data: reviews} = await supabase
      .from('PermitReview')
      .select('reviewerId')
      .eq('permitId', permitId);

    return reviews?.map(r => r.reviewerId) || [];
  }

  /**
   * Generate routing reason
   */
  private generateRoutingReason(
    permit: PermitData,
    assignments: RoutingResult['assignments'],
    autoApprove: boolean
  ): string {
    const reasons: string[] = [];

    if (permit.expedited) {
      reasons.push('expedited processing');
    }

    if (permit.isResubmission) {
      reasons.push('resubmission after corrections');
    }

    if (permit.valuation > 1000000) {
      reasons.push('large project');
    }

    if (autoApprove) {
      reasons.push('eligible for auto-approval');
    }

    reasons.push(`assigned to ${assignments.length} discipline(s)`);

    return `Routed: ${reasons.join(', ')}`;
  }
}

// Singleton instance
export const applicationRouterService = new ApplicationRouterService();

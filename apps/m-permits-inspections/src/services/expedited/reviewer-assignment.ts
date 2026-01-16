/**
 * Dedicated Reviewer Assignment Service
 * Dedicated reviewer assignment for expedited permits
 */

import {createClient} from '@/lib/supabase/client';
import {workloadBalancerService} from '@/services/jurisdiction-staff/workload-balancer';

export interface ExpeditedReviewerAssignment {
  permitId: string;
  coordinatorId: string;
  coordinatorName: string;
  reviewers: Array<{
    discipline: string;
    reviewerId: string;
    reviewerName: string;
    assignedAt: Date;
  }>;
  assignedAt: Date;
}

export class ExpeditedReviewerAssignmentService {
  /**
   * Assign dedicated reviewers for expedited permit
   */
  async assignDedicatedReviewers(
    permitId: string,
    disciplines: string[]
  ): Promise<ExpeditedReviewerAssignment> {
    const supabase = createClient();

    // Get permit details
    const {data: permit} = await supabase
      .from('Permit')
      .select('jurisdictionId, type')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    // Get available coordinators
    const {data: coordinators} = await supabase
      .from('JurisdictionStaff')
      .select('*, user:User(name)')
      .eq('jurisdictionId', permit.jurisdictionId)
      .eq('role', 'PERMIT_COORDINATOR')
      .eq('active', true);

    if (!coordinators || coordinators.length === 0) {
      throw new Error('No permit coordinators available');
    }

    // Assign coordinator (prefer one with lowest workload)
    const coordinator = await workloadBalancerService.getAvailableStaff(
      permit.jurisdictionId,
      'PERMIT_COORDINATOR'
    );

    if (!coordinator) {
      throw new Error('No available coordinator');
    }

    // Assign reviewers for each discipline
    const reviewers: ExpeditedReviewerAssignment['reviewers'] = [];

    for (const discipline of disciplines) {
      // Get available reviewer for discipline
      const {data: staff} = await supabase
        .from('JurisdictionStaff')
        .select('*, user:User(name)')
        .eq('jurisdictionId', permit.jurisdictionId)
        .eq('role', 'PLAN_REVIEWER')
        .eq('active', true)
        .contains('specialties', [discipline]);

      if (!staff || staff.length === 0) {
        // Fallback to any reviewer
        const {data: anyStaff} = await supabase
          .from('JurisdictionStaff')
          .select('*, user:User(name)')
          .eq('jurisdictionId', permit.jurisdictionId)
          .eq('role', 'PLAN_REVIEWER')
          .eq('active', true)
          .limit(1);

        if (anyStaff && anyStaff.length > 0) {
          reviewers.push({
            discipline,
            reviewerId: anyStaff[0].id,
            reviewerName: (anyStaff[0].user as any)?.name || 'Unknown',
            assignedAt: new Date(),
          });
        }
      } else {
        // Use workload balancer to select best reviewer
        const reviewer = await workloadBalancerService.getAvailableStaff(
          permit.jurisdictionId,
          'PLAN_REVIEWER',
          discipline
        );

        if (reviewer) {
          reviewers.push({
            discipline,
            reviewerId: reviewer.id,
            reviewerName: reviewer.name || 'Unknown',
            assignedAt: new Date(),
          });
        }
      }
    }

    // Create review assignments
    for (const reviewer of reviewers) {
      await supabase.from('PermitReview').insert({
        permitId,
        reviewerId: reviewer.reviewerId,
        discipline: reviewer.discipline,
        status: 'ASSIGNED',
        startedAt: new Date().toISOString(),
      });
    }

    return {
      permitId,
      coordinatorId: coordinator.id,
      coordinatorName: coordinator.name || 'Unknown',
      reviewers,
      assignedAt: new Date(),
    };
  }

  /**
   * Assign dedicated coordinator
   */
  async assignCoordinator(permitId: string): Promise<{
    coordinatorId: string;
    coordinatorName: string;
  }> {
    const supabase = createClient();

    const {data: permit} = await supabase
      .from('Permit')
      .select('jurisdictionId')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    const coordinator = await workloadBalancerService.getAvailableStaff(
      permit.jurisdictionId,
      'PERMIT_COORDINATOR'
    );

    if (!coordinator) {
      throw new Error('No available coordinator');
    }

    // Update permit with coordinator
    await supabase
      .from('Permit')
      .update({
        coordinatorId: coordinator.id,
      })
      .eq('id', permitId);

    return {
      coordinatorId: coordinator.id,
      coordinatorName: coordinator.name || 'Unknown',
    };
  }
}

// Singleton instance
export const expeditedReviewerAssignmentService = new ExpeditedReviewerAssignmentService();

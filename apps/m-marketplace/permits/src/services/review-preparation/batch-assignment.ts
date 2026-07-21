/**
 * Batch Assignment Service
 * Batch review assignment for multi-discipline permits
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {applicationRouterService} from '@permits/src/services/permit-routing/application-router';
import {ReviewDiscipline} from '@permits/src/types/jurisdiction-staff';

export interface BatchAssignmentRequest {
  permitId: string;
  disciplines: ReviewDiscipline[];
  options?: {
    assignToSameReviewer?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    excludeStaffIds?: string[];
  };
}

export interface BatchAssignmentResult {
  permitId: string;
  assignments: Array<{
    discipline: ReviewDiscipline;
    reviewerId: string;
    reviewerName: string;
    status: string;
    dueDate: Date;
    estimatedHours: number;
  }>;
  assignedAt: Date;
}

export class BatchAssignmentService {
  /**
   * Assign multiple disciplines for batch review
   */
  async assignBatchReviews(
    request: BatchAssignmentRequest
  ): Promise<BatchAssignmentResult> {
    const supabase = createClient();

    // Get permit
    const {data: permit} = await supabase
      .from('Permit')
      .select('jurisdictionId, expedited')
      .eq('id', request.permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    const assignments: BatchAssignmentResult['assignments'] = [];
    const assignedReviewers = new Set<string>();

    // Assign each discipline
    for (const discipline of request.disciplines) {
      // Check if we should assign to same reviewer
      let reviewerId: string | undefined;
      if (request.options?.assignToSameReviewer && assignedReviewers.size > 0) {
        reviewerId = Array.from(assignedReviewers)[0];
      }

      // Route application for this discipline
      const routingResult = await applicationRouterService.routeApplication({
        permitId: request.permitId,
        jurisdictionId: permit.jurisdictionId,
        expedited: permit.expedited || request.options?.priority === 'urgent',
        excludeStaffIds: [
          ...(request.options?.excludeStaffIds || []),
          ...Array.from(assignedReviewers),
        ],
      });

      // Find assignment for this discipline
      const disciplineAssignment = routingResult.assignments.find(
        a => a.discipline === discipline
      );

      if (disciplineAssignment) {
        // Create review record
        const {data: review} = await supabase
          .from('PermitReview')
          .insert({
            permitId: request.permitId,
            reviewerId: disciplineAssignment.reviewerId,
            discipline,
            status: 'ASSIGNED',
            startedAt: new Date().toISOString(),
            dueDate: request.options?.dueDate
              ? request.options.dueDate.toISOString()
              : disciplineAssignment.dueDate.toISOString(),
          })
          .select('id')
          .single();

        assignments.push({
          discipline,
          reviewerId: disciplineAssignment.reviewerId,
          reviewerName: disciplineAssignment.reviewerName,
          status: 'ASSIGNED',
          dueDate: disciplineAssignment.dueDate,
          estimatedHours: disciplineAssignment.estimatedHours,
        });

        assignedReviewers.add(disciplineAssignment.reviewerId);
      }
    }

    // Update permit status
    await supabase
      .from('Permit')
      .update({
        status: 'UNDER_REVIEW',
        reviewStartedAt: new Date().toISOString(),
      })
      .eq('id', request.permitId);

    return {
      permitId: request.permitId,
      assignments,
      assignedAt: new Date(),
    };
  }

  /**
   * Get batch assignment status
   */
  async getBatchAssignmentStatus(permitId: string): Promise<{
    totalDisciplines: number;
    assigned: number;
    inProgress: number;
    completed: number;
    assignments: Array<{
      discipline: ReviewDiscipline;
      reviewerName: string;
      status: string;
      progress: number;
      dueDate: Date;
    }>;
  }> {
    const supabase = createClient();

    const {data: reviews} = await supabase
      .from('PermitReview')
      .select(`
        *,
        reviewer:reviewerId(name)
      `)
      .eq('permitId', permitId);

    if (!reviews) {
      return {
        totalDisciplines: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        assignments: [],
      };
    }

    const assignments = reviews.map((review: any) => ({
      discipline: review.discipline,
      reviewerName: review.reviewer?.name || 'Unknown',
      status: review.status,
      progress: this.calculateProgress(review),
      dueDate: new Date(review.dueDate || review.startedAt),
    }));

    return {
      totalDisciplines: reviews.length,
      assigned: reviews.filter((r: any) => r.status === 'ASSIGNED').length,
      inProgress: reviews.filter((r: any) => r.status === 'IN_PROGRESS').length,
      completed: reviews.filter((r: any) =>
        ['COMPLETED_APPROVED', 'COMPLETED_CORRECTIONS_REQUIRED'].includes(r.status)
      ).length,
      assignments,
    };
  }

  /**
   * Calculate review progress
   */
  private calculateProgress(review: any): number {
    // In production, would calculate based on checklist completion, comments, etc.
    switch (review.status) {
      case 'ASSIGNED':
        return 0;
      case 'IN_PROGRESS':
        return 50;
      case 'COMPLETED_APPROVED':
      case 'COMPLETED_CORRECTIONS_REQUIRED':
        return 100;
      default:
        return 0;
    }
  }
}

// Singleton instance
export const batchAssignmentService = new BatchAssignmentService();

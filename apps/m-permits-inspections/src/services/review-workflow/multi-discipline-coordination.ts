/**
 * Multi-Discipline Review Coordination Service
 * Coordinates reviews across multiple disciplines
 */

import {createClient} from '@/lib/supabase/client';

export interface ReviewDiscipline {
  discipline: string;
  reviewerId: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED_APPROVED' | 'COMPLETED_CORRECTIONS_REQUIRED';
  startedAt: Date;
  completedAt?: Date;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dependencies: string[]; // Other disciplines that must complete first
}

export interface PermitReviewCoordination {
  permitId: string;
  disciplines: ReviewDiscipline[];
  overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'AWAITING_CORRECTIONS' | 'READY_FOR_APPROVAL' | 'APPROVED';
  blockingDisciplines: string[]; // Disciplines blocking progress
  readyDisciplines: string[]; // Disciplines ready to start
  completedDisciplines: string[]; // Completed disciplines
}

export class MultiDisciplineCoordinationService {
  /**
   * Get coordination status for permit
   */
  async getCoordinationStatus(permitId: string): Promise<PermitReviewCoordination> {
    const supabase = createClient();

    // Get all reviews for permit
    const {data: reviews} = await supabase
      .from('PermitReview')
      .select('*')
      .eq('permitId', permitId)
      .order('startedAt', {ascending: true});

    if (!reviews || reviews.length === 0) {
      return {
        permitId,
        disciplines: [],
        overallStatus: 'NOT_STARTED',
        blockingDisciplines: [],
        readyDisciplines: [],
        completedDisciplines: [],
      };
    }

    const disciplines: ReviewDiscipline[] = reviews.map(r => ({
      discipline: r.discipline,
      reviewerId: r.reviewerId,
      status: r.status,
      startedAt: new Date(r.startedAt),
      completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
      priority: 'NORMAL', // Would be stored in review
      dependencies: [], // Would be configured per permit type
    }));

    // Determine overall status
    const allCompleted = disciplines.every(d => 
      d.status === 'COMPLETED_APPROVED' || d.status === 'COMPLETED_CORRECTIONS_REQUIRED'
    );
    const anyCorrections = disciplines.some(d => d.status === 'COMPLETED_CORRECTIONS_REQUIRED');
    const anyInProgress = disciplines.some(d => d.status === 'IN_PROGRESS');
    const anyAssigned = disciplines.some(d => d.status === 'ASSIGNED');

    let overallStatus: PermitReviewCoordination['overallStatus'];
    if (allCompleted && !anyCorrections) {
      overallStatus = 'READY_FOR_APPROVAL';
    } else if (anyCorrections) {
      overallStatus = 'AWAITING_CORRECTIONS';
    } else if (anyInProgress || anyAssigned) {
      overallStatus = 'IN_PROGRESS';
    } else {
      overallStatus = 'NOT_STARTED';
    }

    // Determine blocking disciplines (those with corrections required)
    const blockingDisciplines = disciplines
      .filter(d => d.status === 'COMPLETED_CORRECTIONS_REQUIRED')
      .map(d => d.discipline);

    // Determine ready disciplines (dependencies met)
    const readyDisciplines = disciplines
      .filter(d => {
        if (d.status !== 'ASSIGNED') return false;
        // Check if dependencies are met
        return d.dependencies.every(dep => 
          disciplines.find(d => d.discipline === dep)?.status === 'COMPLETED_APPROVED'
        );
      })
      .map(d => d.discipline);

    // Completed disciplines
    const completedDisciplines = disciplines
      .filter(d => d.status === 'COMPLETED_APPROVED')
      .map(d => d.discipline);

    return {
      permitId,
      disciplines,
      overallStatus,
      blockingDisciplines,
      readyDisciplines,
      completedDisciplines,
    };
  }

  /**
   * Check if discipline can start review
   */
  canStartReview(
    coordination: PermitReviewCoordination,
    discipline: string
  ): {canStart: boolean; reason?: string} {
    const reviewDiscipline = coordination.disciplines.find(d => d.discipline === discipline);
    
    if (!reviewDiscipline) {
      return {canStart: false, reason: 'Discipline not assigned'};
    }

    if (reviewDiscipline.status !== 'ASSIGNED') {
      return {canStart: false, reason: `Review already ${reviewDiscipline.status}`};
    }

    // Check dependencies
    const unmetDependencies = reviewDiscipline.dependencies.filter(dep => {
      const depReview = coordination.disciplines.find(d => d.discipline === dep);
      return !depReview || depReview.status !== 'COMPLETED_APPROVED';
    });

    if (unmetDependencies.length > 0) {
      return {
        canStart: false,
        reason: `Waiting for: ${unmetDependencies.join(', ')}`,
      };
    }

    return {canStart: true};
  }

  /**
   * Start review for discipline
   */
  async startReview(permitId: string, discipline: string): Promise<void> {
    const supabase = createClient();

    await supabase
      .from('PermitReview')
      .update({
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
      })
      .eq('permitId', permitId)
      .eq('discipline', discipline);
  }

  /**
   * Get next available discipline to review
   */
  getNextAvailableDiscipline(
    coordination: PermitReviewCoordination
  ): string | null {
    const ready = coordination.readyDisciplines[0];
    return ready || null;
  }

  /**
   * Get review dependencies graph
   */
  getDependencyGraph(coordination: PermitReviewCoordination): {
    nodes: Array<{id: string; label: string; status: string}>;
    edges: Array<{from: string; to: string}>;
  } {
    const nodes = coordination.disciplines.map(d => ({
      id: d.discipline,
      label: d.discipline,
      status: d.status,
    }));

    const edges: Array<{from: string; to: string}> = [];
    coordination.disciplines.forEach(d => {
      d.dependencies.forEach(dep => {
        edges.push({from: dep, to: d.discipline});
      });
    });

    return {nodes, edges};
  }
}

// Singleton instance
export const multiDisciplineCoordinationService = new MultiDisciplineCoordinationService();

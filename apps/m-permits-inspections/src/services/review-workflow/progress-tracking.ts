/**
 * Review Progress Tracking Service
 * Tracks review progress with dashboards
 */

import {createClient} from '@/lib/supabase/client';
import {multiDisciplineCoordinationService} from './multi-discipline-coordination';

export interface ReviewProgress {
  permitId: string;
  totalDisciplines: number;
  completedDisciplines: number;
  inProgressDisciplines: number;
  pendingDisciplines: number;
  correctionsRequired: number;
  overallProgress: number; // 0-100
  estimatedCompletionDate?: Date;
  onTrack: boolean;
}

export interface DisciplineProgress {
  discipline: string;
  reviewerName: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
  commentsCount: number;
  correctionsCount: number;
  progress: number; // 0-100
  estimatedCompletion?: Date;
}

export interface ReviewDashboard {
  permitId: string;
  overallProgress: ReviewProgress;
  disciplineProgress: DisciplineProgress[];
  timeline: ReviewTimelineEvent[];
  blockers: string[];
  nextSteps: string[];
}

export interface ReviewTimelineEvent {
  date: Date;
  type: 'STARTED' | 'COMPLETED' | 'CORRECTIONS_REQUIRED' | 'RESUBMITTED' | 'APPROVED';
  discipline?: string;
  description: string;
}

export class ReviewProgressTrackingService {
  /**
   * Get review progress for permit
   */
  async getReviewProgress(permitId: string): Promise<ReviewProgress> {
    const supabase = createClient();

    // Get coordination status
    const coordination = await multiDisciplineCoordinationService.getCoordinationStatus(permitId);

    const totalDisciplines = coordination.disciplines.length;
    const completedDisciplines = coordination.disciplines.filter(
      d => d.status === 'COMPLETED_APPROVED'
    ).length;
    const inProgressDisciplines = coordination.disciplines.filter(
      d => d.status === 'IN_PROGRESS'
    ).length;
    const pendingDisciplines = coordination.disciplines.filter(
      d => d.status === 'ASSIGNED'
    ).length;
    const correctionsRequired = coordination.disciplines.filter(
      d => d.status === 'COMPLETED_CORRECTIONS_REQUIRED'
    ).length;

    // Calculate overall progress
    const overallProgress = totalDisciplines > 0
      ? Math.round((completedDisciplines / totalDisciplines) * 100)
      : 0;

    // Estimate completion date
    const estimatedCompletionDate = this.estimateCompletionDate(coordination);

    // Check if on track
    const onTrack = this.isOnTrack(coordination);

    return {
      permitId,
      totalDisciplines,
      completedDisciplines,
      inProgressDisciplines,
      pendingDisciplines,
      correctionsRequired,
      overallProgress,
      estimatedCompletionDate,
      onTrack,
    };
  }

  /**
   * Get discipline-level progress
   */
  async getDisciplineProgress(permitId: string): Promise<DisciplineProgress[]> {
    const supabase = createClient();

    // Get reviews
    const {data: reviews} = await supabase
      .from('PermitReview')
      .select('*, reviewer:User(name)')
      .eq('permitId', permitId);

    if (!reviews) {
      return [];
    }

    // Get comment counts
    const reviewIds = reviews.map(r => r.id);
    const {data: comments} = await supabase
      .from('ReviewComment')
      .select('reviewId, severity')
      .in('reviewId', reviewIds);

    const commentCounts = new Map<string, number>();
    const correctionCounts = new Map<string, number>();

    comments?.forEach(c => {
      const count = commentCounts.get(c.reviewId) || 0;
      commentCounts.set(c.reviewId, count + 1);

      if (c.severity === 'CRITICAL' || c.severity === 'MAJOR') {
        const corrCount = correctionCounts.get(c.reviewId) || 0;
        correctionCounts.set(c.reviewId, corrCount + 1);
      }
    });

    // Build discipline progress
    return reviews.map(r => {
      const commentsCount = commentCounts.get(r.id) || 0;
      const correctionsCount = correctionCounts.get(r.id) || 0;

      // Calculate progress based on status
      let progress = 0;
      if (r.status === 'COMPLETED_APPROVED') {
        progress = 100;
      } else if (r.status === 'COMPLETED_CORRECTIONS_REQUIRED') {
        progress = 80; // Completed but needs corrections
      } else if (r.status === 'IN_PROGRESS') {
        // Estimate based on comments (if any)
        progress = commentsCount > 0 ? 50 : 25;
      } else {
        progress = 0;
      }

      return {
        discipline: r.discipline,
        reviewerName: (r.reviewer as any)?.name || 'Unknown',
        status: r.status,
        startedAt: r.startedAt ? new Date(r.startedAt) : undefined,
        completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
        commentsCount,
        correctionsCount,
        progress,
        estimatedCompletion: this.estimateDisciplineCompletion(r),
      };
    });
  }

  /**
   * Get review dashboard
   */
  async getReviewDashboard(permitId: string): Promise<ReviewDashboard> {
    const overallProgress = await this.getReviewProgress(permitId);
    const disciplineProgress = await this.getDisciplineProgress(permitId);
    const timeline = await this.getReviewTimeline(permitId);

    // Identify blockers
    const blockers: string[] = [];
    if (overallProgress.correctionsRequired > 0) {
      blockers.push(`${overallProgress.correctionsRequired} discipline(s) require corrections`);
    }
    const blockedDisciplines = disciplineProgress.filter(
      d => d.status === 'ASSIGNED' && d.progress === 0
    );
    if (blockedDisciplines.length > 0) {
      blockers.push(`${blockedDisciplines.length} discipline(s) waiting to start`);
    }

    // Next steps
    const nextSteps: string[] = [];
    if (overallProgress.correctionsRequired > 0) {
      nextSteps.push('Address corrections from reviewers');
    }
    const readyDisciplines = disciplineProgress.filter(d => d.status === 'ASSIGNED');
    if (readyDisciplines.length > 0) {
      nextSteps.push(`Start reviews for: ${readyDisciplines.map(d => d.discipline).join(', ')}`);
    }
    if (overallProgress.overallProgress === 100) {
      nextSteps.push('Submit for final approval');
    }

    return {
      permitId,
      overallProgress,
      disciplineProgress,
      timeline,
      blockers,
      nextSteps,
    };
  }

  /**
   * Get review timeline
   */
  async getReviewTimeline(permitId: string): Promise<ReviewTimelineEvent[]> {
    const supabase = createClient();

    const {data: reviews} = await supabase
      .from('PermitReview')
      .select('*')
      .eq('permitId', permitId)
      .order('startedAt', {ascending: true});

    if (!reviews) {
      return [];
    }

    const events: ReviewTimelineEvent[] = [];

    reviews.forEach(r => {
      if (r.startedAt) {
        events.push({
          date: new Date(r.startedAt),
          type: 'STARTED',
          discipline: r.discipline,
          description: `${r.discipline} review started`,
        });
      }

      if (r.completedAt) {
        if (r.status === 'COMPLETED_CORRECTIONS_REQUIRED') {
          events.push({
            date: new Date(r.completedAt),
            type: 'CORRECTIONS_REQUIRED',
            discipline: r.discipline,
            description: `${r.discipline} review completed - corrections required`,
          });
        } else {
          events.push({
            date: new Date(r.completedAt),
            type: 'COMPLETED',
            discipline: r.discipline,
            description: `${r.discipline} review completed`,
          });
        }
      }
    });

    // Sort by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    return events;
  }

  /**
   * Estimate completion date
   */
  private estimateCompletionDate(coordination: any): Date | undefined {
    const inProgress = coordination.disciplines.filter(
      d => d.status === 'IN_PROGRESS'
    );

    if (inProgress.length === 0) {
      return undefined;
    }

    // Average 5 business days per review
    const avgDays = 5;
    const maxDays = Math.max(...inProgress.map((d: any) => {
      const started = new Date(d.startedAt);
      const daysSinceStart = Math.floor(
        (Date.now() - started.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(0, avgDays - daysSinceStart);
    }));

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + maxDays);

    return completionDate;
  }

  /**
   * Check if review is on track
   */
  private isOnTrack(coordination: any): boolean {
    // Check if any review is overdue
    const overdue = coordination.disciplines.some((d: any) => {
      if (d.status === 'IN_PROGRESS' && d.startedAt) {
        const daysSinceStart = Math.floor(
          (Date.now() - new Date(d.startedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceStart > 10; // More than 10 days
      }
      return false;
    });

    return !overdue;
  }

  /**
   * Estimate discipline completion
   */
  private estimateDisciplineCompletion(review: any): Date | undefined {
    if (review.status === 'COMPLETED_APPROVED' || review.status === 'COMPLETED_CORRECTIONS_REQUIRED') {
      return review.completedAt ? new Date(review.completedAt) : undefined;
    }

    if (review.status === 'IN_PROGRESS' && review.startedAt) {
      const started = new Date(review.startedAt);
      const estimated = new Date(started);
      estimated.setDate(estimated.getDate() + 5); // 5 business days
      return estimated;
    }

    return undefined;
  }
}

// Singleton instance
export const reviewProgressTrackingService = new ReviewProgressTrackingService();

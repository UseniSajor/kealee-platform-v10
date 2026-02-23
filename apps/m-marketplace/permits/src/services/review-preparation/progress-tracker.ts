/**
 * Progress Tracker Service
 * Review progress tracking and completion estimates
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface ReviewProgress {
  reviewId: string;
  permitId: string;
  discipline: string;
  reviewerId: string;
  status: string;
  progress: number; // 0-100
  completedItems: number;
  totalItems: number;
  estimatedCompletion: Date;
  actualCompletion?: Date;
  timeSpent: number; // minutes
  estimatedTimeRemaining: number; // minutes
}

export interface PermitReviewProgress {
  permitId: string;
  overallProgress: number;
  disciplines: ReviewProgress[];
  estimatedCompletion: Date;
  onTrack: boolean;
}

export class ProgressTrackerService {
  /**
   * Track review progress
   */
  async trackProgress(reviewId: string): Promise<ReviewProgress> {
    const supabase = createClient();

    // Get review
    const {data: review} = await supabase
      .from('PermitReview')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (!review) {
      throw new Error('Review not found');
    }

    // Get checklist items
    const {data: checklistItems} = await supabase
      .from('ReviewChecklistItem')
      .select('*')
      .eq('reviewId', reviewId);

    const completedItems = checklistItems?.filter(i => i.checked).length || 0;
    const totalItems = checklistItems?.length || 0;

    // Get comments
    const {data: comments} = await supabase
      .from('ReviewComment')
      .select('*')
      .eq('reviewId', reviewId);

    // Calculate progress
    const progress = this.calculateProgress(
      review.status,
      completedItems,
      totalItems,
      comments?.length || 0
    );

    // Calculate time spent
    const timeSpent = this.calculateTimeSpent(review.startedAt, review.completedAt);

    // Estimate completion
    const estimatedCompletion = this.estimateCompletion(
      review.startedAt,
      review.dueDate,
      progress,
      timeSpent
    );

    // Estimate time remaining
    const estimatedTimeRemaining = this.estimateTimeRemaining(
      progress,
      timeSpent,
      totalItems,
      completedItems
    );

    return {
      reviewId: review.id,
      permitId: review.permitId,
      discipline: review.discipline,
      reviewerId: review.reviewerId,
      status: review.status,
      progress,
      completedItems,
      totalItems,
      estimatedCompletion,
      actualCompletion: review.completedAt ? new Date(review.completedAt) : undefined,
      timeSpent,
      estimatedTimeRemaining,
    };
  }

  /**
   * Track permit review progress (all disciplines)
   */
  async trackPermitProgress(permitId: string): Promise<PermitReviewProgress> {
    const supabase = createClient();

    // Get all reviews for permit
    const {data: reviews} = await supabase
      .from('PermitReview')
      .select('id')
      .eq('permitId', permitId);

    if (!reviews || reviews.length === 0) {
      return {
        permitId,
        overallProgress: 0,
        disciplines: [],
        estimatedCompletion: new Date(),
        onTrack: true,
      };
    }

    // Track progress for each review
    const disciplineProgresses = await Promise.all(
      reviews.map(r => this.trackProgress(r.id))
    );

    // Calculate overall progress
    const overallProgress =
      disciplineProgresses.reduce((sum, p) => sum + p.progress, 0) /
      disciplineProgresses.length;

    // Get latest estimated completion
    const estimatedCompletions = disciplineProgresses
      .map(p => p.estimatedCompletion)
      .filter(d => d > new Date());
    const estimatedCompletion =
      estimatedCompletions.length > 0
        ? new Date(Math.max(...estimatedCompletions.map(d => d.getTime())))
        : new Date();

    // Check if on track
    const onTrack = disciplineProgresses.every(p => {
      if (!p.estimatedCompletion) return true;
      const daysUntilDue = Math.ceil(
        (p.estimatedCompletion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilDue >= 0;
    });

    return {
      permitId,
      overallProgress,
      disciplines: disciplineProgresses,
      estimatedCompletion,
      onTrack,
    };
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(
    status: string,
    completedItems: number,
    totalItems: number,
    commentCount: number
  ): number {
    // Base progress from status
    let progress = 0;
    switch (status) {
      case 'ASSIGNED':
        progress = 10;
        break;
      case 'IN_PROGRESS':
        progress = 30;
        break;
      case 'COMPLETED_APPROVED':
      case 'COMPLETED_CORRECTIONS_REQUIRED':
        progress = 100;
        break;
    }

    // Add progress from checklist completion
    if (totalItems > 0) {
      const checklistProgress = (completedItems / totalItems) * 50;
      progress += checklistProgress;
    }

    // Add progress from comments (indicates active review)
    if (commentCount > 0) {
      progress += Math.min(20, commentCount * 2);
    }

    return Math.min(100, Math.round(progress));
  }

  /**
   * Calculate time spent
   */
  private calculateTimeSpent(startedAt: string, completedAt?: string): number {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60)); // minutes
  }

  /**
   * Estimate completion date
   */
  private estimateCompletion(
    startedAt: string,
    dueDate?: string,
    progress: number = 0,
    timeSpent: number = 0
  ): Date {
    if (dueDate) {
      return new Date(dueDate);
    }

    // Estimate based on progress and time spent
    if (progress > 0 && timeSpent > 0) {
      const estimatedTotalTime = (timeSpent / progress) * 100;
      const remainingTime = estimatedTotalTime - timeSpent;
      const completionDate = new Date();
      completionDate.setMinutes(completionDate.getMinutes() + remainingTime);
      return completionDate;
    }

    // Default: 10 business days from start
    const start = new Date(startedAt);
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
   * Estimate time remaining
   */
  private estimateTimeRemaining(
    progress: number,
    timeSpent: number,
    totalItems: number,
    completedItems: number
  ): number {
    if (progress >= 100) {
      return 0;
    }

    if (progress > 0 && timeSpent > 0) {
      const estimatedTotalTime = (timeSpent / progress) * 100;
      return Math.round(estimatedTotalTime - timeSpent);
    }

    // Estimate based on remaining checklist items
    if (totalItems > 0 && completedItems > 0) {
      const avgTimePerItem = timeSpent / completedItems;
      const remainingItems = totalItems - completedItems;
      return Math.round(remainingItems * avgTimePerItem);
    }

    // Default estimate: 4 hours
    return 240;
  }

  /**
   * Get progress history
   */
  async getProgressHistory(reviewId: string): Promise<Array<{
    date: Date;
    progress: number;
    status: string;
  }>> {
    const supabase = createClient();

    // In production, would track progress snapshots
    // For now, return current progress
    const progress = await this.trackProgress(reviewId);

    return [
      {
        date: new Date(),
        progress: progress.progress,
        status: progress.status,
      },
    ];
  }
}

// Singleton instance
export const progressTrackerService = new ProgressTrackerService();

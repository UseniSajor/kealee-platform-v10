/**
 * Comment Consolidation and Conflict Resolution Service
 * Consolidates comments from multiple disciplines and resolves conflicts
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface ReviewComment {
  id: string;
  reviewId: string;
  discipline: string;
  pageNumber?: number;
  coordinateX?: number;
  coordinateY?: number;
  comment: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  codeReference?: string;
  createdBy: string;
  createdAt: Date;
  response?: string;
  resolved: boolean;
}

export interface CommentConflict {
  id: string;
  type: 'DUPLICATE' | 'CONTRADICTORY' | 'OVERLAPPING';
  comments: ReviewComment[];
  resolution?: CommentResolution;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface CommentResolution {
  action: 'MERGE' | 'KEEP_ALL' | 'KEEP_ONE' | 'CLARIFY';
  mergedComment?: ReviewComment;
  keptCommentIds?: string[];
  clarification?: string;
}

export class CommentConsolidationService {
  /**
   * Get all comments for permit across all disciplines
   */
  async getPermitComments(permitId: string): Promise<ReviewComment[]> {
    const supabase = createClient();

    // Get all reviews for permit
    const {data: reviews} = await supabase
      .from('PermitReview')
      .select('id, discipline')
      .eq('permitId', permitId);

    if (!reviews || reviews.length === 0) {
      return [];
    }

    const reviewIds = reviews.map(r => r.id);

    // Get all comments
    const {data: comments} = await supabase
      .from('ReviewComment')
      .select('*')
      .in('reviewId', reviewIds)
      .order('createdAt', {ascending: true});

    if (!comments) {
      return [];
    }

    // Map comments with discipline
    const reviewMap = new Map(reviews.map(r => [r.id, r.discipline]));
    return comments.map(c => ({
      id: c.id,
      reviewId: c.reviewId,
      discipline: reviewMap.get(c.reviewId) || 'UNKNOWN',
      pageNumber: c.pageNumber,
      coordinateX: c.coordinateX,
      coordinateY: c.coordinateY,
      comment: c.comment,
      severity: c.severity,
      codeReference: c.codeReference,
      createdBy: c.createdBy,
      createdAt: new Date(c.createdAt),
      response: c.response,
      resolved: c.resolved || false,
    }));
  }

  /**
   * Detect conflicts in comments
   */
  async detectConflicts(permitId: string): Promise<CommentConflict[]> {
    const comments = await this.getPermitComments(permitId);
    const conflicts: CommentConflict[] = [];

    // Detect duplicates (same location, similar text)
    const duplicates = this.findDuplicates(comments);
    duplicates.forEach(group => {
      conflicts.push({
        id: `conflict-dup-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: 'DUPLICATE',
        comments: group,
      });
    });

    // Detect contradictory comments (same location, opposite meaning)
    const contradictory = this.findContradictory(comments);
    contradictory.forEach(group => {
      conflicts.push({
        id: `conflict-contra-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: 'CONTRADICTORY',
        comments: group,
      });
    });

    // Detect overlapping comments (same area, different disciplines)
    const overlapping = this.findOverlapping(comments);
    overlapping.forEach(group => {
      conflicts.push({
        id: `conflict-overlap-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: 'OVERLAPPING',
        comments: group,
      });
    });

    return conflicts;
  }

  /**
   * Find duplicate comments
   */
  private findDuplicates(comments: ReviewComment[]): ReviewComment[][] {
    const duplicates: ReviewComment[][] = [];
    const processed = new Set<string>();

    for (let i = 0; i < comments.length; i++) {
      if (processed.has(comments[i].id)) continue;

      const group: ReviewComment[] = [comments[i]];
      for (let j = i + 1; j < comments.length; j++) {
        if (this.isDuplicate(comments[i], comments[j])) {
          group.push(comments[j]);
          processed.add(comments[j].id);
        }
      }

      if (group.length > 1) {
        duplicates.push(group);
        processed.add(comments[i].id);
      }
    }

    return duplicates;
  }

  /**
   * Check if two comments are duplicates
   */
  private isDuplicate(c1: ReviewComment, c2: ReviewComment): boolean {
    // Same page and similar location
    if (c1.pageNumber && c2.pageNumber && c1.pageNumber === c2.pageNumber) {
      if (c1.coordinateX && c2.coordinateX && c1.coordinateY && c2.coordinateY) {
        const distance = Math.sqrt(
          Math.pow(c1.coordinateX - c2.coordinateX, 2) +
          Math.pow(c1.coordinateY - c2.coordinateY, 2)
        );
        if (distance < 50) { // Within 50 pixels
          // Similar text
          const similarity = this.textSimilarity(c1.comment, c2.comment);
          return similarity > 0.7;
        }
      }
    }

    return false;
  }

  /**
   * Find contradictory comments
   */
  private findContradictory(comments: ReviewComment[]): ReviewComment[][] {
    const contradictory: ReviewComment[][] = [];

    for (let i = 0; i < comments.length; i++) {
      for (let j = i + 1; j < comments.length; j++) {
        if (this.isContradictory(comments[i], comments[j])) {
          contradictory.push([comments[i], comments[j]]);
        }
      }
    }

    return contradictory;
  }

  /**
   * Check if two comments are contradictory
   */
  private isContradictory(c1: ReviewComment, c2: ReviewComment): boolean {
    // Same location
    if (
      c1.pageNumber === c2.pageNumber &&
      c1.coordinateX &&
      c2.coordinateX &&
      c1.coordinateY &&
      c2.coordinateY
    ) {
      const distance = Math.sqrt(
        Math.pow(c1.coordinateX - c2.coordinateX, 2) +
        Math.pow(c1.coordinateY - c2.coordinateY, 2)
      );
      if (distance < 50) {
        // Check for contradictory keywords
        const c1Text = c1.comment.toLowerCase();
        const c2Text = c2.comment.toLowerCase();

        const contradictions = [
          ['insufficient', 'adequate'],
          ['required', 'not required'],
          ['approved', 'rejected'],
          ['pass', 'fail'],
          ['correct', 'incorrect'],
        ];

        return contradictions.some(([word1, word2]) => 
          (c1Text.includes(word1) && c2Text.includes(word2)) ||
          (c1Text.includes(word2) && c2Text.includes(word1))
        );
      }
    }

    return false;
  }

  /**
   * Find overlapping comments
   */
  private findOverlapping(comments: ReviewComment[]): ReviewComment[][] {
    const overlapping: ReviewComment[][] = [];
    const processed = new Set<string>();

    for (let i = 0; i < comments.length; i++) {
      if (processed.has(comments[i].id)) continue;

      const group: ReviewComment[] = [comments[i]];
      for (let j = i + 1; j < comments.length; j++) {
        if (this.isOverlapping(comments[i], comments[j])) {
          group.push(comments[j]);
          processed.add(comments[j].id);
        }
      }

      if (group.length > 1) {
        overlapping.push(group);
        processed.add(comments[i].id);
      }
    }

    return overlapping;
  }

  /**
   * Check if two comments overlap
   */
  private isOverlapping(c1: ReviewComment, c2: ReviewComment): boolean {
    // Same page and nearby location, different disciplines
    if (
      c1.pageNumber === c2.pageNumber &&
      c1.discipline !== c2.discipline &&
      c1.coordinateX &&
      c2.coordinateX &&
      c1.coordinateY &&
      c2.coordinateY
    ) {
      const distance = Math.sqrt(
        Math.pow(c1.coordinateX - c2.coordinateX, 2) +
        Math.pow(c1.coordinateY - c2.coordinateY, 2)
      );
      return distance < 100; // Within 100 pixels
    }

    return false;
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: CommentResolution,
    resolvedBy: string
  ): Promise<void> {
    const supabase = createClient();

    // Store resolution
    await supabase.from('CommentConflict').insert({
      id: conflictId,
      resolution: resolution,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
    });

    // Apply resolution
    if (resolution.action === 'MERGE' && resolution.mergedComment) {
      // Create merged comment
      await supabase.from('ReviewComment').insert({
        ...resolution.mergedComment,
        id: `merged-${Date.now()}`,
        createdAt: new Date().toISOString(),
      });

      // Mark original comments as resolved
      const commentIds = resolution.comments?.map(c => c.id) || [];
      await supabase
        .from('ReviewComment')
        .update({resolved: true, response: 'Merged into consolidated comment'})
        .in('id', commentIds);
    } else if (resolution.action === 'KEEP_ONE' && resolution.keptCommentIds) {
      // Mark others as resolved
      const allIds = resolution.comments?.map(c => c.id) || [];
      const toResolve = allIds.filter(id => !resolution.keptCommentIds?.includes(id));
      
      await supabase
        .from('ReviewComment')
        .update({resolved: true, response: 'Resolved - keeping other comment'})
        .in('id', toResolve);
    }
  }

  /**
   * Calculate text similarity (simple Jaccard similarity)
   */
  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Generate consolidated comment list
   */
  async generateConsolidatedList(permitId: string): Promise<ReviewComment[]> {
    const comments = await this.getPermitComments(permitId);
    const conflicts = await this.detectConflicts(permitId);

    // Filter out resolved conflicts
    const resolvedConflictCommentIds = new Set<string>();
    conflicts.forEach(conflict => {
      if (conflict.resolution) {
        if (conflict.resolution.action === 'KEEP_ONE' && conflict.resolution.keptCommentIds) {
          conflict.comments.forEach(c => {
            if (!conflict.resolution!.keptCommentIds!.includes(c.id)) {
              resolvedConflictCommentIds.add(c.id);
            }
          });
        } else if (conflict.resolution?.action === 'MERGE') {
          conflict.comments.forEach(c => resolvedConflictCommentIds.add(c.id));
        }
      }
    });

    // Return active comments (not resolved)
    return comments.filter(c => !c.resolved && !resolvedConflictCommentIds.has(c.id));
  }
}

// Singleton instance
export const commentConsolidationService = new CommentConsolidationService();

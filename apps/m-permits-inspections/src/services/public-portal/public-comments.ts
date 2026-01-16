/**
 * Public Comments Service
 * Comment submission for public projects
 */

import {createClient} from '@/lib/supabase/client';

export interface PublicComment {
  id: string;
  permitId: string;
  permitNumber: string;
  authorName: string;
  authorEmail: string;
  authorPhone?: string;
  comment: string;
  category: 'QUESTION' | 'CONCERN' | 'SUPPORT' | 'GENERAL';
  status: 'PENDING' | 'REVIEWED' | 'REPLIED' | 'RESOLVED';
  response?: string;
  respondedBy?: string;
  respondedAt?: Date;
  submittedAt: Date;
  isPublic: boolean; // Whether comment can be shown publicly
}

export interface PublicCommentSubmission {
  permitId: string;
  authorName: string;
  authorEmail: string;
  authorPhone?: string;
  comment: string;
  category: 'QUESTION' | 'CONCERN' | 'SUPPORT' | 'GENERAL';
  isPublic: boolean;
}

export class PublicCommentsService {
  /**
   * Submit public comment
   */
  async submitPublicComment(
    submission: PublicCommentSubmission
  ): Promise<PublicComment> {
    const supabase = createClient();

    // Get permit details
    const {data: permit} = await supabase
      .from('Permit')
      .select('permitNumber')
      .eq('id', submission.permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    // Create comment
    const {data: comment} = await supabase
      .from('PublicComment')
      .insert({
        permitId: submission.permitId,
        authorName: submission.authorName,
        authorEmail: submission.authorEmail,
        authorPhone: submission.authorPhone,
        comment: submission.comment,
        category: submission.category,
        status: 'PENDING',
        isPublic: submission.isPublic,
        submittedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (!comment) {
      throw new Error('Failed to create comment');
    }

    // Notify jurisdiction staff (would be handled by notification service)
    await this.notifyJurisdiction(submission.permitId, comment.id);

    return {
      id: comment.id,
      permitId: comment.permitId,
      permitNumber: permit.permitNumber,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      authorPhone: comment.authorPhone || undefined,
      comment: comment.comment,
      category: comment.category,
      status: comment.status,
      response: comment.response || undefined,
      respondedBy: comment.respondedBy || undefined,
      respondedAt: comment.respondedAt ? new Date(comment.respondedAt) : undefined,
      submittedAt: new Date(comment.submittedAt),
      isPublic: comment.isPublic || false,
    };
  }

  /**
   * Get public comments for permit
   */
  async getPublicComments(permitId: string): Promise<PublicComment[]> {
    const supabase = createClient();

    // Get permit details
    const {data: permit} = await supabase
      .from('Permit')
      .select('permitNumber')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    // Get public comments only
    const {data: comments} = await supabase
      .from('PublicComment')
      .select('*')
      .eq('permitId', permitId)
      .eq('isPublic', true)
      .order('submittedAt', {ascending: false});

    if (!comments) {
      return [];
    }

    return comments.map(comment => ({
      id: comment.id,
      permitId: comment.permitId,
      permitNumber: permit.permitNumber,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      authorPhone: comment.authorPhone || undefined,
      comment: comment.comment,
      category: comment.category,
      status: comment.status,
      response: comment.response || undefined,
      respondedBy: comment.respondedBy || undefined,
      respondedAt: comment.respondedAt ? new Date(comment.respondedAt) : undefined,
      submittedAt: new Date(comment.submittedAt),
      isPublic: comment.isPublic || false,
    }));
  }

  /**
   * Reply to public comment (jurisdiction staff only)
   */
  async replyToComment(
    commentId: string,
    response: string,
    respondedBy: string
  ): Promise<void> {
    const supabase = createClient();

    await supabase
      .from('PublicComment')
      .update({
        response,
        respondedBy,
        respondedAt: new Date().toISOString(),
        status: 'REPLIED',
      })
      .eq('id', commentId);

    // Notify comment author (would be handled by notification service)
  }

  /**
   * Notify jurisdiction staff of new comment
   */
  private async notifyJurisdiction(permitId: string, commentId: string): Promise<void> {
    // In production, would send notification to jurisdiction staff
    console.log(`New public comment ${commentId} for permit ${permitId}`);
  }
}

// Singleton instance
export const publicCommentsService = new PublicCommentsService();

/**
 * Project Status Sync Service
 * Automatic project status updates based on permit phases
 */

import {createClient} from '@/lib/supabase/client';

export interface ProjectStatusUpdate {
  projectId: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  permitId?: string;
  permitStatus?: string;
}

export class ProjectStatusSyncService {
  /**
   * Sync project status based on permit status
   */
  async syncProjectStatus(permitId: string): Promise<ProjectStatusUpdate | null> {
    const supabase = createClient();

    // Get permit
    const {data: permit} = await supabase
      .from('Permit')
      .select('id, status, projectId')
      .eq('id', permitId)
      .single();

    if (!permit || !permit.projectId) {
      return null;
    }

    // Get current project status (would come from Project Owner module)
    // For now, determine new status based on permit status
    const newStatus = this.mapPermitStatusToProjectStatus(permit.status);

    if (!newStatus) {
      return null;
    }

    // In production, would call Project Owner module API to update status
    // For now, log the update
    console.log(
      `Project ${permit.projectId} status should be updated to ${newStatus} based on permit ${permit.id} status ${permit.status}`
    );

    return {
      projectId: permit.projectId,
      oldStatus: 'UNKNOWN', // Would get from Project Owner module
      newStatus,
      reason: `Permit ${permit.id} status changed to ${permit.status}`,
      permitId: permit.id,
      permitStatus: permit.status,
    };
  }

  /**
   * Map permit status to project status
   */
  private mapPermitStatusToProjectStatus(permitStatus: string): string | null {
    const mapping: Record<string, string> = {
      DRAFT: 'PERMITTING',
      SUBMITTED: 'PERMITTING',
      UNDER_REVIEW: 'PERMITTING',
      CORRECTIONS_REQUIRED: 'PERMITTING',
      RESUBMITTED: 'PERMITTING',
      APPROVED: 'PERMITTING',
      ISSUED: 'CONSTRUCTION',
      ACTIVE: 'CONSTRUCTION',
      INSPECTION_HOLD: 'CONSTRUCTION',
      EXPIRED: 'PERMITTING', // May need permit renewal
      COMPLETED: 'CONSTRUCTION', // Construction complete, but project may continue
      CANCELLED: 'PERMITTING',
    };

    return mapping[permitStatus] || null;
  }

  /**
   * Handle permit status change
   */
  async onPermitStatusChange(
    permitId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    // Sync project status
    await this.syncProjectStatus(permitId);

    // Notify Project Owner module (would be handled by notification service)
    console.log(
      `Permit ${permitId} status changed from ${oldStatus} to ${newStatus}`
    );
  }

  /**
   * Get project status for permit
   */
  async getProjectStatus(permitId: string): Promise<string | null> {
    const supabase = createClient();

    const {data: permit} = await supabase
      .from('Permit')
      .select('status, projectId')
      .eq('id', permitId)
      .single();

    if (!permit) {
      return null;
    }

    return this.mapPermitStatusToProjectStatus(permit.status);
  }
}

// Singleton instance
export const projectStatusSyncService = new ProjectStatusSyncService();

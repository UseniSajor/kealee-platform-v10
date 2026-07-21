/**
 * Milestone Gate Service
 * Block milestone approval in Project Owner if permit expired
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface MilestoneGateCheck {
  milestoneId: string;
  projectId: string;
  permitId?: string;
  canApprove: boolean;
  blocked: boolean;
  blockingReasons: string[];
  warnings: string[];
  requiredActions: string[];
}

export class MilestoneGateService {
  /**
   * Check if milestone can be approved
   */
  async checkMilestoneApproval(
    milestoneId: string,
    projectId: string
  ): Promise<MilestoneGateCheck> {
    const supabase = createClient();

    // Get project permits
    const {data: permits} = await supabase
      .from('Permit')
      .select('id, permitNumber, status, expiresAt, issuedAt')
      .eq('projectId', projectId)
      .in('status', ['ISSUED', 'ACTIVE', 'INSPECTION_HOLD']);

    if (!permits || permits.length === 0) {
      return {
        milestoneId,
        projectId,
        canApprove: false,
        blocked: true,
        blockingReasons: ['No active permits found for project'],
        warnings: [],
        requiredActions: ['Ensure permits are issued before approving milestone'],
      };
    }

    const blockingReasons: string[] = [];
    const warnings: string[] = [];
    const requiredActions: string[] = [];

    // Check each permit
    for (const permit of permits) {
      // Check if permit is expired
      if (permit.expiresAt) {
        const expiresAt = new Date(permit.expiresAt);
        const now = new Date();

        if (expiresAt < now) {
          blockingReasons.push(
            `Permit ${permit.permitNumber} expired on ${expiresAt.toLocaleDateString()}`
          );
          requiredActions.push(
            `Renew or extend permit ${permit.permitNumber} before approving milestone`
          );
        } else {
          // Check if expiring soon (within 30 days)
          const daysUntilExpiration = Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiration <= 30) {
            warnings.push(
              `Permit ${permit.permitNumber} expires in ${daysUntilExpiration} days (${expiresAt.toLocaleDateString()})`
            );
          }
        }
      }

      // Check permit status
      if (permit.status === 'INSPECTION_HOLD') {
        blockingReasons.push(
          `Permit ${permit.permitNumber} is on inspection hold - work cannot proceed`
        );
        requiredActions.push(
          `Resolve inspection issues for permit ${permit.permitNumber}`
        );
      }

      if (permit.status !== 'ISSUED' && permit.status !== 'ACTIVE') {
        blockingReasons.push(
          `Permit ${permit.permitNumber} is not active (status: ${permit.status})`
        );
        requiredActions.push(
          `Ensure permit ${permit.permitNumber} is issued and active`
        );
      }
    }

    const blocked = blockingReasons.length > 0;
    const canApprove = !blocked;

    return {
      milestoneId,
      projectId,
      permitId: permits[0]?.id,
      canApprove,
      blocked,
      blockingReasons,
      warnings,
      requiredActions,
    };
  }

  /**
   * Block milestone approval (called by Project Owner module)
   */
  async blockMilestoneApproval(
    milestoneId: string,
    projectId: string,
    reason: string
  ): Promise<void> {
    // In production, would call Project Owner module API to block milestone
    // For now, log the block
    console.log(
      `Milestone ${milestoneId} blocked for project ${projectId}: ${reason}`
    );
  }

  /**
   * Get permits for project
   */
  async getProjectPermits(projectId: string): Promise<Array<{
    id: string;
    permitNumber: string;
    status: string;
    expiresAt?: Date;
    issuedAt?: Date;
  }>> {
    const supabase = createClient();

    const {data: permits} = await supabase
      .from('Permit')
      .select('id, permitNumber, status, expiresAt, issuedAt')
      .eq('projectId', projectId);

    if (!permits) {
      return [];
    }

    return permits.map(p => ({
      id: p.id,
      permitNumber: p.permitNumber,
      status: p.status,
      expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined,
      issuedAt: p.issuedAt ? new Date(p.issuedAt) : undefined,
    }));
  }
}

// Singleton instance
export const milestoneGateService = new MilestoneGateService();

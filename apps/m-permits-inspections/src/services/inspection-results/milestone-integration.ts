/**
 * Milestone Integration Service
 * Integration with project milestones (block if failed)
 */

import {createClient} from '@/lib/supabase/client';
import {resultsManagerService} from './results-manager';
import {correctionTrackerService} from './correction-tracker';

export interface MilestoneBlock {
  milestoneId: string;
  permitId: string;
  inspectionType: string;
  blocked: boolean;
  reason?: string;
  requiredAction?: string;
}

export interface MilestoneStatus {
  milestoneId: string;
  permitId: string;
  status: 'BLOCKED' | 'UNBLOCKED' | 'PENDING';
  blocks: MilestoneBlock[];
  canProceed: boolean;
  message: string;
}

export class MilestoneIntegrationService {
  /**
   * Check if milestone is blocked by inspection results
   */
  async checkMilestoneBlock(
    milestoneId: string,
    permitId: string
  ): Promise<MilestoneStatus> {
    // In production, would integrate with project owner module
    // For now, check inspection requirements

    // Get permit details
    const supabase = createClient();
    const {data: permit} = await supabase
      .from('Permit')
      .select('type, status')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    // Get inspection results summary
    const summary = await resultsManagerService.getPermitResultsSummary(permitId);

    // Check for blocking inspections
    const blocks: MilestoneBlock[] = [];

    // Critical corrections block milestones
    if (summary.criticalCorrections > 0) {
      blocks.push({
        milestoneId,
        permitId,
        inspectionType: 'ANY',
        blocked: true,
        reason: `${summary.criticalCorrections} critical correction(s) must be resolved`,
        requiredAction: 'Resolve all critical corrections and complete reinspection',
      });
    }

    // Failed inspections block related milestones
    if (summary.failedInspections > 0) {
      const failedResults = summary.results.filter(r => r.result === 'FAIL');
      for (const result of failedResults) {
        blocks.push({
          milestoneId,
          permitId,
          inspectionType: result.type,
          blocked: true,
          reason: `Inspection ${result.type} failed`,
          requiredAction: 'Complete reinspection for failed inspection',
        });
      }
    }

    // Check for required inspections not completed
    const requiredInspections = await this.getRequiredInspectionsForMilestone(
      milestoneId,
      permitId
    );

    const completedRequired = summary.results.filter(
      r => requiredInspections.includes(r.type) && (r.result === 'PASS' || r.result === 'PASS_WITH_COMMENTS')
    );

    const missingRequired = requiredInspections.filter(
      req => !completedRequired.some(comp => comp.type === req)
    );

    for (const missing of missingRequired) {
      blocks.push({
        milestoneId,
        permitId,
        inspectionType: missing,
        blocked: true,
        reason: `Required inspection ${missing} not completed`,
        requiredAction: `Complete and pass ${missing} inspection`,
      });
    }

    const canProceed = blocks.length === 0;
    const status: 'BLOCKED' | 'UNBLOCKED' | 'PENDING' = canProceed
      ? 'UNBLOCKED'
      : blocks.some(b => b.blocked)
      ? 'BLOCKED'
      : 'PENDING';

    const message = canProceed
      ? 'Milestone can proceed - all inspection requirements met'
      : `${blocks.length} blocking issue(s) must be resolved before milestone can proceed`;

    return {
      milestoneId,
      permitId,
      status,
      blocks,
      canProceed,
      message,
    };
  }

  /**
   * Get required inspections for milestone (mock - would come from project owner module)
   */
  private async getRequiredInspectionsForMilestone(
    milestoneId: string,
    permitId: string
  ): Promise<string[]> {
    // In production, would query project owner module for milestone requirements
    // For now, return common requirements based on permit type

    const supabase = createClient();
    const {data: permit} = await supabase
      .from('Permit')
      .select('type')
      .eq('id', permitId)
      .single();

    // Common milestone inspection requirements
    const requirements: Record<string, string[]> = {
      'FOUNDATION_COMPLETE': ['FOOTING', 'FOUNDATION'],
      'FRAMING_COMPLETE': ['FOOTING', 'FOUNDATION', 'SLAB', 'ROUGH_FRAMING'],
      'ROUGH_IN_COMPLETE': ['ROUGH_ELECTRICAL', 'ROUGH_PLUMBING', 'ROUGH_MECHANICAL'],
      'FINAL_INSPECTION': [
        'FINAL_ELECTRICAL',
        'FINAL_PLUMBING',
        'FINAL_MECHANICAL',
        'FINAL_BUILDING',
      ],
      'OCCUPANCY': ['FINAL_CERTIFICATE_OF_OCCUPANCY'],
    };

    return requirements[milestoneId] || [];
  }

  /**
   * Notify project owner of milestone block
   */
  async notifyMilestoneBlock(milestoneId: string, permitId: string): Promise<void> {
    const status = await this.checkMilestoneBlock(milestoneId, permitId);

    if (!status.canProceed) {
      // In production, would send notification to project owner module
      console.log(`Milestone ${milestoneId} blocked for permit ${permitId}:`, status.message);
    }
  }
}

// Singleton instance
export const milestoneIntegrationService = new MilestoneIntegrationService();

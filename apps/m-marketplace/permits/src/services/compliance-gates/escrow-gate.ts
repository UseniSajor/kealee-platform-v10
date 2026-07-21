/**
 * Escrow Gate Service
 * Prevent escrow release in Finance & Trust without passed inspections
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {resultsManagerService} from '@permits/src/services/inspection-results/results-manager';
import {correctionTrackerService} from '@permits/src/services/inspection-results/correction-tracker';

export interface EscrowReleaseGateCheck {
  releaseId: string;
  projectId: string;
  permitId?: string;
  canRelease: boolean;
  blocked: boolean;
  blockingReasons: string[];
  requiredInspections: Array<{
    inspectionType: string;
    status: 'REQUIRED' | 'PENDING' | 'PASSED' | 'FAILED';
    inspectionId?: string;
  }>;
  requiredActions: string[];
}

export class EscrowReleaseGateService {
  /**
   * Check if escrow release can proceed
   */
  async checkEscrowRelease(
    releaseId: string,
    projectId: string,
    milestoneId?: string
  ): Promise<EscrowReleaseGateCheck> {
    const supabase = createClient();

    // Get project permits
    const {data: permits} = await supabase
      .from('Permit')
      .select('id, permitNumber, status')
      .eq('projectId', projectId)
      .in('status', ['ISSUED', 'ACTIVE']);

    if (!permits || permits.length === 0) {
      return {
        releaseId,
        projectId,
        canRelease: false,
        blocked: true,
        blockingReasons: ['No active permits found for project'],
        requiredInspections: [],
        requiredActions: ['Ensure permits are issued before escrow release'],
      };
    }

    const permitId = permits[0].id;

    // Get inspection results summary
    const summary = await resultsManagerService.getPermitResultsSummary(permitId);

    // Get unresolved corrections
    const unresolvedCorrections = await correctionTrackerService.getUnresolvedCorrections(
      permitId
    );

    const blockingReasons: string[] = [];
    const requiredActions: string[] = [];
    const requiredInspections: EscrowReleaseGateCheck['requiredInspections'] = [];

    // Check for critical corrections
    const criticalCorrections = unresolvedCorrections.filter(c => c.severity === 'CRITICAL');
    if (criticalCorrections.length > 0) {
      blockingReasons.push(
        `${criticalCorrections.length} critical correction(s) must be resolved before escrow release`
      );
      requiredActions.push('Resolve all critical inspection corrections');
    }

    // Check for failed inspections
    if (summary.failedInspections > 0) {
      blockingReasons.push(
        `${summary.failedInspections} failed inspection(s) must be passed before escrow release`
      );
      requiredActions.push('Complete and pass all required inspections');
    }

    // Determine required inspections based on milestone
    const milestoneInspections = this.getRequiredInspectionsForMilestone(milestoneId);

    // Check each required inspection
    for (const inspectionType of milestoneInspections) {
      const inspection = summary.results.find(r => r.type === inspectionType);

      if (!inspection) {
        requiredInspections.push({
          inspectionType,
          status: 'REQUIRED',
        });
        blockingReasons.push(
          `Required inspection ${inspectionType} has not been completed`
        );
        requiredActions.push(`Complete ${inspectionType} inspection`);
      } else if (inspection.result === 'FAIL' || inspection.result === 'PARTIAL_PASS') {
        requiredInspections.push({
          inspectionType,
          status: 'FAILED',
          inspectionId: inspection.inspectionId,
        });
        blockingReasons.push(
          `Inspection ${inspectionType} failed - must pass before escrow release`
        );
        requiredActions.push(`Pass ${inspectionType} reinspection`);
      } else if (inspection.result === 'PASS' || inspection.result === 'PASS_WITH_COMMENTS') {
        requiredInspections.push({
          inspectionType,
          status: 'PASSED',
          inspectionId: inspection.inspectionId,
        });
      } else {
        requiredInspections.push({
          inspectionType,
          status: 'PENDING',
          inspectionId: inspection.inspectionId,
        });
        blockingReasons.push(
          `Inspection ${inspectionType} is pending completion`
        );
        requiredActions.push(`Complete ${inspectionType} inspection`);
      }
    }

    // Check if all required inspections passed
    const allPassed = requiredInspections.every(i => i.status === 'PASSED');
    const blocked = blockingReasons.length > 0 || !allPassed;
    const canRelease = !blocked;

    return {
      releaseId,
      projectId,
      permitId,
      canRelease,
      blocked,
      blockingReasons,
      requiredInspections,
      requiredActions,
    };
  }

  /**
   * Get required inspections for milestone
   */
  private getRequiredInspectionsForMilestone(milestoneId?: string): string[] {
    // In production, would query Project Owner module for milestone requirements
    // For now, return common requirements based on milestone type

    const requirements: Record<string, string[]> = {
      'FOUNDATION_COMPLETE': ['FOOTING', 'FOUNDATION'],
      'FRAMING_COMPLETE': ['ROUGH_FRAMING'],
      'ROUGH_IN_COMPLETE': ['ROUGH_ELECTRICAL', 'ROUGH_PLUMBING', 'ROUGH_MECHANICAL'],
      'FINAL_INSPECTION': [
        'FINAL_ELECTRICAL',
        'FINAL_PLUMBING',
        'FINAL_MECHANICAL',
        'FINAL_BUILDING',
      ],
      'OCCUPANCY': ['FINAL_CERTIFICATE_OF_OCCUPANCY'],
    };

    return requirements[milestoneId || ''] || [];
  }

  /**
   * Block escrow release (called by Finance & Trust module)
   */
  async blockEscrowRelease(
    releaseId: string,
    projectId: string,
    reason: string
  ): Promise<void> {
    // In production, would call Finance & Trust module API to block release
    console.log(
      `Escrow release ${releaseId} blocked for project ${projectId}: ${reason}`
    );
  }
}

// Singleton instance
export const escrowReleaseGateService = new EscrowReleaseGateService();

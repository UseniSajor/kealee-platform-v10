/**
 * Reinspection Automation Service
 * Reinspection scheduling automation
 */

import {createClient} from '@/lib/supabase/client';
import {smartSchedulerService} from '@/services/inspection-scheduling/smart-scheduler';
import {inspectionSequencingService} from '@/services/inspection-scheduling/inspection-sequencing';
import {correctionTrackerService} from './correction-tracker';
import {resultsManagerService} from './results-manager';

export interface ReinspectionRequest {
  parentInspectionId: string;
  permitId: string;
  inspectionType: string;
  requestedBy: string;
  reason: string; // 'CORRECTIONS_COMPLETED' | 'PARTIAL_PASS' | 'MANUAL'
  correctionsResolved: string[]; // Correction IDs
}

export interface ReinspectionScheduleResult {
  reinspectionId: string;
  parentInspectionId: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  inspectorId?: string;
  status: 'PENDING_SCHEDULING' | 'SCHEDULED' | 'ERROR';
  error?: string;
}

export class ReinspectionAutomationService {
  /**
   * Create reinspection request
   */
  async createReinspectionRequest(
    request: ReinspectionRequest
  ): Promise<ReinspectionScheduleResult> {
    const supabase = createClient();

    // Get parent inspection
    const {data: parentInspection} = await supabase
      .from('Inspection')
      .select('*, permit:Permit(jurisdictionId)')
      .eq('id', request.parentInspectionId)
      .single();

    if (!parentInspection) {
      throw new Error('Parent inspection not found');
    }

    // Verify corrections are resolved
    const unresolved = await correctionTrackerService.getUnresolvedCorrections(
      request.permitId
    );

    const blockingCorrections = unresolved.filter(
      c => request.correctionsResolved.includes(c.id) && !c.resolved
    );

    if (blockingCorrections.length > 0) {
      return {
        reinspectionId: '',
        parentInspectionId: request.parentInspectionId,
        status: 'ERROR',
        error: `Some corrections are not yet resolved: ${blockingCorrections.map(c => c.id).join(', ')}`,
      };
    }

    // Generate inspection number
    const inspectionNumber = await this.generateInspectionNumber(
      parentInspection.permit.jurisdictionId
    );

    // Create reinspection
    const {data: reinspection} = await supabase
      .from('Inspection')
      .insert({
        permitId: request.permitId,
        jurisdictionId: parentInspection.permit.jurisdictionId,
        type: request.inspectionType,
        inspectionNumber,
        requestedBy: request.requestedBy,
        requestedAt: new Date().toISOString(),
        parentInspectionId: request.parentInspectionId,
        status: 'REQUESTED',
        description: `Reinspection: ${request.reason}`,
      })
      .select()
      .single();

    if (!reinspection) {
      throw new Error('Failed to create reinspection');
    }

    // Attempt automatic scheduling
    try {
      const scheduled = await this.autoScheduleReinspection(
        reinspection.id,
        request.permitId,
        request.inspectionType
      );

      return {
        reinspectionId: reinspection.id,
        parentInspectionId: request.parentInspectionId,
        scheduledDate: scheduled.scheduledDate,
        scheduledTime: scheduled.scheduledTime,
        inspectorId: scheduled.inspectorId,
        status: scheduled.scheduledDate ? 'SCHEDULED' : 'PENDING_SCHEDULING',
      };
    } catch (error: any) {
      return {
        reinspectionId: reinspection.id,
        parentInspectionId: request.parentInspectionId,
        status: 'PENDING_SCHEDULING',
        error: error.message,
      };
    }
  }

  /**
   * Automatically schedule reinspection
   */
  private async autoScheduleReinspection(
    inspectionId: string,
    permitId: string,
    inspectionType: string
  ): Promise<{
    scheduledDate?: Date;
    scheduledTime?: string;
    inspectorId?: string;
  }> {
    // Get permit location
    const supabase = createClient();
    const {data: permit} = await supabase
      .from('Permit')
      .select('location')
      .eq('id', permitId)
      .single();

    if (!permit?.location) {
      throw new Error('Permit location not found');
    }

    // Find available inspector
    const availableInspector = await smartSchedulerService.findAvailableInspector(
      {
        permitId,
        inspectionType,
        priority: 'HIGH', // Reinspections are priority
        location: permit.location,
        requestedDate: new Date(),
      },
      {
        earliestDate: new Date(),
        latestDate: this.addDays(new Date(), 14), // Within 2 weeks
      }
    );

    if (!availableInspector || availableInspector.availableSlots.length === 0) {
      throw new Error('No available inspectors found for reinspection');
    }

    // Schedule first available slot
    const firstSlot = availableInspector.availableSlots[0];
    await smartSchedulerService.scheduleInspection(
      inspectionId,
      availableInspector.inspectorId,
      firstSlot.date,
      firstSlot.timeSlot
    );

    return {
      scheduledDate: firstSlot.date,
      scheduledTime: firstSlot.timeSlot,
      inspectorId: availableInspector.inspectorId,
    };
  }

  /**
   * Check if reinspection can be requested
   */
  async canRequestReinspection(
    inspectionId: string,
    permitId: string
  ): Promise<{
    canRequest: boolean;
    reason?: string;
    blockingCorrections?: string[];
  }> {
    // Get inspection result
    const result = await resultsManagerService.getInspectionResult(inspectionId);

    // Check if inspection failed or partial pass
    if (result.result !== 'FAIL' && result.result !== 'PARTIAL_PASS') {
      return {
        canRequest: false,
        reason: `Inspection ${result.result}. Reinspection only available for FAIL or PARTIAL_PASS.`,
      };
    }

    // Check for unresolved corrections
    const unresolved = await correctionTrackerService.getUnresolvedCorrections(permitId);
    const criticalUnresolved = unresolved.filter(
      c => c.severity === 'CRITICAL' || c.mustFixBefore
    );

    if (criticalUnresolved.length > 0) {
      return {
        canRequest: false,
        reason: 'Critical corrections must be resolved before reinspection',
        blockingCorrections: criticalUnresolved.map(c => c.id),
      };
    }

    return {
      canRequest: true,
    };
  }

  /**
   * Generate inspection number
   */
  private async generateInspectionNumber(jurisdictionId: string): Promise<string> {
    const supabase = createClient();

    // Get jurisdiction code
    const {data: jurisdiction} = await supabase
      .from('Jurisdiction')
      .select('code')
      .eq('id', jurisdictionId)
      .single();

    const code = jurisdiction?.code || 'JUR';

    // Get current year
    const year = new Date().getFullYear();

    // Get count of inspections this year
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('inspectionNumber')
      .eq('jurisdictionId', jurisdictionId)
      .like('inspectionNumber', `${code}-${year}-%`);

    const count = (inspections?.length || 0) + 1;
    const number = String(count).padStart(5, '0');

    return `${code}-${year}-${number}`;
  }

  /**
   * Add days to date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

// Singleton instance
export const reinspectionAutomationService = new ReinspectionAutomationService();

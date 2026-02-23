/**
 * Priority Scheduling Service
 * Priority scheduling for inspections on expedited permits
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {smartSchedulerService} from '@permits/src/services/inspection-scheduling/smart-scheduler';

export interface PriorityInspectionSchedule {
  inspectionId: string;
  permitId: string;
  priority: 'HIGH' | 'URGENT';
  scheduledDate: Date;
  scheduledTime: string;
  inspectorId: string;
  estimatedDuration: number;
  expeditedPermit: boolean;
}

export class PrioritySchedulingService {
  /**
   * Schedule inspection with priority for expedited permit
   */
  async schedulePriorityInspection(
    inspectionId: string,
    permitId: string,
    inspectionType: string,
    location: {latitude: number; longitude: number}
  ): Promise<PriorityInspectionSchedule> {
    const supabase = createClient();

    // Check if permit is expedited
    const {data: permit} = await supabase
      .from('Permit')
      .select('expedited')
      .eq('id', permitId)
      .single();

    const isExpedited = permit?.expedited || false;
    const priority = isExpedited ? 'URGENT' : 'HIGH';

    // Find available inspector with priority
    const availableInspector = await smartSchedulerService.findAvailableInspector(
      {
        permitId,
        inspectionType,
        priority,
        location,
        requestedDate: new Date(),
      },
      {
        earliestDate: new Date(),
        latestDate: this.addDays(new Date(), 7), // Within 7 days for expedited
        bufferTime: 15, // Shorter buffer for expedited
      }
    );

    if (!availableInspector || availableInspector.availableSlots.length === 0) {
      throw new Error('No available inspectors for priority scheduling');
    }

    // Schedule first available slot (prioritize earlier slots)
    const firstSlot = availableInspector.availableSlots[0];

    await smartSchedulerService.scheduleInspection(
      inspectionId,
      availableInspector.inspectorId,
      firstSlot.date,
      firstSlot.timeSlot
    );

    return {
      inspectionId,
      permitId,
      priority,
      scheduledDate: firstSlot.date,
      scheduledTime: firstSlot.timeSlot,
      inspectorId: availableInspector.inspectorId,
      estimatedDuration: 60, // Default 1 hour
      expeditedPermit: isExpedited,
    };
  }

  /**
   * Reschedule inspection with priority
   */
  async rescheduleWithPriority(
    inspectionId: string,
    newDate: Date,
    newTime: string
  ): Promise<void> {
    const supabase = createClient();

    // Get inspection details
    const {data: inspection} = await supabase
      .from('Inspection')
      .select('permitId, inspectorId')
      .eq('id', inspectionId)
      .single();

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Check if permit is expedited
    const {data: permit} = await supabase
      .from('Permit')
      .select('expedited')
      .eq('id', inspection.permitId)
      .single();

    if (permit?.expedited) {
      // Update with priority flag
      await supabase
        .from('Inspection')
        .update({
          scheduledDate: newDate.toISOString(),
          scheduledTime: newTime,
          priority: 'URGENT',
        })
        .eq('id', inspectionId);
    } else {
      // Standard reschedule
      await supabase
        .from('Inspection')
        .update({
          scheduledDate: newDate.toISOString(),
          scheduledTime: newTime,
        })
        .eq('id', inspectionId);
    }
  }

  /**
   * Get priority inspections queue
   */
  async getPriorityInspectionsQueue(
    inspectorId?: string
  ): Promise<PriorityInspectionSchedule[]> {
    const supabase = createClient();

    let query = supabase
      .from('Inspection')
      .select('*, permit:Permit(expedited)')
      .eq('status', 'SCHEDULED')
      .not('scheduledDate', 'is', null)
      .order('scheduledDate', {ascending: true})
      .order('priority', {ascending: false});

    if (inspectorId) {
      query = query.eq('inspectorId', inspectorId);
    }

    const {data: inspections} = await query;

    if (!inspections) {
      return [];
    }

    return inspections
      .filter(i => i.permit?.expedited || i.priority === 'URGENT' || i.priority === 'HIGH')
      .map(i => ({
        inspectionId: i.id,
        permitId: i.permitId,
        priority: (i.permit?.expedited ? 'URGENT' : i.priority || 'HIGH') as 'HIGH' | 'URGENT',
        scheduledDate: new Date(i.scheduledDate!),
        scheduledTime: i.scheduledTime || '',
        inspectorId: i.inspectorId || '',
        estimatedDuration: 60,
        expeditedPermit: i.permit?.expedited || false,
      }));
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
export const prioritySchedulingService = new PrioritySchedulingService();

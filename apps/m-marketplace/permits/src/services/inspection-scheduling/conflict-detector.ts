import { createServerClient as createClient } from '@permits/src/lib/supabase/server';

/**
 * Conflict types for scheduling
 */
export interface SchedulingConflict {
  type:
    | 'inspector_unavailable'
    | 'inspector_overbooked'
    | 'location_conflict'
    | 'time_conflict'
    | 'weather_conflict';
  severity: 'blocker' | 'warning';
  message: string;
  details?: Record<string, any>;
}

/**
 * Conflict check result
 */
export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: SchedulingConflict[];
  warnings: SchedulingConflict[];
}

/**
 * Conflict Detector Service
 * Detects scheduling conflicts for inspections
 */
class ConflictDetectorService {
  /**
   * Check for scheduling conflicts
   */
  async checkSchedulingConflicts(
    inspectionId: string,
    inspectorId: string,
    scheduledDate: Date,
    scheduledTime: string,
    estimatedDuration: number, // minutes
    location?: any
  ): Promise<ConflictCheckResult> {
    const conflicts: SchedulingConflict[] = [];
    const warnings: SchedulingConflict[] = [];

    try {
      const supabase = createClient();

      // Check if inspector is available that day
      const inspectorAvailability = await this.checkInspectorAvailability(
        inspectorId,
        scheduledDate,
        scheduledTime
      );

      if (!inspectorAvailability.available) {
        conflicts.push({
          type: 'inspector_unavailable',
          severity: 'blocker',
          message: `Inspector is not available on ${scheduledDate.toDateString()}`,
          details: { reason: inspectorAvailability.reason },
        });
      }

      // Check for overlapping inspections
      const overlappingInspections = await this.checkOverlappingInspections(
        inspectorId,
        scheduledDate,
        scheduledTime,
        estimatedDuration
      );

      if (overlappingInspections.length > 0) {
        conflicts.push({
          type: 'time_conflict',
          severity: 'blocker',
          message: `Inspector has ${overlappingInspections.length} conflicting inspection(s)`,
          details: { overlapping: overlappingInspections },
        });
      }

      // Check if inspector's schedule is getting too full
      const dailyInspectionCount = await this.getDailyInspectionCount(
        inspectorId,
        scheduledDate
      );

      if (dailyInspectionCount >= 8) {
        warnings.push({
          type: 'inspector_overbooked',
          severity: 'warning',
          message: `Inspector has ${dailyInspectionCount} inspections scheduled this day`,
          details: { count: dailyInspectionCount, limit: 8 },
        });
      }

      // Check for location conflicts (same location, different permits)
      if (location) {
        const locationConflicts = await this.checkLocationConflicts(
          inspectionId,
          location,
          scheduledDate,
          scheduledTime
        );

        if (locationConflicts.length > 0) {
          warnings.push({
            type: 'location_conflict',
            severity: 'warning',
            message: `${locationConflicts.length} other inspection(s) at same location`,
            details: { conflicts: locationConflicts },
          });
        }
      }

      // Check weather (if outdoor inspection)
      const weatherWarning = await this.checkWeatherConditions(
        scheduledDate,
        location
      );

      if (weatherWarning) {
        warnings.push(weatherWarning);
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        warnings,
      };
    } catch (error) {
      console.error('Conflict detection error:', error);
      // Return empty result on error
      return {
        hasConflicts: false,
        conflicts: [],
        warnings: [],
      };
    }
  }

  /**
   * Check if inspector is available
   */
  private async checkInspectorAvailability(
    inspectorId: string,
    date: Date,
    time: string
  ): Promise<{ available: boolean; reason?: string }> {
    const supabase = createClient();

    // Check for time-off requests
    const { data: timeOff } = await supabase
      .from('InspectorTimeOff')
      .select('*')
      .eq('inspectorId', inspectorId)
      .lte('startDate', date.toISOString())
      .gte('endDate', date.toISOString())
      .eq('approved', true)
      .limit(1);

    if (timeOff && timeOff.length > 0) {
      return { available: false, reason: 'Inspector is on time off' };
    }

    // Check working hours
    const { data: workSchedule } = await supabase
      .from('InspectorWorkSchedule')
      .select('*')
      .eq('inspectorId', inspectorId)
      .eq('dayOfWeek', date.getDay())
      .limit(1)
      .single();

    if (!workSchedule || !workSchedule.isWorkingDay) {
      return { available: false, reason: 'Inspector does not work this day' };
    }

    // Check if time falls within working hours
    const timeValue = this.timeToMinutes(time);
    const startTime = this.timeToMinutes(workSchedule.startTime);
    const endTime = this.timeToMinutes(workSchedule.endTime);

    if (timeValue < startTime || timeValue > endTime) {
      return {
        available: false,
        reason: `Outside working hours (${workSchedule.startTime} - ${workSchedule.endTime})`,
      };
    }

    return { available: true };
  }

  /**
   * Check for overlapping inspections
   */
  private async checkOverlappingInspections(
    inspectorId: string,
    date: Date,
    time: string,
    duration: number
  ): Promise<any[]> {
    const supabase = createClient();

    const startTime = this.timeToMinutes(time);
    const endTime = startTime + duration;

    const { data: inspections } = await supabase
      .from('Inspection')
      .select('*')
      .eq('inspectorId', inspectorId)
      .eq('status', 'scheduled')
      .gte('scheduledDate', date.toISOString().split('T')[0])
      .lt('scheduledDate', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);

    if (!inspections) return [];

    // Check for time overlaps
    return inspections.filter((inspection) => {
      const inspectionStart = this.timeToMinutes(inspection.scheduledTime);
      const inspectionEnd = inspectionStart + (inspection.estimatedDuration || 60);

      // Check if times overlap
      return (
        (startTime >= inspectionStart && startTime < inspectionEnd) ||
        (endTime > inspectionStart && endTime <= inspectionEnd) ||
        (startTime <= inspectionStart && endTime >= inspectionEnd)
      );
    });
  }

  /**
   * Get count of inspections for a day
   */
  private async getDailyInspectionCount(
    inspectorId: string,
    date: Date
  ): Promise<number> {
    const supabase = createClient();

    const { count } = await supabase
      .from('Inspection')
      .select('*', { count: 'exact', head: true })
      .eq('inspectorId', inspectorId)
      .eq('status', 'scheduled')
      .gte('scheduledDate', date.toISOString().split('T')[0])
      .lt('scheduledDate', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);

    return count || 0;
  }

  /**
   * Check for location conflicts
   */
  private async checkLocationConflicts(
    currentInspectionId: string,
    location: any,
    date: Date,
    time: string
  ): Promise<any[]> {
    const supabase = createClient();

    // Find inspections at the same location
    const { data: inspections } = await supabase
      .from('Inspection')
      .select('*, permit:Permit(location)')
      .neq('id', currentInspectionId)
      .eq('status', 'scheduled')
      .gte('scheduledDate', date.toISOString().split('T')[0])
      .lt('scheduledDate', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);

    if (!inspections) return [];

    // Filter by location proximity (within 100 meters or same address)
    return inspections.filter((inspection) => {
      if (!inspection.permit?.location) return false;

      // Simple address matching (in production, use geocoding)
      return (
        inspection.permit.location.address === location.address ||
        inspection.permit.location.parcelNumber === location.parcelNumber
      );
    });
  }

  /**
   * Check weather conditions
   */
  private async checkWeatherConditions(
    date: Date,
    location?: any
  ): Promise<SchedulingConflict | null> {
    // In production, integrate with weather API
    // For now, return null (no weather warning)
    return null;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Export singleton instance
export const conflictDetectorService = new ConflictDetectorService();

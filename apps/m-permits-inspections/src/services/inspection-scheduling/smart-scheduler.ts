/**
 * Smart Scheduling Service
 * Smart scheduling based on inspector availability and location
 */

import {createClient} from '@/lib/supabase/client';

export interface InspectorAvailability {
  inspectorId: string;
  inspectorName: string;
  specialty: string[]; // Inspection types this inspector can do
  zone?: string; // Geographic zone
  location?: {latitude: number; longitude: number};
  schedule: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  available: boolean;
  existingInspections?: string[]; // Inspection IDs already scheduled
}

export interface InspectionRequest {
  permitId: string;
  inspectionType: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  location: {latitude: number; longitude: number};
  requestedDate?: Date;
  preferredTime?: string; // "09:00-12:00"
  specialRequirements?: string[];
}

export interface ScheduledInspection {
  inspectionId: string;
  inspectorId: string;
  scheduledDate: Date;
  scheduledTime: string;
  estimatedDuration: number; // minutes
  travelTime?: number; // minutes
  distance?: number; // miles
}

export interface SchedulingOptions {
  maxTravelDistance?: number; // miles
  preferredInspectorId?: string;
  excludeInspectorIds?: string[];
  earliestDate?: Date;
  latestDate?: Date;
  bufferTime?: number; // minutes between inspections
}

export class SmartSchedulerService {
  /**
   * Find available inspector for inspection
   */
  async findAvailableInspector(
    request: InspectionRequest,
    options: SchedulingOptions = {}
  ): Promise<{
    inspectorId: string;
    inspectorName: string;
    availableSlots: Array<{
      date: Date;
      timeSlot: string;
      estimatedTravelTime: number;
      distance: number;
    }>;
  } | null> {
    const supabase = createClient();

    // Get all inspectors for jurisdiction
    const {data: permit} = await supabase
      .from('Permit')
      .select('jurisdictionId')
      .eq('id', request.permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    // Get inspectors with matching specialty
    const {data: staff} = await supabase
      .from('JurisdictionStaff')
      .select('*, user:User(id, name, email)')
      .eq('jurisdictionId', permit.jurisdictionId)
      .eq('role', 'INSPECTOR')
      .eq('active', true);

    if (!staff || staff.length === 0) {
      return null;
    }

    // Filter by specialty and availability
    const suitableInspectors: Array<{
      inspector: any;
      availability: InspectorAvailability;
      distance: number;
      travelTime: number;
    }> = [];

    for (const staffMember of staff) {
      // Check if excluded
      if (options.excludeInspectorIds?.includes(staffMember.id)) {
        continue;
      }

      // Check if preferred
      if (options.preferredInspectorId && options.preferredInspectorId !== staffMember.id) {
        continue;
      }

      // Check specialty
      const specialties = staffMember.specialties || [];
      if (!specialties.includes(request.inspectionType) && specialties.length > 0) {
        continue;
      }

      // Get inspector location
      const inspectorLocation = staffMember.location || {latitude: 0, longitude: 0};

      // Calculate distance
      const distance = this.calculateDistance(
        request.location,
        inspectorLocation
      );

      // Check max travel distance
      if (options.maxTravelDistance && distance > options.maxTravelDistance) {
        continue;
      }

      // Calculate travel time (estimate: 30 mph average)
      const travelTime = Math.round((distance / 30) * 60); // minutes

      // Get availability
      const availability = await this.getInspectorAvailability(
        staffMember.id,
        options.earliestDate || new Date(),
        options.latestDate || this.addDays(new Date(), 30)
      );

      // Find available slots
      const availableSlots = this.findAvailableSlots(
        availability,
        request,
        options,
        travelTime
      );

      if (availableSlots.length > 0) {
        suitableInspectors.push({
          inspector: staffMember,
          availability,
          distance,
          travelTime,
        });
      }
    }

    // Sort by distance and workload
    suitableInspectors.sort((a, b) => {
      // Prioritize by distance first
      if (Math.abs(a.distance - b.distance) > 0.5) {
        return a.distance - b.distance;
      }
      // Then by current workload
      const aWorkload = a.availability.schedule.filter(s => !s.available).length;
      const bWorkload = b.availability.schedule.filter(s => !s.available).length;
      return aWorkload - bWorkload;
    });

    if (suitableInspectors.length === 0) {
      return null;
    }

    const bestInspector = suitableInspectors[0];
    const availableSlots = this.findAvailableSlots(
      bestInspector.availability,
      request,
      options,
      bestInspector.travelTime
    );

    return {
      inspectorId: bestInspector.inspector.id,
      inspectorName: (bestInspector.inspector.user as any)?.name || 'Unknown',
      availableSlots: availableSlots.map(slot => ({
        date: slot.date,
        timeSlot: `${slot.startTime}-${slot.endTime}`,
        estimatedTravelTime: bestInspector.travelTime,
        distance: bestInspector.distance,
      })),
    };
  }

  /**
   * Schedule inspection
   */
  async scheduleInspection(
    inspectionId: string,
    inspectorId: string,
    scheduledDate: Date,
    scheduledTime: string
  ): Promise<ScheduledInspection> {
    const supabase = createClient();

    // Update inspection
    await supabase
      .from('Inspection')
      .update({
        inspectorId,
        scheduledDate: scheduledDate.toISOString(),
        scheduledTime,
        status: 'SCHEDULED',
      })
      .eq('id', inspectionId);

    // Get inspection for distance calculation
    const {data: inspection} = await supabase
      .from('Inspection')
      .select('*, permit:Permit(location)')
      .eq('id', inspectionId)
      .single();

    // Get inspector location
    const {data: inspector} = await supabase
      .from('JurisdictionStaff')
      .select('location')
      .eq('id', inspectorId)
      .single();

    let travelTime: number | undefined;
    let distance: number | undefined;

    if (inspection?.permit?.location && inspector?.location) {
      distance = this.calculateDistance(
        inspection.permit.location,
        inspector.location
      );
      travelTime = Math.round((distance / 30) * 60); // minutes
    }

    return {
      inspectionId,
      inspectorId,
      scheduledDate,
      scheduledTime,
      estimatedDuration: 60, // Default 1 hour
      travelTime,
      distance,
    };
  }

  /**
   * Get inspector availability
   */
  async getInspectorAvailability(
    inspectorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<InspectorAvailability> {
    const supabase = createClient();

    // Get inspector info
    const {data: inspector} = await supabase
      .from('JurisdictionStaff')
      .select('*, user:User(name)')
      .eq('id', inspectorId)
      .single();

    if (!inspector) {
      throw new Error('Inspector not found');
    }

    // Get existing scheduled inspections
    const {data: scheduledInspections} = await supabase
      .from('Inspection')
      .select('id, scheduledDate, scheduledTime')
      .eq('inspectorId', inspectorId)
      .eq('status', 'SCHEDULED')
      .gte('scheduledDate', startDate.toISOString())
      .lte('scheduledDate', endDate.toISOString());

    // Get working hours (default 9 AM - 5 PM)
    const workingHours = inspector.workingHours || {
      monday: {start: '09:00', end: '17:00'},
      tuesday: {start: '09:00', end: '17:00'},
      wednesday: {start: '09:00', end: '17:00'},
      thursday: {start: '09:00', end: '17:00'},
      friday: {start: '09:00', end: '17:00'},
    };

    // Generate availability slots
    const schedule: AvailabilitySlot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = this.getDayOfWeek(currentDate);
      const dayHours = workingHours[dayOfWeek as keyof typeof workingHours];

      if (dayHours) {
        // Check if there's a scheduled inspection at this time
        const scheduledForDate = scheduledInspections?.filter(
          i => new Date(i.scheduledDate).toDateString() === currentDate.toDateString()
        ) || [];

        // Create time slots
        const slots = this.generateTimeSlots(dayHours.start, dayHours.end, 60); // 1-hour slots

        for (const slot of slots) {
          const isScheduled = scheduledForDate.some(
            i => i.scheduledTime === slot
          );

          schedule.push({
            date: new Date(currentDate),
            startTime: slot.split('-')[0],
            endTime: slot.split('-')[1] || slot.split('-')[0],
            available: !isScheduled,
            existingInspections: isScheduled
              ? scheduledForDate.filter(i => i.scheduledTime === slot).map(i => i.id)
              : undefined,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      inspectorId,
      inspectorName: (inspector.user as any)?.name || 'Unknown',
      specialty: inspector.specialties || [],
      zone: inspector.zone,
      location: inspector.location,
      schedule,
    };
  }

  /**
   * Find available slots in inspector schedule
   */
  private findAvailableSlots(
    availability: InspectorAvailability,
    request: InspectionRequest,
    options: SchedulingOptions,
    travelTime: number
  ): Array<{
    date: Date;
    startTime: string;
    endTime: string;
  }> {
    const buffer = options.bufferTime || 30; // Default 30 minutes between inspections
    const earliestDate = options.earliestDate || new Date();
    const latestDate = options.latestDate || this.addDays(new Date(), 30);

    const availableSlots: Array<{
      date: Date;
      startTime: string;
      endTime: string;
    }> = [];

    for (const slot of availability.schedule) {
      // Check if slot is in date range
      if (slot.date < earliestDate || slot.date > latestDate) {
        continue;
      }

      // Check if slot is available
      if (!slot.available) {
        continue;
      }

      // Check if preferred time matches
      if (request.preferredTime) {
        const [prefStart, prefEnd] = request.preferredTime.split('-');
        const slotStart = slot.startTime;
        const slotEnd = slot.endTime;

        // Check if slot overlaps with preferred time
        if (slotStart < prefStart || slotEnd > prefEnd) {
          continue;
        }
      }

      availableSlots.push({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }

    return availableSlots;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    point1: {latitude: number; longitude: number},
    point2: {latitude: number; longitude: number}
  ): number {
    const R = 3959; // Earth radius in miles
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.latitude)) *
        Math.cos(this.toRad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get day of week as lowercase string
   */
  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  /**
   * Generate time slots
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number
  ): string[] {
    const slots: string[] = [];
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    let current = start;

    while (current < end) {
      const slotEnd = Math.min(current + durationMinutes, end);
      slots.push(`${this.formatTime(current)}-${this.formatTime(slotEnd)}`);
      current += durationMinutes;
    }

    return slots;
  }

  /**
   * Parse time string to minutes
   */
  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * Format minutes to time string
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
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
export const smartSchedulerService = new SmartSchedulerService();

/**
 * Availability Scheduler Service
 * Manages inspector availability and scheduling
 */

import {JurisdictionStaff, AvailabilitySlot, WorkingHours, VacationDate} from '@/types/jurisdiction-staff';
import {format, addDays, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval} from 'date-fns';

export class AvailabilitySchedulerService {
  /**
   * Get available time slots for a staff member
   */
  getAvailableSlots(
    staff: JurisdictionStaff,
    startDate: Date,
    endDate: Date,
    durationMinutes: number = 60
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const days = eachDayOfInterval({start: startDate, end: endDate});

    for (const day of days) {
      // Check if day is a vacation day
      if (this.isVacationDay(staff, day)) {
        continue;
      }

      // Get working hours for this day
      const dayName = format(day, 'EEEE').toLowerCase() as keyof WorkingHours;
      const schedule = staff.workingHours[dayName];

      if (!schedule) continue;

      // Generate slots for this day
      const daySlots = this.generateDaySlots(
        staff,
        day,
        schedule,
        durationMinutes
      );

      slots.push(...daySlots);
    }

    return slots;
  }

  /**
   * Check if staff is available at a specific time
   */
  isAvailableAt(
    staff: JurisdictionStaff,
    dateTime: Date,
    durationMinutes: number = 60
  ): boolean {
    // Check if active
    if (!staff.isActive) return false;

    // Check vacation
    if (this.isVacationDay(staff, dateTime)) return false;

    // Check working hours
    const dayName = format(dateTime, 'EEEE').toLowerCase() as keyof WorkingHours;
    const schedule = staff.workingHours[dayName];

    if (!schedule) return false;

    const timeStr = format(dateTime, 'HH:mm');
    const endTime = this.addMinutes(timeStr, durationMinutes);

    // Check if time falls within working hours
    if (timeStr < schedule.start || endTime > schedule.end) {
      return false;
    }

    // Check breaks
    if (schedule.breaks) {
      for (const breakTime of schedule.breaks) {
        if (
          (timeStr >= breakTime.start && timeStr < breakTime.end) ||
          (endTime > breakTime.start && endTime <= breakTime.end)
        ) {
          return false;
        }
      }
    }

    // Check workload
    if (staff.currentWorkload >= staff.maxWorkload) {
      return false;
    }

    return true;
  }

  /**
   * Find next available slot for staff
   */
  findNextAvailableSlot(
    staff: JurisdictionStaff,
    fromDate: Date,
    durationMinutes: number = 60,
    lookAheadDays: number = 30
  ): AvailabilitySlot | null {
    const endDate = addDays(fromDate, lookAheadDays);
    const slots = this.getAvailableSlots(staff, fromDate, endDate, durationMinutes);

    // Filter out past slots and return first available
    const now = new Date();
    const futureSlots = slots.filter(slot => slot.startTime > now);

    return futureSlots.length > 0 ? futureSlots[0] : null;
  }

  /**
   * Get availability calendar for staff
   */
  getAvailabilityCalendar(
    staff: JurisdictionStaff,
    startDate: Date,
    endDate: Date
  ): Map<string, AvailabilitySlot[]> {
    const calendar = new Map<string, AvailabilitySlot[]>();
    const days = eachDayOfInterval({start: startDate, end: endDate});

    for (const day of days) {
      const dayKey = format(day, 'yyyy-MM-dd');
      const slots = this.getAvailableSlots(staff, day, day, 60);
      calendar.set(dayKey, slots);
    }

    return calendar;
  }

  /**
   * Update staff availability
   */
  updateAvailability(
    staff: JurisdictionStaff,
    updates: {
      workingHours?: Partial<WorkingHours>;
      vacationDates?: VacationDate[];
      timezone?: string;
    }
  ): JurisdictionStaff {
    return {
      ...staff,
      workingHours: updates.workingHours
        ? {...staff.workingHours, ...updates.workingHours}
        : staff.workingHours,
      vacationDates: updates.vacationDates || staff.vacationDates,
      timezone: updates.timezone || staff.timezone,
    };
  }

  /**
   * Check if date is a vacation day
   */
  private isVacationDay(staff: JurisdictionStaff, date: Date): boolean {
    const dateOnly = new Date(date.toDateString());

    return staff.vacationDates.some(vacation => {
      if (!vacation.approved) return false;

      const vacStart = new Date(vacation.start.toDateString());
      const vacEnd = new Date(vacation.end.toDateString());

      return isWithinInterval(dateOnly, {start: vacStart, end: vacEnd});
    });
  }

  /**
   * Generate time slots for a day
   */
  private generateDaySlots(
    staff: JurisdictionStaff,
    day: Date,
    schedule: {start: string; end: string; breaks?: Array<{start: string; end: string}>},
    durationMinutes: number
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const [startHour, startMin] = schedule.start.split(':').map(Number);
    const [endHour, endMin] = schedule.end.split(':').map(Number);

    const dayStart = new Date(day);
    dayStart.setHours(startHour, startMin, 0, 0);

    const dayEnd = new Date(day);
    dayEnd.setHours(endHour, endMin, 0, 0);

    let currentTime = new Date(dayStart);

    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // Check if slot overlaps with breaks
      const overlapsBreak = schedule.breaks?.some(breakTime => {
        const breakStart = this.parseTime(day, breakTime.start);
        const breakEnd = this.parseTime(day, breakTime.end);
        return (
          (currentTime >= breakStart && currentTime < breakEnd) ||
          (slotEnd > breakStart && slotEnd <= breakEnd)
        );
      });

      if (!overlapsBreak && slotEnd <= dayEnd) {
        slots.push({
          staffId: staff.id,
          startTime: new Date(currentTime),
          endTime: new Date(slotEnd),
          type: 'available',
          location: staff.lastLocation
            ? {
                latitude: staff.lastLocation.latitude,
                longitude: staff.lastLocation.longitude,
                timestamp: staff.lastLocation.timestamp,
              }
            : undefined,
        });
      }

      // Move to next slot (30-minute intervals)
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  }

  /**
   * Parse time string to Date
   */
  private parseTime(day: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(day);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Add minutes to time string
   */
  private addMinutes(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  /**
   * Get staff availability summary
   */
  getAvailabilitySummary(
    staff: JurisdictionStaff,
    startDate: Date,
    endDate: Date
  ): {
    totalDays: number;
    workingDays: number;
    vacationDays: number;
    availableHours: number;
    utilizationRate: number;
  } {
    const days = eachDayOfInterval({start: startDate, end: endDate});
    let workingDays = 0;
    let vacationDays = 0;
    let availableHours = 0;

    for (const day of days) {
      if (this.isVacationDay(staff, day)) {
        vacationDays++;
        continue;
      }

      const dayName = format(day, 'EEEE').toLowerCase() as keyof WorkingHours;
      const schedule = staff.workingHours[dayName];

      if (schedule) {
        workingDays++;
        const [startHour, startMin] = schedule.start.split(':').map(Number);
        const [endHour, endMin] = schedule.end.split(':').map(Number);
        const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;

        // Subtract break time
        let breakHours = 0;
        if (schedule.breaks) {
          breakHours = schedule.breaks.reduce((sum, b) => {
            const [bStartHour, bStartMin] = b.start.split(':').map(Number);
            const [bEndHour, bEndMin] = b.end.split(':').map(Number);
            return sum + (bEndHour * 60 + bEndMin - (bStartHour * 60 + bStartMin)) / 60;
          }, 0);
        }

        availableHours += hours - breakHours;
      }
    }

    const totalDays = days.length;
    const utilizationRate =
      staff.maxWorkload > 0 ? staff.currentWorkload / staff.maxWorkload : 0;

    return {
      totalDays,
      workingDays,
      vacationDays,
      availableHours: Math.round(availableHours * 100) / 100,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    };
  }
}

// Singleton instance
export const availabilitySchedulerService = new AvailabilitySchedulerService();

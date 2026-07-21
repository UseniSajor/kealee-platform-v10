/**
 * KEALEE COMMAND CENTER - DATE UTILITIES
 * Common date manipulation functions for construction scheduling
 */

import {
  addDays,
  addWeeks,
  addMonths,
  subDays,
  differenceInDays,
  differenceInBusinessDays,
  isWeekend,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parse,
  isWithinInterval,
  eachDayOfInterval,
} from 'date-fns';

/**
 * Get working days (excluding weekends)
 */
export function getWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  let current = new Date(startDate);

  while (current <= endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

/**
 * Add working days to a date
 */
export function addWorkingDays(date: Date, days: number): Date {
  let result = new Date(date);
  let added = 0;
  const direction = days >= 0 ? 1 : -1;
  const absDays = Math.abs(days);

  while (added < absDays) {
    result = addDays(result, direction);
    if (!isWeekend(result)) {
      added++;
    }
  }

  return result;
}

/**
 * Subtract working days from a date
 */
export function subtractWorkingDays(date: Date, days: number): Date {
  return addWorkingDays(date, -days);
}

/**
 * Check if a date is a working day
 */
export function isWorkingDay(date: Date, holidays: Date[] = []): boolean {
  if (isWeekend(date)) {
    return false;
  }

  // Check against holidays
  return !holidays.some(holiday => isSameDay(date, holiday));
}

/**
 * Get report period based on type
 */
export function getReportPeriod(
  type: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  switch (type) {
    case 'daily':
      return {
        start: startOfDay(subDays(referenceDate, 1)),
        end: endOfDay(subDays(referenceDate, 1)),
      };

    case 'weekly':
      return {
        start: startOfWeek(subDays(referenceDate, 7), { weekStartsOn: 1 }),
        end: endOfWeek(subDays(referenceDate, 7), { weekStartsOn: 1 }),
      };

    case 'biweekly':
      return {
        start: startOfWeek(subDays(referenceDate, 14), { weekStartsOn: 1 }),
        end: endOfWeek(subDays(referenceDate, 7), { weekStartsOn: 1 }),
      };

    case 'monthly':
      const previousMonth = addMonths(referenceDate, -1);
      return {
        start: startOfMonth(previousMonth),
        end: endOfMonth(previousMonth),
      };
  }
}

/**
 * Get all dates in a range
 */
export function getDatesInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

/**
 * Get working dates in a range
 */
export function getWorkingDatesInRange(
  start: Date,
  end: Date,
  holidays: Date[] = []
): Date[] {
  return getDatesInRange(start, end).filter(date => isWorkingDay(date, holidays));
}

/**
 * Calculate days until deadline
 */
export function daysUntilDeadline(deadline: Date, from: Date = new Date()): number {
  return differenceInDays(deadline, from);
}

/**
 * Calculate working days until deadline
 */
export function workingDaysUntilDeadline(
  deadline: Date,
  from: Date = new Date()
): number {
  return differenceInBusinessDays(deadline, from);
}

/**
 * Check if date is within a range
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(date, { start, end });
}

/**
 * Format date for display
 */
export function formatDate(date: Date, formatStr = 'MMM d, yyyy'): string {
  return format(date, formatStr);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date, formatStr = 'MMM d, yyyy h:mm a'): string {
  return format(date, formatStr);
}

/**
 * Parse date string
 */
export function parseDate(dateStr: string, formatStr = 'yyyy-MM-dd'): Date {
  return parse(dateStr, formatStr, new Date());
}

/**
 * Get schedule status based on variance
 */
export function getScheduleStatus(
  plannedEnd: Date,
  actualOrProjectedEnd: Date
): { status: 'ahead' | 'on-track' | 'behind'; varianceDays: number } {
  const variance = differenceInDays(actualOrProjectedEnd, plannedEnd);

  if (variance <= -3) {
    return { status: 'ahead', varianceDays: variance };
  } else if (variance <= 3) {
    return { status: 'on-track', varianceDays: variance };
  } else {
    return { status: 'behind', varianceDays: variance };
  }
}

/**
 * Calculate milestone dates based on project schedule
 */
export function calculateMilestones(
  projectStart: Date,
  totalDays: number,
  milestones: Array<{ name: string; percentComplete: number }>
): Array<{ name: string; dueDate: Date; workingDays: number }> {
  return milestones.map(milestone => {
    const daysFromStart = Math.round((totalDays * milestone.percentComplete) / 100);
    return {
      name: milestone.name,
      dueDate: addWorkingDays(projectStart, daysFromStart),
      workingDays: daysFromStart,
    };
  });
}

/**
 * Get next occurrence of a weekday
 */
export function getNextWeekday(
  from: Date,
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
): Date {
  let current = addDays(from, 1);

  while (current.getDay() !== weekday) {
    current = addDays(current, 1);
  }

  return current;
}

/**
 * Get standard construction schedule times
 */
export function getConstructionWorkHours(): { start: number; end: number; breakStart: number; breakEnd: number } {
  return {
    start: 7,      // 7 AM
    end: 16,       // 4 PM
    breakStart: 12, // Noon
    breakEnd: 12.5, // 12:30 PM
  };
}

/**
 * Check if time is within construction work hours
 */
export function isWithinWorkHours(time: Date): boolean {
  const hours = time.getHours() + time.getMinutes() / 60;
  const workHours = getConstructionWorkHours();

  return hours >= workHours.start && hours < workHours.end;
}

// Re-export commonly used date-fns functions
export {
  addDays,
  addWeeks,
  addMonths,
  subDays,
  differenceInDays,
  isWeekend,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
};

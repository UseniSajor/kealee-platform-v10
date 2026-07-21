/**
 * KEALEE COMMAND CENTER - GOOGLE CALENDAR INTEGRATION
 * Calendar management for visits, inspections, and milestones
 */

import { google, calendar_v3 } from 'googleapis';

// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

// Calendar event types
export type CalendarEventType =
  | 'site_visit'
  | 'inspection'
  | 'milestone'
  | 'meeting'
  | 'deadline'
  | 'contractor_meeting'
  | 'client_meeting';

// Event color IDs in Google Calendar
const EVENT_COLORS: Record<CalendarEventType, string> = {
  site_visit: '2',      // Green
  inspection: '5',      // Yellow
  milestone: '9',       // Blue
  meeting: '7',         // Turquoise
  deadline: '11',       // Red
  contractor_meeting: '3', // Purple
  client_meeting: '4',  // Pink
};

export interface CalendarEventParams {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  type: CalendarEventType;
  attendees?: string[];
  reminders?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  metadata?: Record<string, string>;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(params: CalendarEventParams): Promise<string> {
  const event: calendar_v3.Schema$Event = {
    summary: params.summary,
    description: params.description,
    location: params.location,
    colorId: EVENT_COLORS[params.type],
    start: {
      dateTime: params.start.toISOString(),
      timeZone: process.env.TIMEZONE || 'America/Los_Angeles',
    },
    end: {
      dateTime: params.end.toISOString(),
      timeZone: process.env.TIMEZONE || 'America/Los_Angeles',
    },
    attendees: params.attendees?.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: params.reminders || [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
    extendedProperties: params.metadata ? {
      private: params.metadata,
    } : undefined,
  };

  const result = await calendar.events.insert({
    calendarId: params.calendarId,
    requestBody: event,
    sendUpdates: params.attendees ? 'all' : 'none',
  });

  return result.data.id!;
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  updates: Partial<CalendarEventParams>
): Promise<void> {
  const event: calendar_v3.Schema$Event = {};

  if (updates.summary) event.summary = updates.summary;
  if (updates.description) event.description = updates.description;
  if (updates.location) event.location = updates.location;
  if (updates.type) event.colorId = EVENT_COLORS[updates.type];
  if (updates.start) {
    event.start = {
      dateTime: updates.start.toISOString(),
      timeZone: process.env.TIMEZONE || 'America/Los_Angeles',
    };
  }
  if (updates.end) {
    event.end = {
      dateTime: updates.end.toISOString(),
      timeZone: process.env.TIMEZONE || 'America/Los_Angeles',
    };
  }
  if (updates.attendees) {
    event.attendees = updates.attendees.map(email => ({ email }));
  }

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: event,
    sendUpdates: updates.attendees ? 'all' : 'none',
  });
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string,
  notifyAttendees = true
): Promise<void> {
  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: notifyAttendees ? 'all' : 'none',
  });
}

/**
 * Get calendar events in a time range
 */
export async function getCalendarEvents(
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<calendar_v3.Schema$Event[]> {
  const result = await calendar.events.list({
    calendarId,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return result.data.items || [];
}

/**
 * Get available time slots
 */
export async function getAvailableSlots(
  calendarId: string,
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  workHours = { start: 9, end: 17 }
): Promise<TimeSlot[]> {
  // Get busy periods
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busyPeriods = freeBusy.data.calendars?.[calendarId]?.busy || [];

  // Generate available slots
  const slots: TimeSlot[] = [];
  const slotDurationMs = durationMinutes * 60 * 1000;
  let current = new Date(startDate);

  while (current < endDate) {
    const dayOfWeek = current.getDay();
    const hour = current.getHours();

    // Skip weekends and outside work hours
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      current.setHours(workHours.start, 0, 0, 0);
      continue;
    }

    if (hour < workHours.start) {
      current.setHours(workHours.start, 0, 0, 0);
      continue;
    }

    if (hour >= workHours.end) {
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      current.setHours(workHours.start, 0, 0, 0);
      continue;
    }

    const slotEnd = new Date(current.getTime() + slotDurationMs);

    // Check if slot end is within work hours
    if (slotEnd.getHours() > workHours.end ||
        (slotEnd.getHours() === workHours.end && slotEnd.getMinutes() > 0)) {
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      current.setHours(workHours.start, 0, 0, 0);
      continue;
    }

    // Check if slot conflicts with busy periods
    const isBusy = busyPeriods.some(busy => {
      const busyStart = new Date(busy.start!);
      const busyEnd = new Date(busy.end!);
      return current < busyEnd && slotEnd > busyStart;
    });

    if (!isBusy) {
      slots.push({
        start: new Date(current),
        end: slotEnd,
      });
    }

    // Move to next 30-minute increment
    current = new Date(current.getTime() + 30 * 60 * 1000);
  }

  return slots;
}

/**
 * Check if a specific time slot is available
 */
export async function isSlotAvailable(
  calendarId: string,
  start: Date,
  end: Date
): Promise<boolean> {
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busyPeriods = freeBusy.data.calendars?.[calendarId]?.busy || [];
  return busyPeriods.length === 0;
}

/**
 * Find next available slot for multiple calendars
 */
export async function findNextAvailableSlot(
  calendarIds: string[],
  startFrom: Date,
  durationMinutes: number,
  maxDaysToSearch = 14
): Promise<TimeSlot | null> {
  const endSearch = new Date(startFrom.getTime() + maxDaysToSearch * 24 * 60 * 60 * 1000);

  // Get free/busy for all calendars
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: startFrom.toISOString(),
      timeMax: endSearch.toISOString(),
      items: calendarIds.map(id => ({ id })),
    },
  });

  // Merge all busy periods
  const allBusyPeriods: Array<{ start: Date; end: Date }> = [];

  for (const calendarId of calendarIds) {
    const busy = freeBusy.data.calendars?.[calendarId]?.busy || [];
    for (const period of busy) {
      allBusyPeriods.push({
        start: new Date(period.start!),
        end: new Date(period.end!),
      });
    }
  }

  // Sort and merge overlapping periods
  allBusyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

  const slotDurationMs = durationMinutes * 60 * 1000;
  let current = new Date(startFrom);
  const workHours = { start: 9, end: 17 };

  while (current < endSearch) {
    const dayOfWeek = current.getDay();
    const hour = current.getHours();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      current.setHours(workHours.start, 0, 0, 0);
      continue;
    }

    // Adjust to work hours
    if (hour < workHours.start) {
      current.setHours(workHours.start, 0, 0, 0);
      continue;
    }

    if (hour >= workHours.end) {
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      current.setHours(workHours.start, 0, 0, 0);
      continue;
    }

    const slotEnd = new Date(current.getTime() + slotDurationMs);

    // Check if slot fits in work day
    if (slotEnd.getHours() > workHours.end) {
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      current.setHours(workHours.start, 0, 0, 0);
      continue;
    }

    // Check all busy periods
    const isBusy = allBusyPeriods.some(busy =>
      current < busy.end && slotEnd > busy.start
    );

    if (!isBusy) {
      return { start: new Date(current), end: slotEnd };
    }

    current = new Date(current.getTime() + 30 * 60 * 1000);
  }

  return null;
}

// Convenience functions

/**
 * Schedule a site visit
 */
export async function scheduleSiteVisit(params: {
  calendarId: string;
  projectName: string;
  address: string;
  pmEmail: string;
  start: Date;
  durationMinutes: number;
  notes?: string;
}): Promise<string> {
  const end = new Date(params.start.getTime() + params.durationMinutes * 60 * 1000);

  return createCalendarEvent({
    calendarId: params.calendarId,
    summary: `Site Visit: ${params.projectName}`,
    description: params.notes || 'Regular site visit',
    location: params.address,
    start: params.start,
    end,
    type: 'site_visit',
    attendees: [params.pmEmail],
    reminders: [
      { method: 'email', minutes: 1440 }, // 24 hours
      { method: 'popup', minutes: 60 },   // 1 hour
    ],
  });
}

/**
 * Schedule an inspection
 */
export async function scheduleInspection(params: {
  calendarId: string;
  projectName: string;
  inspectionType: string;
  address: string;
  start: Date;
  contactEmail?: string;
}): Promise<string> {
  const end = new Date(params.start.getTime() + 60 * 60 * 1000); // 1 hour default

  return createCalendarEvent({
    calendarId: params.calendarId,
    summary: `${params.inspectionType} Inspection: ${params.projectName}`,
    description: `${params.inspectionType} inspection for ${params.projectName}`,
    location: params.address,
    start: params.start,
    end,
    type: 'inspection',
    attendees: params.contactEmail ? [params.contactEmail] : undefined,
    reminders: [
      { method: 'email', minutes: 2880 }, // 48 hours
      { method: 'popup', minutes: 120 },  // 2 hours
    ],
  });
}

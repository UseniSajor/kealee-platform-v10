/**
 * Calendly Integration
 *
 * Auto-schedules calls on Calendly for qualified leads.
 */

const CALENDLY_API_TOKEN = process.env.CALENDLY_API_TOKEN ?? ''
const CALENDLY_CALENDAR_UUID = process.env.CALENDLY_CALENDAR_UUID ?? ''
const CALENDLY_BASE = 'https://api.calendly.com'

export interface CalendlyAvailability {
  date: string                   // ISO date: "2024-05-15"
  startTime: string              // HH:mm format: "14:00"
  endTime: string                // HH:mm format: "14:30"
  timezone: string               // e.g. "America/New_York"
}

export interface CalendlyEventCreated {
  uri: string
  name: string
  startTime: string              // ISO 8601
  endTime: string                // ISO 8601
  inviteesCounterpartNames: string[]
}

/**
 * Fetch available slots for the next N days
 */
export async function getAvailableSlots(
  days: number = 7,
  timezone: string = 'America/New_York'
): Promise<CalendlyAvailability[]> {
  if (!CALENDLY_API_TOKEN || !CALENDLY_CALENDAR_UUID) {
    console.warn('Calendly not configured (missing token or calendar UUID)')
    return []
  }

  try {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    // Calendly uses a complex query for availability
    // This is a simplified version; in production, use Calendly's EventType API
    const res = await fetch(
      `${CALENDLY_BASE}/calendar_events?count=100&user=${CALENDLY_CALENDAR_UUID}&status=available&fields=start_time,end_time,location`,
      {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) {
      throw new Error(`Calendly error: ${res.status}`)
    }

    const data = (await res.json()) as { collection?: any[] }
    const slots: CalendlyAvailability[] = []

    // Parse available slots (this is simplified; actual Calendly API is more complex)
    for (const event of data.collection || []) {
      const startTime = new Date(event.start_time)
      if (startTime > new Date() && startTime < endDate) {
        slots.push({
          date: startTime.toISOString().split('T')[0],
          startTime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          endTime: new Date(event.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          timezone,
        })
      }
    }

    return slots.slice(0, 3)  // Return top 3 slots
  } catch (err) {
    console.error('Error fetching Calendly slots:', err)
    return []
  }
}

/**
 * Create a calendar event on Calendly
 */
export async function createCalendlyEvent(input: {
  guestEmail: string
  guestName: string
  title: string
  description?: string
  startTime: string          // ISO 8601
  endTime: string            // ISO 8601
}): Promise<CalendlyEventCreated | null> {
  if (!CALENDLY_API_TOKEN) {
    console.warn('Calendly not configured')
    return null
  }

  try {
    const res = await fetch(`${CALENDLY_BASE}/scheduled_events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calendar_event: {
          title: input.title,
          description: input.description,
          start_time: input.startTime,
          end_time: input.endTime,
          invitees: [
            {
              email: input.guestEmail,
              full_name: input.guestName,
            },
          ],
        },
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`Calendly error: ${res.status} ${text}`)
    }

    const data = (await res.json()) as { resource?: CalendlyEventCreated }
    return data.resource || null
  } catch (err) {
    console.error('Error creating Calendly event:', err)
    return null
  }
}

/**
 * Format available slots for SMS message
 */
export function formatSlotsSMS(slots: CalendlyAvailability[]): string {
  if (slots.length === 0) {
    return 'No slots available. Let us know what works for you!'
  }

  return slots
    .slice(0, 3)
    .map((s, i) => `${i + 1}) ${s.date} at ${s.startTime}`)
    .join(' | ')
}


import { addDays } from 'date-fns';

export async function createCalendarEvent(calendarId: string, event: any): Promise<string> {
    console.log(`[Mock Calendar] Created event on ${calendarId}: ${event.summary}`);
    return 'mock-event-id';
}

export async function getAvailableSlots(
    calendarId: string,
    start: Date,
    end: Date,
    durationMinutes: number
): Promise<Array<{ start: Date; end: Date }>> {
    // Return some mock slots
    const slots = [];
    let current = new Date(start);
    current.setHours(9, 0, 0, 0);

    while (current < end) {
        if (current.getHours() >= 9 && current.getHours() < 17) {
            slots.push({
                start: new Date(current),
                end: new Date(current.getTime() + durationMinutes * 60000)
            });
        }
        current = addDays(current, 1);
    }
    return slots;
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; address: string }> {
    return { lat: 38.9, lng: -77.0, address }; // Mock DC location
}

export async function getWeatherForecast(lat: number, lng: number, days: number) {
    return Array(days).fill(0).map((_, i) => ({
        date: addDays(new Date(), i),
        conditions: 'Clear',
        temp: { min: 60, max: 75 },
        isWorkable: true
    }));
}

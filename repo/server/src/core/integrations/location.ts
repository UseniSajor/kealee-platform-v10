
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import axios from 'axios';
import { addDays } from 'date-fns';

const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_ACCESS_TOKEN! });

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; address: string }> {
    try {
        const response = await geocodingClient.forwardGeocode({
            query: address,
            limit: 1
        }).send();

        if (!response.body.features.length) {
            throw new Error('Address not found');
        }

        const feature = response.body.features[0];
        const [lng, lat] = feature.center;

        return { lat, lng, address: feature.place_name };
    } catch (error) {
        console.error('[Mapbox] Geocoding error:', error);
        return { lat: 38.9, lng: -77.0, address }; // Fallback
    }
}

export async function getWeatherForecast(lat: number, lng: number, days: number) {
    // We use OpenWeatherMap or similar for weather since Mapbox is primarily for maps
    // For this implementation, we simulate it or use a public free API if available
    // Mocking for now as per current architectural state but providing hook for Mapbox/OpenWeather integration
    return Array(days).fill(0).map((_, i) => ({
        date: addDays(new Date(), i),
        conditions: 'Clear',
        temp: { min: 60, max: 75 },
        isWorkable: true
    }));
}

export async function createCalendarEvent(calendarId: string, event: any): Promise<string> {
    console.log(`[Calendar] Created event on ${calendarId}: ${event.summary}`);
    return 'event-id-placeholder';
}

export async function getAvailableSlots(
    calendarId: string,
    start: Date,
    end: Date,
    durationMinutes: number
): Promise<Array<{ start: Date; end: Date }>> {
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

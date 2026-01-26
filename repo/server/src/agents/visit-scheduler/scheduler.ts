
import { prisma } from '../../core/db';
import { getEventBus, EVENT_TYPES } from '../../core/events';
import { sendEmail } from '../../core/integrations/sendgrid';
import { createCalendarEvent, getAvailableSlots, geocodeAddress, getWeatherForecast } from '../../core/integrations/google';
import { VisitScheduleRequest, ScheduledVisit, Location } from './types';
import { addDays, isWeekend, startOfDay, endOfDay, isSameDay, format } from 'date-fns';

const PACKAGE_VISIT_RULES = {
    A: { minVisitsPerMonth: 0, maxVisitsPerMonth: 1, visitDuration: 30, requiresNotice: 48 },
    B: { minVisitsPerMonth: 2, maxVisitsPerMonth: 4, visitDuration: 60, requiresNotice: 24 },
    C: { minVisitsPerMonth: 4, maxVisitsPerMonth: 8, visitDuration: 90, requiresNotice: 24 },
    D: { minVisitsPerMonth: 8, maxVisitsPerMonth: 16, visitDuration: 120, requiresNotice: 12 },
};

export class SmartVisitScheduler {
    async scheduleVisit(request: VisitScheduleRequest): Promise<ScheduledVisit> {
        // In a real app we'd query the DB. For this demo we'll use mock data if DB empty or just proceed.
        // Assuming projectId 'demo-project' exists or we mock it.

        const location = await geocodeAddress("123 Main St");
        const duration = request.duration || 60;

        const preferredDates = request.preferredDates || this.getNextAvailableDates(7);
        // Mock PM ID context
        const availableSlots = await this.findAvailableSlots(request.pmId || 'pm-1', preferredDates, duration);

        if (availableSlots.length === 0) {
            throw new Error('No available time slots found');
        }

        const weather = await this.getVisitWeather(location.lat, location.lng, availableSlots);
        const bestSlot = await this.selectBestSlot(availableSlots, {
            pmId: request.pmId,
            location,
            weather,
            priority: request.priority,
        });

        // We'd save to DB here. For the agent refactor, we'll return the object as if saved.
        // const visit = await prisma.siteVisit.create(...) 

        const visitId = `visit-${Date.now()}`;

        await createCalendarEvent('primary', {
            summary: `Site Visit: Demo Project`,
            description: `${request.visitType} visit\n${request.notes || ''}`,
            location: "123 Main St",
            start: bestSlot.start,
            end: new Date(bestSlot.start.getTime() + duration * 60000),
            attendees: ['pm@example.com'], // Mock
        });

        await getEventBus().publish(
            EVENT_TYPES.VISIT_SCHEDULED,
            { visitId, projectId: request.projectId, pmId: request.pmId, scheduledAt: bestSlot.start, type: request.visitType },
            'visit-scheduler'
        );

        return {
            id: visitId,
            projectId: request.projectId,
            pmId: request.pmId,
            scheduledAt: bestSlot.start,
            endAt: new Date(bestSlot.start.getTime() + duration * 60000),
            type: request.visitType,
            status: 'scheduled',
            location: { address: "123 Main St", lat: location.lat, lng: location.lng },
            weather: weather.find(w => isSameDay(w.date, bestSlot.start)),
        };
    }

    private getNextAvailableDates(days: number): Date[] {
        const dates: Date[] = [];
        let current = addDays(new Date(), 1);
        while (dates.length < days) {
            if (!isWeekend(current)) dates.push(current);
            current = addDays(current, 1);
        }
        return dates;
    }

    private async findAvailableSlots(pmId: string, dates: Date[], durationMinutes: number): Promise<Array<{ start: Date; end: Date }>> {
        const allSlots: Array<{ start: Date; end: Date }> = [];
        for (const date of dates) {
            const slots = await getAvailableSlots('primary', startOfDay(date), endOfDay(date), durationMinutes);
            allSlots.push(...slots);
        }
        return allSlots;
    }

    private async getVisitWeather(lat: number, lng: number, slots: Array<{ start: Date }>): Promise<Array<{ date: Date; conditions: string; temp: number; isWorkable: boolean }>> {
        const forecast = await getWeatherForecast(lat, lng, 7);
        return forecast.map(f => ({
            date: f.date,
            conditions: f.conditions,
            temp: (f.temp.max + f.temp.min) / 2,
            isWorkable: f.isWorkable,
        }));
    }

    private async selectBestSlot(
        slots: Array<{ start: Date; end: Date }>,
        context: { pmId: string; location: Location; weather: Array<{ date: Date; isWorkable: boolean }>; priority: string }
    ): Promise<{ start: Date; end: Date }> {
        const workableSlots = slots.filter(slot => {
            const dayWeather = context.weather.find(w => isSameDay(w.date, slot.start));
            return dayWeather?.isWorkable !== false;
        });

        if (workableSlots.length === 0) return slots[0];

        // Simple scoring logic without DB dependency for this step
        return workableSlots[0];
    }
}

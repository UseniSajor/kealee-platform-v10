
import {
    addDays, addWeeks, addMonths, format, differenceInDays,
    isWeekend, startOfWeek, endOfWeek, startOfDay, endOfDay,
    subDays, isSameDay
} from 'date-fns';

export function getWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    let current = new Date(startDate);
    while (current <= endDate) {
        if (!isWeekend(current)) count++;
        current = addDays(current, 1);
    }
    return count;
}

export function addWorkingDays(date: Date, days: number): Date {
    let result = new Date(date);
    let added = 0;
    while (added < days) {
        result = addDays(result, 1);
        if (!isWeekend(result)) added++;
    }
    return result;
}

export function getReportPeriod(type: 'weekly' | 'biweekly' | 'monthly', referenceDate = new Date()): {
    start: Date;
    end: Date;
} {
    switch (type) {
        case 'weekly':
            return { start: startOfWeek(referenceDate), end: endOfWeek(referenceDate) };
        case 'biweekly':
            const twoWeeksAgo = addWeeks(referenceDate, -2);
            return { start: startOfWeek(twoWeeksAgo), end: endOfWeek(referenceDate) };
        case 'monthly':
            const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
            const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
            return { start: firstDay, end: lastDay };
    }
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function calculatePercentage(part: number, whole: number): number {
    if (whole === 0) return 0;
    return Math.round((part / whole) * 100 * 10) / 10;
}

export function calculateVariance(actual: number, budgeted: number): {
    amount: number;
    percentage: number;
} {
    const amount = actual - budgeted;
    const percentage = budgeted === 0 ? 0 : (amount / budgeted) * 100;
    return { amount, percentage };
}

import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

export function formatTime(date: Date): string {
    return format(date, 'HH:mm');
}

export function getToday(): string {
    return formatDate(new Date());
}

export function getCurrentWeek(): { start: string; end: string } {
    const now = new Date();
    return {
        start: formatDate(startOfWeek(now, { weekStartsOn: 1 })),
        end: formatDate(endOfWeek(now, { weekStartsOn: 1 })),
    };
}

export function getCurrentMonth(): { year: number; month: number } {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth(), // 0-11
    };
}

export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function calculateDuration(startTime: string, endTime: string): number {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    return (endMinutes - startMinutes) / 60;
}

export function formatDuration(hours: number): string {
    if (hours < 1) {
        return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} hrs`;
}

export function formatDisplayDate(dateString: string): string {
    return format(new Date(dateString), 'EEEE, MMM d, yyyy');
}

/**
 * Get start and end of current week (Monday - Sunday)
 */
export function getCurrentWeekDates(): { start: Date; end: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as first day

    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
}

/**
 * Get array of dates for the week (Mon-Sun)
 */
export function getWeekDays(startDate: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    return days;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

/**
 * Format date as day name (e.g., "Monday")
 */
export function formatDayName(date: Date): string {
    return format(date, 'EEEE');
}

/**
 * Format date as short (e.g., "Feb 9")
 */
export function formatShortDate(date: Date): string {
    return format(date, 'MMM d');
}

/**
 * Get array of all dates in a month
 */
export function getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
    }

    return days;
}

/**
 * Get month name (e.g., "February 2026")
 */
export function getMonthName(year: number, month: number): string {
    return format(new Date(year, month, 1), 'MMMM yyyy');
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
}
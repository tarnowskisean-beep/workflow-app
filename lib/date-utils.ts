import { format, parseISO, startOfDay } from "date-fns"

/**
 * Parses a date string (YYYY-MM-DD) as a local date, avoiding UTC shifts.
 * Use this when reading date strings from URL search params or form inputs.
 * 
 * @param dateStr - The date string in YYYY-MM-DD format
 * @returns A Date object representing midnight at the start of that day in local time
 */
export function parseLocalDate(dateStr: string): Date {
    if (!dateStr) return new Date()

    // Append time to force local parsing if it's just a date string
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(`${dateStr}T00:00:00`)
    }

    return new Date(dateStr)
}

/**
 * Formats a date to YYYY-MM-DD for use in URLs and form inputs.
 * 
 * @param date - The date to format
 * @returns String in YYYY-MM-DD format
 */
export function formatLocalDate(date: Date): string {
    return format(date, "yyyy-MM-dd")
}

/**
 * Returns the start of the current day in local time.
 */
export function getToday(): Date {
    const now = new Date()
    return startOfDay(now)
}

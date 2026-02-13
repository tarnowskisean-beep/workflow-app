import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns"

export function calculateNextDueDate(currentDate: Date, interval: string, days?: string | null): Date {
    // Operate on UTC to avoid timezone shifts
    const baseDate = new Date(currentDate)
    baseDate.setUTCHours(0, 0, 0, 0)

    if (interval === "WEEKLY" && days) {
        const validDays = days.split(",").map(d => d.trim()) // ["Mon", "Wed"]
        const dayMap: { [key: string]: number } = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 }
        const targetDays = validDays.map(d => dayMap[d]).sort((a, b) => a - b)

        if (targetDays.length === 0) return addWeeks(baseDate, 1)

        const currentDay = baseDate.getUTCDay() // 0-6 (UTC)

        // Find next day in current week
        const nextDayInWeek = targetDays.find(d => d > currentDay)

        if (nextDayInWeek !== undefined) {
            const daysToAdd = nextDayInWeek - currentDay
            const result = new Date(baseDate)
            result.setUTCDate(baseDate.getUTCDate() + daysToAdd)
            return result
        } else {
            // Wrap to first day of next week
            const firstDayNextWeek = targetDays[0]
            const daysUntilSunday = 7 - currentDay
            const result = new Date(baseDate)
            result.setUTCDate(baseDate.getUTCDate() + daysUntilSunday + firstDayNextWeek)
            return result
        }
    }

    // For other intervals, we can rely on date-fns but need to be careful.
    // date-fns addDays/Weeks/Months generally preserves local time, which equals preserving UTC time if offset is 0.
    // But mix-ups can happen. Let's use UTC safe manual manip for safety or stick to date-fns if safe.
    // Actually, addMonths on a UTC date works fine usually. 
    // BUT! addMonths(Feb 13 UTC) -> Mar 13 UTC.
    // If we use standard date-fns, it essentially operates on timestamp.

    switch (interval) {
        case "DAILY": return addDays(baseDate, 1)
        case "WEEKLY": return addWeeks(baseDate, 1) // Fallback
        case "MONTHLY": return addMonths(baseDate, 1)
        case "QUARTERLY": return addQuarters(baseDate, 1)
        case "YEARLY": return addYears(baseDate, 1)
        default: return addDays(baseDate, 1)
    }
}

/**
 * Projects future dates from a start date until an end date based on recurrence rule.
 */
export function projectRecurringDates(
    startDate: Date,
    interval: string,
    days: string | null,
    endDate: Date
): Date[] {
    const dates: Date[] = []
    let current = new Date(startDate)

    // Safety break to prevent infinite loops
    let iterations = 0
    const MAX_ITERATIONS = 100

    while (current < endDate && iterations < MAX_ITERATIONS) {
        const next = calculateNextDueDate(current, interval, days)
        if (next <= endDate) {
            dates.push(next)
        }
        current = next
        iterations++
    }

    return dates
}

/**
 * Calculates the first occurrence date inclusive of the start date.
 * e.g. If start is Friday and rule is "Weekly on Friday", returns Start (Friday).
 * If start is Friday and rule is "Weekly on Monday", returns next Monday.
 */
export function calculateFirstInstance(startDate: Date, interval: string, days?: string | null): Date {
    const baseDate = new Date(startDate)
    baseDate.setUTCHours(0, 0, 0, 0)

    if (interval === "WEEKLY" && days) {
        const validDays = days.split(",").map(d => d.trim())
        const dayMap: { [key: string]: number } = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 }
        const targetDays = validDays.map(d => dayMap[d]).sort((a, b) => a - b)

        if (targetDays.length === 0) return baseDate

        const currentDay = baseDate.getUTCDay()

        // Find match today or later in current week
        const nextDayInWeek = targetDays.find(d => d >= currentDay)

        if (nextDayInWeek !== undefined) {
            const daysToAdd = nextDayInWeek - currentDay
            const result = new Date(baseDate)
            result.setUTCDate(baseDate.getUTCDate() + daysToAdd)
            return result
        } else {
            // Wrap to next week
            const firstDayNextWeek = targetDays[0]
            const daysUntilSunday = 7 - currentDay
            const result = new Date(baseDate)
            result.setUTCDate(baseDate.getUTCDate() + daysUntilSunday + firstDayNextWeek)
            return result
        }
    }

    // For other intervals, the "First" instance is just the start date itself
    // unless we want to e.g. snap to "Start of Next Month"?
    // Typically "Monthly" means "Monthly on the 13th" (if started on 13th).
    // So returning baseDate is correct for 1st instance.
    return baseDate
}

import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns"

export function calculateNextDueDate(currentDate: Date, interval: string, days?: string | null): Date {
    // Reset time to start of day to avoid drift
    const baseDate = new Date(currentDate)
    baseDate.setHours(0, 0, 0, 0)

    if (interval === "WEEKLY" && days) {
        const validDays = days.split(",").map(d => d.trim()) // ["Mon", "Wed"]
        const dayMap: { [key: string]: number } = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 }
        const targetDays = validDays.map(d => dayMap[d]).sort((a, b) => a - b)

        if (targetDays.length === 0) return addWeeks(baseDate, 1)

        const currentDay = baseDate.getDay() // 0-6

        // Find next day in current week
        const nextDayInWeek = targetDays.find(d => d > currentDay)

        if (nextDayInWeek !== undefined) {
            const daysToAdd = nextDayInWeek - currentDay
            return addDays(baseDate, daysToAdd)
        } else {
            // Wrap to first day of next week
            const firstDayNextWeek = targetDays[0]
            const daysUntilSunday = 7 - currentDay
            return addDays(baseDate, daysUntilSunday + firstDayNextWeek)
        }
    }

    switch (interval) {
        case "DAILY": return addDays(baseDate, 1)
        case "WEEKLY": return addWeeks(baseDate, 1) // Fallback if no days
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

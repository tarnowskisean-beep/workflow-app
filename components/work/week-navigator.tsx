"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, subDays, isToday, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { parseLocalDate, formatLocalDate } from "@/lib/date-utils"
import Link from "next/link"

interface WeekNavigatorProps {
    loggedDates?: Date[]
}

export function WeekNavigator({ loggedDates = [] }: WeekNavigatorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const view = searchParams.get("view") || "day"
    const dateParam = searchParams.get("date")
    const currentDate = parseLocalDate(dateParam || "")

    const [calendarOpen, setCalendarOpen] = useState(false)

    // Keep for calendar selection which is interactive
    const navigate = (date: Date, newView?: string) => {
        const dateString = formatLocalDate(date)
        const v = newView || view
        router.push(`/time?date=${dateString}&view=${v}`)
        setCalendarOpen(false)
    }

    const getLinkHref = (date: Date, newView?: string) => {
        const dateString = formatLocalDate(date)
        const v = newView || view
        return `/time?date=${dateString}&view=${v}`
    }

    const getPreviousDate = () => {
        if (view === 'week') {
            return subWeeks(currentDate, 1)
        } else {
            return subDays(currentDate, 1)
        }
    }

    const getNextDate = () => {
        if (view === 'week') {
            return addWeeks(currentDate, 1)
        } else {
            return addDays(currentDate, 1)
        }
    }

    const goToToday = () => navigate(new Date())

    // Helper to check if a date matches any logged date
    const hasTimeLogged = (date: Date) => {
        return loggedDates.some(d => d.toDateString() === date.toDateString())
    }

    // Calculate week range for display if in week view
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })

    const previousDate = getPreviousDate()
    const nextDate = getNextDate()
    const todayDate = new Date()

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            {/* Left Control Group: Nav + Date */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center space-x-1 border rounded-md p-0.5 bg-background shadow-sm">
                    <Link
                        href={getLinkHref(previousDate)}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                    <Link
                        href={getLinkHref(nextDate)}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="flex items-baseline gap-3">
                    <h2 className="text-2xl font-normal text-foreground">
                        {view === 'day' ? format(currentDate, "EEEE, d MMM") : `Week of ${format(weekStart, "MMM d")}`}
                    </h2>

                    {!isToday(currentDate) && (
                        <Link
                            href={getLinkHref(todayDate)}
                            className="text-sm text-blue-600 hover:underline font-medium"
                        >
                            Return to today
                        </Link>
                    )}
                </div>
            </div>

            {/* Right Control Group: View Switcher */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted/20 border rounded-lg p-1">
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn("h-7 w-7 text-muted-foreground", calendarOpen && "bg-white shadow-sm text-foreground")}>
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={currentDate}
                                onSelect={(d) => d && navigate(d)}
                                initialFocus
                                modifiers={{
                                    hasTime: (date) => hasTimeLogged(date)
                                }}
                                modifiersStyles={{
                                    hasTime: {
                                        fontWeight: 'bold',
                                        textDecoration: 'underline decoration-primary decoration-2 underline-offset-4'
                                    }
                                }}
                                modifiersClassNames={{
                                    hasTime: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:bg-primary after:rounded-full"
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Link
                        href={getLinkHref(currentDate, "day")}
                        className={cn(
                            buttonVariants({ variant: view === "day" ? "secondary" : "ghost", size: "sm" }),
                            "text-xs h-7 px-3",
                            view === "day" && "bg-white shadow-sm text-orange-600 font-medium"
                        )}
                    >
                        Day
                    </Link>
                    <Link
                        href={getLinkHref(currentDate, "week")}
                        className={cn(
                            buttonVariants({ variant: view === "week" ? "secondary" : "ghost", size: "sm" }),
                            "text-xs h-7 px-3",
                            view === "week" && "bg-white shadow-sm text-orange-600 font-medium"
                        )}
                    >
                        Week
                    </Link>
                </div>


            </div>
        </div>
    )
}

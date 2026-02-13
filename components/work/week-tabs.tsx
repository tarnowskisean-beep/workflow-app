"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format, isSameDay, startOfWeek, addDays } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { parseLocalDate } from "@/lib/date-utils"

interface WeekTabsProps {
    currentDateStr: string
    weeklyEntries: any[]
    dailyTotals: Record<string, number> // Passed from server
}

export function WeekTabs({ currentDateStr, weeklyEntries, dailyTotals }: WeekTabsProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Parse locally to ensure we stay in client's timezone (avoiding UTC shift from server)
    const currentDate = parseLocalDate(currentDateStr)

    // Calculate week start (Monday)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })

    const getDayLink = (date: Date) => {
        const dateString = format(date, "yyyy-MM-dd")
        const params = new URLSearchParams(searchParams.toString())
        params.set("date", dateString)
        params.set("view", "day") // Force day view when clicking a tab
        return `/time?${params.toString()}`
    }

    const formatDuration = (seconds: number) => {
        if (!seconds) return "0:00"
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}:${minutes.toString().padStart(2, '0')}`
    }

    // Weekly total provided by server totals
    const weeklyTotal = Object.values(dailyTotals).reduce((acc, val) => acc + val, 0)

    return (
        <div className="flex border-b w-full overflow-x-auto no-scrollbar">
            {Array.from({ length: 7 }).map((_, i) => {
                const day = addDays(weekStart, i)
                const isSelected = isSameDay(day, currentDate)
                // Use yyyy-MM-dd key to match server map
                const dateKey = format(day, "yyyy-MM-dd")
                const totalSeconds = dailyTotals[dateKey] || 0
                const isToday = isSameDay(day, new Date())

                return (
                    <Link
                        key={i}
                        href={getDayLink(day)}
                        className={cn(
                            "flex flex-col items-center justify-center min-w-[100px] flex-1 py-3 px-2 text-sm font-medium transition-colors border-b-2 -mb-px hover:bg-muted/50",
                            isSelected
                                ? "border-orange-500 text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span className={cn(
                            "text-xs uppercase mb-1",
                            isToday && !isSelected && "text-orange-600 font-bold",
                            isSelected && "text-orange-600 font-bold"
                        )}>
                            {format(day, "EEE")}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-light">
                                {formatDuration(totalSeconds)}
                            </span>
                        </div>
                    </Link>
                )
            })}
            <div className="flex flex-col items-center justify-center min-w-[100px] flex-1 py-3 px-2 text-sm font-medium border-b-2 border-transparent -mb-px text-muted-foreground bg-muted/5">
                <span className="text-xs uppercase mb-1">Total</span>
                <span className="text-xl font-bold text-foreground">
                    {formatDuration(weeklyTotal)}
                </span>
            </div>
        </div>
    )
}

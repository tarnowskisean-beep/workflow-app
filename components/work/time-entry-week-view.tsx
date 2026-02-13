"use client"

import { format, isSameDay, startOfWeek, addDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { TimeEntryList } from "./time-entry-list"
import { cn } from "@/lib/utils"
import { Play } from "lucide-react"

interface TimeEntryWeekViewProps {
    entries: any[]
    onEdit: (entry: any) => void
    onStart?: (entry: any) => void
    date: Date
}

export function TimeEntryWeekView({ entries, onEdit, onStart, date }: TimeEntryWeekViewProps) {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 })
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

    // Calculate weekly total
    const weeklyTotal = entries.reduce((acc, e) => acc + e.durationSeconds, 0)

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between bg-muted/20 p-4 rounded-lg border">
                <div>
                    <h3 className="font-semibold text-lg">Weekly Summary</h3>
                    <p className="text-sm text-muted-foreground">
                        {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold block">
                        {Math.floor(weeklyTotal / 3600)}:{Math.floor((weeklyTotal % 3600) / 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Hours</span>
                </div>
            </div>

            <div className="space-y-6">
                {days.map(day => {
                    const dayEntries = entries.filter(e => isSameDay(new Date(e.startedAt), day))
                    const dayTotal = dayEntries.reduce((acc, e) => acc + e.durationSeconds, 0)
                    const isToday = isSameDay(day, new Date())

                    if (dayEntries.length === 0) return null // Optional: hide empty days or show them as empty

                    return (
                        <div key={day.toISOString()} className={cn("rounded-lg border bg-card", isToday && "border-blue-200 shadow-sm")}>
                            <div className={cn("px-4 py-3 border-b flex justify-between items-center bg-muted/5", isToday && "bg-blue-50/30")}>
                                <h4 className={cn("font-medium", isToday && "text-blue-700")}>
                                    {format(day, "EEEE, MMM d")}
                                </h4>
                                <span className="font-mono text-sm font-medium">
                                    {Math.floor(dayTotal / 3600)}:{Math.floor((dayTotal % 3600) / 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                            <div className="divide-y">
                                {dayEntries.map(entry => (
                                    <div
                                        key={entry.id}
                                        onClick={() => onEdit(entry)}
                                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer group transition-colors"
                                    >
                                        <div className="min-w-0 flex-1 pr-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm truncate">
                                                    {entry.project?.name || "No Project"}
                                                </span>
                                                {entry.workItem && (
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        • {entry.workItem.title}
                                                    </span>
                                                )}
                                            </div>
                                            {entry.notes && (
                                                <p className="text-xs text-muted-foreground truncate opacity-80 mt-0.5">
                                                    {entry.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-mono text-sm">
                                                {Math.floor(entry.durationSeconds / 3600)}:{Math.floor((entry.durationSeconds % 3600) / 60).toString().padStart(2, '0')}
                                            </div>
                                            {/* Start button for week view */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (onStart) onStart(entry)
                                                }}
                                                className="h-8 w-8 p-0 sm:w-auto sm:px-3 sm:gap-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                                            >
                                                <Play className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Start</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {entries.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No time entries found for this week.
                    </div>
                )}
            </div>
        </div>
    )
}


"use client"

import { useState } from "react"
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    isToday
} from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TaskDetailSheet } from "./task-detail-sheet"
import { User } from "@prisma/client"

interface WorkCalendarProps {
    items: any[]
    users: Partial<User>[]
    currentUserId?: string
    currentUserRole?: string
}

type ViewMode = "month" | "week"

export function WorkCalendar({ items, users, currentUserId, currentUserRole }: WorkCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<ViewMode>("month")
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Navigation
    const next = () => {
        if (view === "month") setCurrentDate(addMonths(currentDate, 1))
        else setCurrentDate(addWeeks(currentDate, 1))
    }

    const prev = () => {
        if (view === "month") setCurrentDate(subMonths(currentDate, 1))
        else setCurrentDate(subWeeks(currentDate, 1))
    }

    const today = () => setCurrentDate(new Date())

    // Grid Generation
    const days = view === "month"
        ? eachDayOfInterval({
            start: startOfWeek(startOfMonth(currentDate)),
            end: endOfWeek(endOfMonth(currentDate))
        })
        : eachDayOfInterval({
            start: startOfWeek(currentDate),
            end: endOfWeek(currentDate)
        })

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7))
    }

    // Task placement
    const getTasksForDay = (date: Date) => {
        return items.filter(item => {
            if (!item.dueDate) return false
            return isSameDay(new Date(item.dueDate), date)
        })
    }

    return (
        <div className="space-y-4">
            {/* Header / Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={today}>
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={next}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold ml-2 min-w-[140px]">
                        {format(currentDate, view === "month" ? "MMMM yyyy" : "'Week of' MMM d")}
                    </h2>
                </div>

                <div className="flex items-center border rounded-lg p-1 bg-muted/20">
                    <Button
                        variant={view === "month" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setView("month")}
                        className="text-xs"
                    >
                        Month
                    </Button>
                    <Button
                        variant={view === "week" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setView("week")}
                        className="text-xs"
                    >
                        Week
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-border rounded-xl overflow-hidden shadow-sm border">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-muted/40 gap-px border-b">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-widest bg-background">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-px bg-border">
                    {weeks.map((week) => (
                        week.map((day, dIndex) => {
                            const dayTasks = getTasksForDay(day)
                            const isCurrentMonth = isSameMonth(day, currentDate)
                            const isTodayDate = isToday(day)

                            return (
                                <div
                                    key={dIndex}
                                    className={cn(
                                        "min-h-[140px] p-2 transition-colors bg-background group relative flex flex-col gap-1",
                                        !isCurrentMonth && view === "month" && "bg-muted/5 text-muted-foreground/50",
                                        isTodayDate && "bg-blue-50/10"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn(
                                            "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-all",
                                            isTodayDate
                                                ? "bg-primary text-primary-foreground shadow-sm scale-110"
                                                : "text-muted-foreground group-hover:text-foreground group-hover:bg-muted/50"
                                        )}>
                                            {format(day, "d")}
                                        </span>
                                    </div>

                                    <div className="space-y-1 overflow-y-auto max-h-[110px] no-scrollbar">
                                        {dayTasks.map(task => (
                                            <button
                                                key={task.id}
                                                onClick={() => {
                                                    setSelectedTask(task)
                                                    setIsSheetOpen(true)
                                                }}
                                                className={cn(
                                                    "w-full text-left text-[11px] px-2 py-1.5 rounded-[6px] border flex items-start gap-2 transition-all hover:shadow-sm hover:z-10 relative group/task",
                                                    task.status === "DONE"
                                                        ? "bg-slate-50 text-muted-foreground opacity-60 line-through border-transparent"
                                                        : "bg-white border-border/60 hover:border-primary/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                                )}
                                            >
                                                <div className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", getPriorityDotColor(task.priority))} />
                                                <span className="truncate font-medium leading-tight text-slate-700 group-hover/task:text-slate-900">{task.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    ))}
                </div>
            </div>

            <TaskDetailSheet
                task={selectedTask}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                users={users}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
            />
        </div>
    )
}

function getPriorityDotColor(priority: string) {
    switch (priority) {
        case "P0": return "bg-red-500"
        case "P1": return "bg-orange-500"
        case "P2": return "bg-blue-500"
        default: return "bg-slate-300"
    }
}
function getPriorityColor(priority: string) {
    // Legacy function, kept just in case but likely unused now
    return ""
}

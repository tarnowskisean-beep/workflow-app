"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon } from "lucide-react"
import { addDays, format, startOfWeek, endOfWeek } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function ReportFilters({ projects, users, tasks }: { projects: any[], users: any[], tasks: string[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : startOfWeek(new Date())
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : endOfWeek(new Date())

    const [date, setDate] = React.useState<DateRange | undefined>({
        from,
        to,
    })

    const projectId = searchParams.get("projectId") || "all"
    const userId = searchParams.get("userId") || "all"
    const taskId = searchParams.get("taskId") || "all"

    const updateParams = (newParams: Record<string, string>) => {
        const params = new URLSearchParams(searchParams)
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) params.set(key, value)
            else params.delete(key)
        })
        router.push(`?${params.toString()}`)
    }

    const handleDateSelect = (range: DateRange | undefined) => {
        setDate(range)
        if (range?.from && range?.to) {
            updateParams({
                from: format(range.from, "yyyy-MM-dd"),
                to: format(range.to, "yyyy-MM-dd")
            })
        }
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
            <div className="grid gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[260px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleDateSelect}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <Select value={projectId} onValueChange={(val) => updateParams({ projectId: val })}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={userId} onValueChange={(val) => updateParams({ userId: val })}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={taskId} onValueChange={(val) => updateParams({ taskId: val })}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Tasks" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    {tasks.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

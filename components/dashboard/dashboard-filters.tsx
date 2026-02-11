"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { DatePickerWithRange } from "./date-range-picker"
import { startOfWeek, endOfWeek, format, parseISO } from "date-fns"
import { DateRange } from "react-day-picker"
import { useEffect, useState } from "react"

interface DashboardFiltersProps {
    projects: { id: string; name: string }[]
    users: { id: string; name: string | null }[]
}

export function DashboardFilters({ projects, users }: DashboardFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentProjectId = searchParams.get("projectId") || "all"
    const currentUserId = searchParams.get("userId") || "all"

    // Date Params
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    // Default Date Range (Current Week: Sun - Sat)
    const [date, setDate] = useState<DateRange | undefined>(() => {
        if (fromParam && toParam) {
            return {
                from: parseISO(fromParam),
                to: parseISO(toParam)
            }
        }
        // Default
        const today = new Date()
        return {
            from: startOfWeek(today),
            to: endOfWeek(today)
        }
    })


    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== "all") {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/dashboard?${params.toString()}`)
    }

    // Effect to update URL when date changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (date?.from) {
            params.set("from", format(date.from, 'yyyy-MM-dd'))
        } else {
            params.delete("from")
        }

        if (date?.to) {
            params.set("to", format(date.to, 'yyyy-MM-dd'))
        } else {
            params.delete("to")
        }

        // Only push if changed
        const currentFrom = searchParams.get("from")
        const currentTo = searchParams.get("to")
        const newFrom = date?.from ? format(date.from, 'yyyy-MM-dd') : null
        const newTo = date?.to ? format(date.to, 'yyyy-MM-dd') : null

        if (currentFrom !== newFrom || currentTo !== newTo) {
            router.push(`/dashboard?${params.toString()}`)
        }

    }, [date, router, searchParams])


    const clearFilters = () => {
        router.push("/dashboard")
        // Reset local date state to default
        const today = new Date()
        setDate({
            from: startOfWeek(today),
            to: endOfWeek(today)
        })
    }

    const hasFilters = currentProjectId !== "all" || currentUserId !== "all" || (fromParam && toParam)

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Dashboard:</span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <DatePickerWithRange date={date} setDate={setDate} />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={currentProjectId} onValueChange={(val) => updateFilter("projectId", val)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={currentUserId} onValueChange={(val) => updateFilter("userId", val)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name || "Unknown User"}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground hover:text-foreground ml-auto sm:ml-0">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    )
}

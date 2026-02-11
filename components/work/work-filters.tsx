"use client"

import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Filter, LayoutGrid, List, Search, User as UserIcon, Briefcase, Flag, CheckCircle2 } from "lucide-react"

type FilterProps = {
    projects: { id: string, name: string }[]
    users: { id: string, name: string | null }[]
}

export function WorkFilters({ projects, users }: FilterProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== "all") {
            params.set(key, value)
        } else {
            params.delete(key)
        }

        // If setting assignee filter (specific or all), clear 'view=mine' to avoid confusion/conflict
        if (key === 'assigneeId') {
            params.delete('view')
        }

        // If toggling 'view=mine', clear specific assignee filter
        if (key === 'view' && value === 'mine') {
            params.delete('assigneeId')
        }

        router.replace(`/work?${params.toString()}`, { scroll: false })
    }

    const currentView = searchParams.get("display") || "list"
    const currentPeriod = searchParams.get("period") || "all"

    return (
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-muted/30 p-1 rounded-lg border">
            {/* View Switcher - Segmented Control Style */}
            <Tabs
                value={currentView}
                onValueChange={(val) => updateFilter("display", val)}
                className="w-auto"
            >
                <TabsList className="h-8">
                    <TabsTrigger value="list" className="text-xs px-3">
                        <List className="mr-2 h-3.5 w-3.5" />
                        List
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="text-xs px-3">
                        <Calendar className="mr-2 h-3.5 w-3.5" />
                        Calendar
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="h-5 w-px bg-border hidden sm:block mx-1" />

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                {/* Timeframe Filter (Only for List) */}
                {currentView === "list" && (
                    <Select
                        value={currentPeriod}
                        onValueChange={(val) => updateFilter("period", val)}
                    >
                        <SelectTrigger className="h-8 w-[160px] text-xs bg-background border-dashed hover:border-solid hover:bg-accent/50 transition-colors">
                            <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="daily">Due Today</SelectItem>
                            <SelectItem value="weekly">Due This Week</SelectItem>
                            <SelectItem value="monthly">Due This Month</SelectItem>
                            <SelectItem value="overdue" className="text-red-500">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {/* Project Filter */}
                <Select
                    value={searchParams.get("projectId") || "all"}
                    onValueChange={(val) => updateFilter("projectId", val)}
                >
                    <SelectTrigger className="h-8 w-[180px] text-xs bg-background border-dashed hover:border-solid hover:bg-accent/50 transition-colors">
                        <Briefcase className="mr-2 h-3.5 w-3.5 opacity-50" />
                        <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                    value={searchParams.get("status") || "all"}
                    onValueChange={(val) => updateFilter("status", val)}
                >
                    <SelectTrigger className="h-8 w-[140px] text-xs bg-background border-dashed hover:border-solid hover:bg-accent/50 transition-colors">
                        <CheckCircle2 className="mr-2 h-3.5 w-3.5 opacity-50" />
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="DONE">Closed</SelectItem>
                    </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select
                    value={searchParams.get("priority") || "all"}
                    onValueChange={(val) => updateFilter("priority", val)}
                >
                    <SelectTrigger className="h-8 w-[160px] text-xs bg-background border-dashed hover:border-solid hover:bg-accent/50 transition-colors">
                        <Flag className="mr-2 h-3.5 w-3.5 opacity-50" />
                        <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="P0">P0 (Critical)</SelectItem>
                        <SelectItem value="P1">P1 (High)</SelectItem>
                        <SelectItem value="P2">P2 (Normal)</SelectItem>
                        <SelectItem value="P3">P3 (Low)</SelectItem>
                    </SelectContent>
                </Select>

                {/* Assignee Filter */}
                <Select
                    value={searchParams.get("assigneeId") || "all"}
                    onValueChange={(val) => updateFilter("assigneeId", val)}
                >
                    <SelectTrigger className="h-8 w-[180px] text-xs bg-background border-dashed hover:border-solid hover:bg-accent/50 transition-colors">
                        <UserIcon className="mr-2 h-3.5 w-3.5 opacity-50" />
                        <SelectValue placeholder="All Assignees" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name || "Unknown"}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>


            </div>
        </div >
    )
}

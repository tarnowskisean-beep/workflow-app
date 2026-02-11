"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

interface Project {
    id: string
    name: string
    code: string
}

interface User {
    id: string
    name: string | null
    email: string
}

interface FileFiltersProps {
    projects: Project[]
    users: User[]
    taskTypes: string[]
}

export function FileFilters({ projects, users, taskTypes }: FileFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentProjectId = searchParams.get("projectId") || "all"
    const currentUserId = searchParams.get("userId") || "all"
    const currentTaskType = searchParams.get("taskType") || "all"

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== "all") {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.replace(`/files?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2">
            <Select
                value={currentProjectId}
                onValueChange={(val) => handleFilterChange("projectId", val)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={currentTaskType}
                onValueChange={(val) => handleFilterChange("taskType", val)}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {taskTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                            {t}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={currentUserId}
                onValueChange={(val) => handleFilterChange("userId", val)}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                            {u.name || u.email}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

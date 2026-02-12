"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ClientFilterProps {
    projects: { id: string, name: string, code: string }[]
}

export function ClientFilter({ projects }: ClientFilterProps) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    const currentFilter = searchParams.get("projectId") || "all"

    const handleFilterChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== "all") {
            params.set("projectId", value)
        } else {
            params.delete("projectId")
        }
        replace(`${pathname}?${params.toString()}`)
    }

    return (
        <Select
            value={currentFilter}
            onValueChange={handleFilterChange}
        >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Client" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                        {project.code} - {project.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

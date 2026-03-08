import { useRouter, useSearchParams } from "next/navigation"

export function useFilters(basePath: string) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())

        // Handle value removal (null, empty string, or explicit "all" keyword)
        if (!value || value === "all") {
            params.delete(key)
        } else {
            params.set(key, value)
        }

        // Logic specifically for task assignment toggling
        if (key === 'assigneeId') {
            params.delete('view')
        }

        if (key === 'view' && value === 'mine') {
            params.delete('assigneeId')
        }

        router.replace(`${basePath}?${params.toString()}`, { scroll: false })
    }

    return {
        searchParams,
        updateFilter
    }
}

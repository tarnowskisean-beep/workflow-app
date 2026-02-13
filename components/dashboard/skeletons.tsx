
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardStatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
        </div>
    )
}

export function DashboardChartsSkeleton() {
    return <Skeleton className="h-[400px] w-full rounded-xl" />
}

export function DashboardActivitySkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-4 h-[300px] rounded-xl" />
            <Skeleton className="col-span-3 h-[300px] rounded-xl" />
        </div>
    )
}

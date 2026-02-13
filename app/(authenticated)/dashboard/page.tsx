
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { TimeLogDialogWrapper } from "@/components/work/time-log-dialog-wrapper"
import { AddTaskDialog } from "@/components/work/add-task-dialog"
import { formatLocalDate } from "@/lib/date-utils"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardChartsWrapper } from "@/components/dashboard/dashboard-charts-wrapper"
import { DashboardActivity } from "@/components/dashboard/dashboard-activity"
import { Suspense } from "react"
import { DashboardStatsSkeleton, DashboardChartsSkeleton, DashboardActivitySkeleton } from "@/components/dashboard/skeletons"
import { TASK_STATUS } from "@/lib/constants"

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ projectId?: string, userId?: string, from?: string, to?: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return null

    const { projectId, userId, from, to } = await searchParams

    const [allProjects, allUsers] = await Promise.all([
        prisma.project.findMany({ select: { id: true, name: true, allowedTaskTypes: true }, orderBy: { name: 'asc' } }),
        prisma.user.findMany({ select: { id: true, name: true, avatarUrl: true }, orderBy: { name: 'asc' } }) // Ensure avatarUrl for assignees
    ])

    // Tasks for Time Logging Dropdown (Active tasks for user) - Lightweight enough to keep?
    const userActiveTasks = await prisma.workItem.findMany({
        where: {
            status: { not: TASK_STATUS.DONE },
            OR: [
                { assigneeId: session.user.id },
                { assigneeId: null }
            ]
        },
        select: { id: true, title: true, projectId: true, project: { select: { name: true } } }
    })

    const taskOptions = userActiveTasks.map(t => ({
        id: t.id,
        title: t.title,
        projectId: t.projectId,
        projectName: t.project?.name
    }))

    // Dynamic Title
    let viewTitle = "My Insights"
    if (userId && userId !== 'all') {
        const u = allUsers.find(u => u.id === userId)
        viewTitle = u ? `${u.name}'s Insights` : "User Insights"
    } else if (projectId && projectId !== 'all') {
        const p = allProjects.find(p => p.id === projectId)
        viewTitle = p ? `${p.name} Overview` : "Project Overview"
    }

    // Construct Base Links with Filters (passed to components if needed, but components handle their own links mostly)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{viewTitle}</h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of activity and performance.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <TimeLogDialogWrapper tasks={taskOptions} projects={allProjects} date={formatLocalDate(new Date())} />
                    <AddTaskDialog projects={allProjects} users={allUsers} />
                </div>
            </div>

            <DashboardFilters projects={allProjects} users={allUsers} />

            <Suspense fallback={<DashboardStatsSkeleton />}>
                <DashboardStats projectId={projectId} userId={userId} from={from} to={to} />
            </Suspense>

            <Suspense fallback={<DashboardChartsSkeleton />}>
                <DashboardChartsWrapper projectId={projectId} userId={userId} from={from} to={to} />
            </Suspense>

            <Suspense fallback={<DashboardActivitySkeleton />}>
                <DashboardActivity projectId={projectId} userId={userId} />
            </Suspense>
        </div>
    )
}

import { prisma } from "@/lib/prisma"
import { StatsCard } from "@/components/dashboard/stats-card"
import { CheckSquare, Clock, AlertCircle } from "lucide-react"
import { startOfDay, startOfWeek, endOfWeek, parseISO } from "date-fns"
import { auth } from "@/auth"
import { TASK_STATUS } from "@/lib/constants"

interface DashboardStatsProps {
    projectId?: string
    userId?: string
    from?: string
    to?: string
}

export async function DashboardStats({ projectId, userId, from, to }: DashboardStatsProps) {
    const session = await auth()
    if (!session?.user?.id) return null

    // Date Range Logic
    let startDate: Date
    let endDate: Date

    if (from && to) {
        startDate = startOfDay(parseISO(from))
        const parsedTo = parseISO(to)
        parsedTo.setHours(23, 59, 59, 999)
        endDate = parsedTo
    } else {
        const today = new Date()
        startDate = startOfWeek(today)
        endDate = endOfWeek(today)
    }

    // Determine Logic
    const taskWhere: any = { status: { not: TASK_STATUS.ARCHIVED } }
    const timeWhere: any = {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    }

    if (projectId && projectId !== 'all') {
        taskWhere.projectId = projectId
        timeWhere.projectId = projectId
    }

    if (userId && userId !== 'all') {
        taskWhere.assigneeId = userId
        timeWhere.userId = userId
    } else if (!userId && !projectId) {
        taskWhere.assigneeId = session.user.id
        timeWhere.userId = session.user.id
    }

    const [openTasks, doneTasks, timeEntries, overdueCount] = await Promise.all([
        prisma.workItem.count({ where: { ...taskWhere, status: TASK_STATUS.OPEN } }),
        prisma.workItem.count({ where: { ...taskWhere, status: TASK_STATUS.DONE } }),
        prisma.timeEntry.findMany({
            where: timeWhere,
            select: { durationSeconds: true }
        }),
        prisma.workItem.count({
            where: {
                ...taskWhere,
                status: { not: TASK_STATUS.DONE },
                dueDate: { lt: new Date() }
            }
        })
    ])

    const totalSeconds = timeEntries.reduce((acc, curr) => acc + curr.durationSeconds, 0)
    const totalHours = (totalSeconds / 3600).toFixed(1)

    // Links
    const baseParams = new URLSearchParams()
    if (projectId && projectId !== 'all') baseParams.set('projectId', projectId)
    if (userId && userId !== 'all') baseParams.set('assigneeId', userId)

    const overdueHref = `/work?period=overdue&${baseParams.toString()}`
    const openHref = `/work?status=${TASK_STATUS.OPEN}&${baseParams.toString()}`
    const closedHref = `/work?status=${TASK_STATUS.DONE}&${baseParams.toString()}`

    const timeParams = new URLSearchParams()
    if (projectId && projectId !== 'all') timeParams.set('projectId', projectId)
    if (userId && userId !== 'all') timeParams.set('userId', userId)
    const timeHref = `/time?${timeParams.toString()}`

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overdueCount > 0 && (
                <StatsCard
                    title="Overdue Tasks"
                    value={overdueCount}
                    icon={AlertCircle}
                    description="Items past due"
                    href={overdueHref}
                    variant="destructive"
                />
            )}
            <StatsCard
                title="Open Tasks"
                value={openTasks}
                icon={CheckSquare}
                description="Tasks requiring attention"
                href={openHref}
            />
            <StatsCard
                title="Closed Tasks"
                value={doneTasks}
                icon={CheckSquare}
                description="Completed tasks"
                href={closedHref}
            />
            <StatsCard
                title="Time Logged"
                value={`${totalHours}h`}
                icon={Clock}
                description="In selected range"
                href={timeHref}
            />
        </div>
    )
}

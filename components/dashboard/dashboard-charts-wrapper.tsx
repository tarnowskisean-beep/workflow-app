
import { prisma } from "@/lib/prisma"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { startOfDay, startOfWeek, endOfWeek, parseISO, eachDayOfInterval, format } from "date-fns"
import { auth } from "@/auth"
import { TASK_STATUS } from "@/lib/constants"
import { DATE_FORMATS } from "@/lib/format"

interface DashboardChartsWrapperProps {
    projectId?: string
    userId?: string
    from?: string
    to?: string
}

export async function DashboardChartsWrapper({ projectId, userId, from, to }: DashboardChartsWrapperProps) {
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

    try {
        const [openTasks, inProgressTasks, doneTasks, timeEntries] = await Promise.all([
            prisma.workItem.count({ where: { ...taskWhere, status: TASK_STATUS.OPEN } }),
            prisma.workItem.count({ where: { ...taskWhere, status: TASK_STATUS.IN_PROGRESS } }),
            prisma.workItem.count({ where: { ...taskWhere, status: TASK_STATUS.DONE } }),
            prisma.timeEntry.findMany({
                where: timeWhere,
                orderBy: { createdAt: 'asc' },
                select: { createdAt: true, durationSeconds: true }
            }),
        ])

        // 1. Task Distribution
        const taskStatusData = [
            { name: 'Open', value: openTasks + inProgressTasks },
            { name: 'Done', value: doneTasks },
        ]

        // 2. Time Trend (Group by Interval Day)
        const daysInterval = eachDayOfInterval({ start: startDate, end: endDate })

        const timeLogData = daysInterval.map(day => {
            const dateStr = format(day, DATE_FORMATS.SHORT_DISPLAY)
            // Sum duration for this day
            const dailySeconds = timeEntries
                .filter(e => format(e.createdAt, DATE_FORMATS.SHORT_DISPLAY) === dateStr)
                .reduce((acc, e) => acc + e.durationSeconds, 0)

            return {
                date: dateStr,
                fullDate: format(day, DATE_FORMATS.ISO),
                hours: parseFloat((dailySeconds / 3600).toFixed(1))
            }
        })

        return <DashboardCharts taskStatusData={taskStatusData} timeLogData={timeLogData} />
    } catch (error: any) {
        console.error("DashboardChartsWrapper Error:", error)
        return (
            <div className="p-4 border border-red-200 rounded bg-red-50 text-red-800 text-sm">
                <p className="font-bold">Error loading charts:</p>
                <pre>{error.message}</pre>
                <pre>{JSON.stringify(error, Object.getOwnPropertyNames(error))}</pre>
            </div>
        )
    }
}

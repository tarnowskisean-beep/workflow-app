import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { QuickActions } from "@/components/dashboard/quick-actions" // Consider removing if replaced by inline buttons or keep?
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { CheckSquare, Clock, FileText, AlertCircle, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { startOfDay, subDays, startOfWeek, endOfWeek, format, eachDayOfInterval, parseISO } from "date-fns"
import { TimeLogDialogWrapper } from "@/components/work/time-log-dialog-wrapper"
import { AddTaskDialog } from "@/components/work/add-task-dialog"
import { Button } from "@/components/ui/button"

import Link from "next/link"
import { formatLocalDate } from "@/lib/date-utils"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ projectId?: string, userId?: string, from?: string, to?: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return null

    const { projectId, userId, from, to } = await searchParams

    // Date Range Logic
    let startDate: Date
    let endDate: Date

    if (from && to) {
        startDate = startOfDay(parseISO(from))
        const parsedTo = parseISO(to)
        parsedTo.setHours(23, 59, 59, 999)
        endDate = parsedTo
    } else {
        // Default: Current Week (Sunday to Saturday)
        const today = new Date()
        startDate = startOfWeek(today)
        endDate = endOfWeek(today)
    }

    const [allProjects, allUsers] = await Promise.all([
        prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        prisma.user.findMany({ select: { id: true, name: true, avatarUrl: true }, orderBy: { name: 'asc' } }) // Ensure avatarUrl for assignees
    ])

    // Construct Where Clauses
    const taskWhere: any = { status: { not: "ARCHIVED" } }
    const timeWhere: any = {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    }

    // Filter Logic
    if (projectId && projectId !== 'all') {
        taskWhere.projectId = projectId
        timeWhere.projectId = projectId
    }

    if (userId && userId !== 'all') {
        taskWhere.assigneeId = userId
        timeWhere.userId = userId
    } else if (!userId && !projectId) {
        // Default View: My Data
        taskWhere.assigneeId = session.user.id
        timeWhere.userId = session.user.id
    }

    // Parallel Data Fetching
    const [
        totalTasks,
        openTasks,
        inProgressTasks,
        doneTasks,
        timeEntries,
        outstandingTasks,
        completedTasks,
        overdueItems,
        // Tasks for Time Logging Dropdown (Active tasks for user)
        userActiveTasks
    ] = await Promise.all([
        prisma.workItem.count({ where: taskWhere }),
        prisma.workItem.count({ where: { ...taskWhere, status: "OPEN" } }),
        prisma.workItem.count({ where: { ...taskWhere, status: "IN_PROGRESS" } }),
        prisma.workItem.count({ where: { ...taskWhere, status: "DONE" } }),
        prisma.timeEntry.findMany({
            where: timeWhere,
            orderBy: { createdAt: 'asc' }
        }),
        prisma.workItem.findMany({
            where: { ...taskWhere, status: { not: "DONE" } },
            take: 5,
            orderBy: [
                { priority: 'desc' }, // High priority first
                { dueDate: 'asc' }    // Due soonest first
            ],
            include: { project: true }
        }),
        prisma.workItem.findMany({
            where: { ...taskWhere, status: "DONE" },
            take: 5,
            orderBy: { updatedAt: "desc" },
            include: { project: true }
        }),
        // Fetch actual overdue items
        prisma.workItem.findMany({
            where: {
                ...taskWhere,
                status: { not: "DONE" },
                dueDate: { lt: new Date() }
            },
            take: 5,
            orderBy: { dueDate: 'asc' },
            include: { project: true }
        }),
        prisma.workItem.findMany({
            where: {
                status: { not: "DONE" },
                OR: [
                    { assigneeId: session.user.id },
                    { assigneeId: null }
                ]
            },
            select: { id: true, title: true, projectId: true, project: { select: { name: true } } }
        })
    ])

    // Transform tasks for the dialog
    const taskOptions = userActiveTasks.map(t => ({
        id: t.id,
        title: t.title,
        projectId: t.projectId,
        projectName: t.project?.name
    }))


    // Process Data for Charts

    // 1. Task Distribution
    const taskStatusData = [
        { name: 'Open', value: openTasks },
        { name: 'In Progress', value: inProgressTasks },
        { name: 'Done', value: doneTasks },
    ]

    // 2. Time Trend (Group by Interval Day)
    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate })

    const timeLogData = daysInterval.map(day => {
        const dateStr = format(day, 'MMM dd')
        // Sum duration for this day
        const dailySeconds = timeEntries
            .filter(e => format(e.createdAt, 'MMM dd') === dateStr)
            .reduce((acc, e) => acc + e.durationSeconds, 0)

        return {
            date: dateStr,
            hours: parseFloat((dailySeconds / 3600).toFixed(1))
        }
    })

    const totalSeconds = timeEntries.reduce((acc, curr) => acc + curr.durationSeconds, 0)
    const totalHours = (totalSeconds / 3600).toFixed(1)


    // Dynamic Title
    let viewTitle = "My Insights"
    if (userId && userId !== 'all') {
        const u = allUsers.find(u => u.id === userId)
        viewTitle = u ? `${u.name}'s Insights` : "User Insights"
    } else if (projectId && projectId !== 'all') {
        const p = allProjects.find(p => p.id === projectId)
        viewTitle = p ? `${p.name} Overview` : "Project Overview"
    }

    // Construct Base Links with Filters
    const baseParams = new URLSearchParams()
    if (projectId && projectId !== 'all') baseParams.set('projectId', projectId)
    if (userId && userId !== 'all') baseParams.set('assigneeId', userId) // Mapping userId to assigneeId for Work page

    const overdueHref = `/work?period=overdue&${baseParams.toString()}`
    const openHref = `/work?status=OPEN&${baseParams.toString()}`
    const closedHref = `/work?status=DONE&${baseParams.toString()}`

    // Time page might use different params, but let's pass them for now if they match
    const timeParams = new URLSearchParams()
    if (projectId && projectId !== 'all') timeParams.set('projectId', projectId)
    if (userId && userId !== 'all') timeParams.set('userId', userId)
    const timeHref = `/time?${timeParams.toString()}`

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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {overdueItems.length > 0 && (
                    <StatsCard
                        title="Overdue Tasks"
                        value={overdueItems.length}
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
                {overdueItems.length === 0 && ( // Show Total Assigned if no overdue card takes the slot? Or just add it anyway? Let's add it. 
                    <StatsCard
                        title="Total Assigned"
                        value={totalTasks}
                        icon={AlertCircle}
                        description="All time tasks"
                        href="/work"
                    />
                )}
            </div>

            <DashboardCharts taskStatusData={taskStatusData} timeLogData={timeLogData} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    {/* Overdue Tasks (Replaces Activity Feed) */}
                    <Card className="h-full border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-red-700">Overdue Tasks</CardTitle>
                            <CardDescription className="text-red-500">Items past their due date.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {overdueItems.length === 0 ? (
                                    <p className="text-sm text-red-400 text-center py-4">No overdue tasks! 🎉</p>
                                ) : (
                                    overdueItems.map(task => (
                                        <Link href={`/work?taskId=${task.id}`} key={task.id} className="group block">
                                            <div className="flex items-center justify-between border-b border-red-100 pb-2 last:border-0 last:pb-0 group-hover:bg-red-100/50 rounded px-1 -mx-1 transition-colors">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none truncate max-w-[200px] text-red-900">{task.title}</p>
                                                    <p className="text-xs text-red-600">{task.project?.name} • Due {format(task.dueDate!, 'MMM dd')}</p>
                                                </div>
                                                <StatusBadge status={task.status} />
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="col-span-3 space-y-4">
                    {/* Outstanding Tasks */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Outstanding Tasks</CardTitle>
                            <CardDescription>High priority & upcoming.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {outstandingTasks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No outstanding tasks.</p>
                                ) : (
                                    outstandingTasks.map(task => (
                                        <Link href={`/work?taskId=${task.id}`} key={task.id} className="group block">
                                            <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 group-hover:bg-muted/50 rounded px-1 -mx-1 transition-colors">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none truncate max-w-[200px]">{task.title}</p>
                                                    <p className="text-xs text-muted-foreground">{task.project?.name} • {task.priority}</p>
                                                </div>
                                                <StatusBadge status={task.status} />
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recently Completed */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recently Completed</CardTitle>
                            <CardDescription>Finished in the last few days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {completedTasks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No recently completed tasks.</p>
                                ) : (
                                    completedTasks.map(task => (
                                        <Link href={`/work?taskId=${task.id}`} key={task.id} className="group block">
                                            <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 group-hover:bg-muted/50 rounded px-1 -mx-1 transition-colors">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none truncate max-w-[200px] text-muted-foreground decoration-line-through">{task.title}</p>
                                                    <p className="text-xs text-muted-foreground">{task.project?.name}</p>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(task.updatedAt, 'MMM dd')}
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* <QuickActions /> Removed as integrated into header */}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`text-[10px] px-2 py-1 rounded-full border ${status === 'DONE' ? 'bg-green-50 text-green-700 border-green-200' :
            status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
            {status.replace('_', ' ')}
        </span>
    )
}


import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { format } from "date-fns"
import { StatusBadge } from "./status-badge"
import { auth } from "@/auth"
import { TASK_STATUS } from "@/lib/constants"

interface DashboardActivityProps {
    projectId?: string
    userId?: string
}

export async function DashboardActivity({ projectId, userId }: DashboardActivityProps) {
    const session = await auth()
    if (!session?.user?.id) return null

    const taskWhere: any = { status: { not: TASK_STATUS.ARCHIVED } }

    if (projectId && projectId !== 'all') {
        taskWhere.projectId = projectId
    }

    if (userId && userId !== 'all') {
        taskWhere.assigneeId = userId
    } else if (!userId && !projectId) {
        taskWhere.assigneeId = session.user.id
    }

    try {
        const [outstandingTasks, completedTasks, overdueItems] = await Promise.all([
            prisma.workItem.findMany({
                where: { ...taskWhere, status: { not: TASK_STATUS.DONE } },
                take: 5,
                orderBy: [
                    { priority: 'desc' },
                    { dueDate: 'asc' }
                ],
                include: { project: true }
            }),
            prisma.workItem.findMany({
                where: { ...taskWhere, status: TASK_STATUS.DONE },
                take: 5,
                orderBy: { updatedAt: "desc" },
                include: { project: true }
            }),
            prisma.workItem.findMany({
                where: {
                    ...taskWhere,
                    status: { not: TASK_STATUS.DONE },
                    dueDate: { lt: new Date() }
                },
                take: 5,
                orderBy: { dueDate: 'asc' },
                include: { project: true }
            }),
        ])

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
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
        )
    } catch (error: any) {
        console.error("DashboardActivity Error:", error)
        return (
            <div className="p-4 border border-red-200 rounded bg-red-50 text-red-800 text-sm">
                <p className="font-bold">Error loading activity:</p>
                <pre>{error.message}</pre>
            </div>
        )
    }
}

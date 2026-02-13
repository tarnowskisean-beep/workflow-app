import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase } from "lucide-react"
import { WorkFilters } from "@/components/work/work-filters"
import { AddTaskDialog } from "@/components/work/add-task-dialog"
import { WorkTaskList } from "@/components/work/work-task-list"
import { WorkCalendar } from "@/components/work/work-calendar"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

export default async function WorkPage({ searchParams }: { searchParams: Promise<{ view?: string, projectId?: string, assigneeId?: string, period?: string, display?: string, status?: string, taskId?: string, priority?: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return null


    const { view, projectId, assigneeId, period, display, status, taskId, priority } = await searchParams
    const showMineOnly = view === "mine"
    const isCalendar = display === "calendar"

    // Construct filter conditions
    const whereClause: any = {
        status: { not: "ARCHIVED" },
    }

    if (status && status !== "all") {
        whereClause.status = status
    }

    if (showMineOnly) {
        whereClause.assigneeId = session.user.id
    } else if (assigneeId && assigneeId !== "all") {
        whereClause.assigneeId = assigneeId
    }

    if (projectId && projectId !== "all") {
        whereClause.projectId = projectId
    }

    if (priority && priority !== "all") {
        whereClause.priority = priority
    }

    // Date Filtering Logic (Only for List View)
    if (!isCalendar && period) {
        const now = new Date()
        switch (period) {
            case "daily":
                whereClause.dueDate = {
                    lte: endOfDay(now)
                }
                break
            case "weekly":
                whereClause.dueDate = {
                    lte: endOfWeek(now, { weekStartsOn: 1 }) // Assuming Monday start
                }
                break
            case "monthly":
                whereClause.dueDate = {
                    lte: endOfMonth(now)
                }
                break
            case "overdue":
                whereClause.dueDate = {
                    lt: now
                }
                break
            // 'all' or undefined does nothing
        }
    }

    // Fetch work items
    const workItems = await prisma.workItem.findMany({
        where: whereClause,
        include: {
            project: true,
            assignee: true
        },
        orderBy: { dueDate: 'asc' } // Sort by due date for time-sensitive views
    })

    // Fetch projects for dropdown
    const projects = await prisma.project.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, allowedTaskTypes: true }
    })

    // Fetch users for dropdown
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, role: true, email: true, avatarUrl: true }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Work Overview</h1>
                    <p className="text-muted-foreground">
                        Master view of all active tasks across the organization.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <WorkFilters projects={projects} users={users} />
                    <AddTaskDialog projects={projects} users={users} />
                </div>
            </div>

            {isCalendar ? (
                <WorkCalendar items={workItems} users={users} currentUserRole={session.user.role} currentUserId={session.user.id} />
            ) : (
                <WorkTaskList initialWorkItems={workItems} users={users} currentUserRole={session.user.role} currentUserId={session.user.id} initialSelectedTaskId={taskId} />
            )}
        </div>
    )
}

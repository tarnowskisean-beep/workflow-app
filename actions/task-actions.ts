"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns"
import { logSecurityEvent } from "@/lib/audit"

// Using a local schema since the one in lib/schemas might be separate
const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.string().default("OPEN"),
    priority: z.string().default("P2"),
    driveLink: z.string().optional().nullable(),
    driveLinkType: z.string().optional().nullable(),
    requiresDocument: z.boolean().default(false),
    dueDate: z.string().optional().nullable().transform(str => str ? new Date(str) : null),
    isRecurring: z.boolean().default(false),
    recurrenceInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).or(z.literal("")).optional().nullable().transform(val => val === "" ? null : val),
    recurrenceDays: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    taskType: z.string().optional().nullable(), // Validated in refine now
    assigneeId: z.string().optional().nullable(),
}).refine(data => {
    if (data.isRecurring && !data.dueDate) {
        return false
    }
    return true
}, {
    message: "Due date is required for recurring tasks",
    path: ["dueDate"]
}).refine(data => {
    // If project is selected, taskType is required (unless project has no types defined, but we assume it does for now)
    if (data.projectId && !data.taskType) {
        return false
    }
    return true
}, {
    message: "Task Type is required for project tasks",
    path: ["taskType"]
})

export async function createTask(formData: FormData) {
    const session = await auth()

    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" }
    }

    const rawData = {
        title: formData.get("title"),
        description: formData.get("description"),
        status: formData.get("status") || "OPEN",
        priority: formData.get("priority") || "P2",
        driveLink: formData.get("driveLink"),
        driveLinkType: formData.get("driveLinkType"),
        requiresDocument: formData.get("requiresDocument") === "on",
        dueDate: formData.get("dueDate"),
        isRecurring: !!formData.get("recurrenceInterval"),
        recurrenceInterval: formData.get("recurrenceInterval") || null,
        recurrenceDays: formData.get("recurrenceDays") || null,
        projectId: formData.get("projectId") === "none" ? null : formData.get("projectId"),
        taskType: formData.get("taskType") === "none" ? null : formData.get("taskType"),
        assigneeId: formData.get("assigneeId") === "me" ? session.user.id : (formData.get("assigneeId") === "none" ? null : formData.get("assigneeId")),
    }

    try {
        const validated = createTaskSchema.parse(rawData)

        // Security / Logic check: If recurring weekly, ensure days are present
        if (validated.isRecurring && validated.recurrenceInterval === "WEEKLY" && !validated.recurrenceDays) {
            return { success: false, message: "Weekly recurrence requires at least one day selected." }
        }

        const task = await prisma.workItem.create({
            data: {
                title: validated.title,
                description: validated.description,
                status: validated.status,
                priority: validated.priority,
                driveLink: validated.driveLink || null,
                driveLinkType: validated.driveLinkType || null,
                requiresDocument: validated.requiresDocument,
                dueDate: validated.dueDate,
                assigneeId: validated.assigneeId || session.user.id, // Default to creator if not specified
                isRecurring: validated.isRecurring,
                recurrenceInterval: validated.isRecurring ? validated.recurrenceInterval : null,
                recurrenceDays: validated.isRecurring ? validated.recurrenceDays : null,
                projectId: validated.projectId || null,
                taskType: validated.taskType || null,
            },
        })

        await logSecurityEvent("TASK_CREATED", "TASK", task.id, { title: task.title, projectId: task.projectId })

        revalidatePath("/work")
        revalidatePath("/dashboard")
        revalidatePath("/clients")
        return { success: true }
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Validation failed:", error.flatten())
            return { success: false, message: "Validation failed. Please check your inputs.", errors: error.flatten().fieldErrors }
        }
        console.error("Failed to create task:", error)
        return { success: false, message: "Failed to create task" }
    }
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, message: "Unauthorized" }

    try {
        const task = await prisma.workItem.findUnique({
            where: { id: taskId },
        })

        if (!task) return { success: false, message: "Task not found" }

        // Logic check: If marking as DONE and requiresDocument is true, must have driveLink
        if (newStatus === "DONE" && task.requiresDocument && !task.driveLink) {
            return {
                success: false,
                message: "Document required to complete this task.",
                requiresDocument: true // Signal to UI to prompt for link
            }
        }

        // Handle Recurrence Logic
        if (newStatus === "DONE" && task.isRecurring && task.recurrenceInterval) {
            const nextDueDate = calculateNextDueDate(new Date(), task.recurrenceInterval, task.recurrenceDays)

            // Spawn next task
            await prisma.workItem.create({
                data: {
                    title: task.title,
                    description: task.description,
                    status: "OPEN",
                    priority: task.priority,
                    projectId: task.projectId,
                    assigneeId: task.assigneeId, // Keep same assignee
                    requiresDocument: task.requiresDocument,
                    isRecurring: true, // Chain continues
                    recurrenceInterval: task.recurrenceInterval,
                    recurrenceDays: task.recurrenceDays,
                    dueDate: nextDueDate,
                    // Link fields are usually cleared for new instance
                }
            })

            // Previous task is done
        }

        await prisma.workItem.update({
            where: { id: taskId },
            data: {
                status: newStatus,
                completedAt: newStatus === "DONE" ? new Date() : null
            }
        })

        revalidatePath("/work")
        revalidatePath("/dashboard")
        return { success: true, message: "Task updated" }
    } catch (error) {
        console.error("Failed to update status:", error)
        return { success: false, message: "Failed to update status" }
    }
}

function calculateNextDueDate(currentDate: Date, interval: string, days?: string | null): Date {
    // Reset time to start of day to avoid drift
    const baseDate = new Date(currentDate)
    baseDate.setHours(0, 0, 0, 0)

    if (interval === "WEEKLY" && days) {
        const validDays = days.split(",").map(d => d.trim()) // ["Mon", "Wed"]
        const dayMap: { [key: string]: number } = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 }
        const targetDays = validDays.map(d => dayMap[d]).sort((a, b) => a - b)

        if (targetDays.length === 0) return addWeeks(baseDate, 1)

        const currentDay = baseDate.getDay() // 0-6

        // Find next day in current week
        const nextDayInWeek = targetDays.find(d => d > currentDay)

        if (nextDayInWeek !== undefined) {
            const daysToAdd = nextDayInWeek - currentDay
            return addDays(baseDate, daysToAdd)
        } else {
            // Wrap to first day of next week
            const firstDayNextWeek = targetDays[0]
            const daysUntilSunday = 7 - currentDay
            return addDays(baseDate, daysUntilSunday + firstDayNextWeek)
        }
    }

    switch (interval) {
        case "DAILY": return addDays(baseDate, 1)
        case "WEEKLY": return addWeeks(baseDate, 1)
        case "MONTHLY": return addMonths(baseDate, 1)
        case "QUARTERLY": return addQuarters(baseDate, 1)
        case "YEARLY": return addYears(baseDate, 1)
        default: return addDays(baseDate, 1)
    }
}

export async function addDocumentLink(taskId: string, link: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, message: "Unauthorized" }

    // Basic URL validation
    const urlResult = z.string().url().safeParse(link)
    if (!urlResult.success) return { success: false, message: "Invalid URL" }

    try {
        await prisma.workItem.update({
            where: { id: taskId },
            data: {
                driveLink: link,
                driveLinkType: 'file' // Defaulting for now
            }
        })
        revalidatePath("/work") // Changed from /tasks to /work
        return { success: true, message: "Link added" }
    } catch (error) {
        console.error("Failed to add link:", error)
        return { success: false, message: "Failed to add link" }
    }
}

export async function getWorkItems(filters?: {
    projectId?: string
    assigneeId?: string // kept for specific filtering, but access control always applies
    status?: string
    search?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return []

    const userId = session.user.id

    // Fetch user role and manager relationship
    // @ts-ignore
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            manager: true,
            directReports: {
                include: {
                    directReports: true // Get second level for Manager -> Senior -> Associate
                }
            }
        }
    })

    if (!user) return []

    // Determine accessible user IDs based on role
    let accessibleUserIds: string[] = [userId] // Always can see own tasks

    // @ts-ignore
    const userWithReports = user as any

    if (user.role === "SENIOR") {
        // Seniors see themselves + direct reports (Associates)
        const reportIds = userWithReports.directReports.map((u: any) => u.id)
        accessibleUserIds = [...accessibleUserIds, ...reportIds]
    } else if (user.role === "MANAGER") {
        // Managers see themselves + direct reports (Seniors) + reports' reports (Associates)
        const directReportIds = userWithReports.directReports.map((u: any) => u.id)
        const secondLevelReportIds = userWithReports.directReports.flatMap((u: any) => u.directReports.map((sub: any) => sub.id))
        accessibleUserIds = [...accessibleUserIds, ...directReportIds, ...secondLevelReportIds]
    } else if (user.role === "ADMIN") {
        // Admin sees all? Or restrict too? 
        // Assuming Admin sees all for now, or just let's stick to strict hierarchy requested.
        // User asked for Manager/Senior/Associate.
        // If Role is ADMIN, let's say they see everything.
        accessibleUserIds = [] // Empty signals "all" logic below
    }
    // ASSOCIATE only sees own tasks (default)

    const whereClause: any = {
        ...(filters?.projectId ? { projectId: filters.projectId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.search ? {
            OR: [
                { title: { contains: filters.search } },
                { description: { contains: filters.search } }
            ]
        } : {}),
    }

    // Apply Access Control
    if (user.role !== "ADMIN") {
        whereClause.assigneeId = { in: accessibleUserIds }
    } else {
        // If filter is specific assignee, respect it. Otherwise show all.
        if (filters?.assigneeId) {
            whereClause.assigneeId = filters.assigneeId
        }
    }

    // Also respect filter if it's stricter than access control
    if (filters?.assigneeId && user.role !== "ADMIN") {
        if (accessibleUserIds.includes(filters.assigneeId)) {
            whereClause.assigneeId = filters.assigneeId
        } else {
            return [] // Trying to view someone out of scope
        }
    }

    try {
        return await prisma.workItem.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' }, // or priority
            include: {
                project: { select: { code: true, name: true } },
                assignee: { select: { name: true, avatarUrl: true } }
            }
        })
    } catch (error) {
        console.error("Failed to get work items:", error)
        return []
    }
}
export async function updateTaskDetails(taskId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, message: "Unauthorized" }

    try {
        const rawData = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            priority: formData.get("priority") as string,
            dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null,
            assigneeId: formData.get("assigneeId") as string || null,
        }

        console.log("SERVER ACTION: updateTaskDetails", { taskId, rawData })

        // Permission Check for Assignee Change
        if (rawData.assigneeId !== undefined && rawData.assigneeId !== null) { // Check if assigneeId is being updated
            // Fetch current task and user details for permission check
            const currentTask = await prisma.workItem.findUnique({
                where: { id: taskId },
                include: { assignee: true }
            })

            const currentUser = await prisma.user.findUnique({
                where: { id: session.user.id }
            })

            if (currentTask && currentUser) {
                // Skip check if assignee hasn't changed
                if (currentTask.assigneeId !== rawData.assigneeId) {
                    const isManagerOrAdmin = currentUser.role === "MANAGER" || currentUser.role === "ADMIN"
                    const isSenior = currentUser.role === "SENIOR"

                    // If current task has an assignee, check their role. If unassigned, any Senior+ can pick it up.
                    const currentAssigneeRole = currentTask.assignee?.role || "ASSOCIATE"

                    // Allow if:
                    // 1. User is Manager or Admin
                    // 2. User is Senior AND (Target is unassigned OR Target is Associate)
                    // 3. User is assigning to themselves? (Self-assignment usually allowed if empty, implementing strict rule for now)

                    const canChange = isManagerOrAdmin || (isSenior && (currentAssigneeRole === "ASSOCIATE" || !currentTask.assigneeId))

                    if (!canChange) {
                        return { success: false, message: "You do not have permission to reassign this task." }
                    }
                }
            }
        }

        await prisma.workItem.update({
            where: { id: taskId },
            data: {
                title: rawData.title,
                description: rawData.description,
                priority: rawData.priority,
                dueDate: rawData.dueDate,
                assigneeId: rawData.assigneeId
            }
        })

        await logSecurityEvent("TASK_UPDATED", "TASK", taskId, { updated: "details" })

        revalidatePath("/work")
        revalidatePath("/dashboard")
        revalidatePath("/projects")
        return { success: true, message: "Task updated" }
    } catch (error) {
        console.error("Failed to update task details:", error)
        return { success: false, message: "Failed to update task" }
    }
}

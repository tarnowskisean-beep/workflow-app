"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { addDays, endOfDay, startOfDay, subDays } from "date-fns"
import { Prisma } from "@prisma/client"
import { z } from "zod"

const ReportParamsSchema = z.object({
    from: z.union([z.date(), z.string()]).transform(d => new Date(d)),
    to: z.union([z.date(), z.string()]).transform(d => new Date(d)),
    projectId: z.string().optional(),
    userId: z.string().optional(),
    taskId: z.string().optional()
});

// Types

// Define the shape of the time entry with included relations for reports
type TimeEntryWithRelations = Prisma.TimeEntryGetPayload<{
    include: {
        project: { select: { id: true, name: true, billableRate: true, managerRate: true, seniorRate: true, associateRate: true, isBillable: true } },
        user: { select: { id: true, name: true, role: true, billableRate: true, avatarUrl: true } },
        workItem: { select: { id: true, title: true } }
    }
}>

export type TaskReportStats = {
    total: number
    open: number
    inProgress: number
    done: number
    overdue: number
    created: number
    completed: number
}

export type TimeReportEntry = {
    date: string
    projectId: string
    projectName: string
    userName?: string
    taskTitle?: string
    description?: string
    hours: number
    billableAmount: number
}

// --- Task Reports ---

export async function getTaskReport(from: Date, to: Date, projectId?: string, userId?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
        throw new Error("Unauthorized: Insufficient permissions")
    }

    const params = ReportParamsSchema.parse({ from, to, projectId, userId });
    const { from: fromDate, to: toDate, projectId: pid, userId: uid } = params;

    const where: Prisma.WorkItemWhereInput = {
        createdAt: {
            gte: startOfDay(fromDate),
            lte: endOfDay(toDate)
        }
    }

    if (pid && pid !== "all") where.projectId = pid
    if (uid && uid !== "all") where.assigneeId = uid

    const created = await prisma.workItem.count({ where })

    const completedWhere: Prisma.WorkItemWhereInput = {
        ...where,
        status: "DONE",
        createdAt: undefined, // Clear creation date filter for completion count? 
        // Logic check: "Completed in range" usually means completedAt in range, not createdAt in range AND status DONE.
        // Original code had `completedAt` in range. 
        completedAt: {
            gte: startOfDay(from),
            lte: endOfDay(to)
        }
    }

    const completed = await prisma.workItem.count({ where: completedWhere })

    const overdueWhere: Prisma.WorkItemWhereInput = {
        status: { not: "DONE" },
        dueDate: { lt: new Date() }
    }
    const overdue = await prisma.workItem.count({
        where: {
            ...(pid && pid !== "all" ? { projectId: pid } : {}),
            ...(uid && uid !== "all" ? { assigneeId: uid } : {}),
            status: { not: "DONE" },
            dueDate: { lt: new Date() }
        }
    })

    return {
        total: created,
        open: created - completed,
        inProgress: 0,
        done: completed,
        created,
        completed,
        overdue
    }
}

// --- Time Reports ---

export async function getTimeReport(from: Date, to: Date, projectId?: string, userId?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
        throw new Error("Unauthorized: Insufficient permissions")
    }

    const params = ReportParamsSchema.parse({ from, to, projectId, userId });
    const { from: fromDate, to: toDate, projectId: pid, userId: uid } = params;

    const where: Prisma.TimeEntryWhereInput = {
        startedAt: {
            gte: startOfDay(fromDate),
            lte: endOfDay(toDate)
        }
    }

    if (pid && pid !== "all") where.projectId = pid
    if (uid && uid !== "all") where.userId = uid

    const entries: TimeEntryWithRelations[] = await prisma.timeEntry.findMany({
        where,
        include: {
            project: { select: { id: true, name: true, billableRate: true, managerRate: true, seniorRate: true, associateRate: true, isBillable: true } },
            user: { select: { id: true, name: true, role: true, billableRate: true, avatarUrl: true } },
            workItem: { select: { id: true, title: true } }
        },
        orderBy: { startedAt: "desc" }
    })

    const grouped: Record<string, TimeReportEntry> = {}
    let totalHours = 0
    let totalBillable = 0

    for (const entry of entries) {
        const dateKey = entry.startedAt.toISOString().split('T')[0]
        const projectKey = entry.projectId || "no-project"
        const key = `${dateKey}-${projectKey}`
        const hours = entry.durationSeconds / 3600

        let rate = 0

        if (entry.isBillable && entry.project) {
            const proj = entry.project
            const user = entry.user
            if (user.role === "MANAGER") rate = proj.managerRate || proj.billableRate || user.billableRate || 0
            else if (user.role === "SENIOR") rate = proj.seniorRate || proj.billableRate || user.billableRate || 0
            else if (user.role === "ASSOCIATE") rate = proj.associateRate || proj.billableRate || user.billableRate || 0
            else rate = proj.billableRate || user.billableRate || 0
        }

        const amount = hours * rate

        if (!grouped[key]) {
            grouped[key] = {
                date: dateKey,
                projectId: projectKey,
                projectName: entry.project?.name || "No Project",
                hours: 0,
                billableAmount: 0
            }
        }

        grouped[key].hours += hours
        grouped[key].billableAmount += amount
        totalHours += hours
        totalBillable += amount
    }

    return {
        entries: Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date)),
        totalHours,
        totalBillable
    }
}

// --- Comprehensive Report (Harvest Style) ---

export type ReportSummary = {
    totalHours: number
    billableHours: number
    nonBillableHours: number
    billableAmount: number
    uninvoicedAmount: number
}

export type ReportGroupItem = {
    id: string
    name: string
    imageUrl?: string | null
    totalHours: number
    billableHours: number
    billableAmount: number
    percent: number
}

export type ComprehensiveReport = {
    summary: ReportSummary
    byProject: ReportGroupItem[]
    byUser: ReportGroupItem[]
    byTask: ReportGroupItem[]
    entries: TimeReportEntry[]
}

export async function getComprehensiveReport(from: Date, to: Date, projectId?: string, userId?: string, taskId?: string): Promise<ComprehensiveReport> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
        throw new Error("Unauthorized: Insufficient permissions")
    }

    const params = ReportParamsSchema.parse({ from, to, projectId, userId, taskId });
    const { from: fromDate, to: toDate, projectId: pid, userId: uid, taskId: tid } = params;

    const where: Prisma.TimeEntryWhereInput = {
        startedAt: {
            gte: startOfDay(fromDate),
            lte: endOfDay(toDate)
        }
    }

    if (pid && pid !== "all") where.projectId = pid
    if (uid && uid !== "all") where.userId = uid
    if (tid && tid !== "all") where.workItemId = tid

    const rawEntries: TimeEntryWithRelations[] = await prisma.timeEntry.findMany({
        where,
        include: {
            project: { select: { id: true, name: true, billableRate: true, managerRate: true, seniorRate: true, associateRate: true, isBillable: true } },
            user: { select: { id: true, name: true, role: true, billableRate: true, avatarUrl: true } },
            workItem: { select: { id: true, title: true } }
        },
        orderBy: { startedAt: "desc" }
    })

    let totalHours = 0
    let billableHours = 0
    let billableAmount = 0
    const reportEntries: TimeReportEntry[] = []

    const projectMap = new Map<string, ReportGroupItem>()
    const userMap = new Map<string, ReportGroupItem>()
    const taskMap = new Map<string, ReportGroupItem>()

    for (const entry of rawEntries) {
        const duration = entry.durationSeconds / 3600
        totalHours += duration

        let rate = 0
        let isEntryBillable = false

        // Determine if entry is billable
        const projectIsBillable = entry.project?.isBillable ?? true
        // Entry level override (schema says default true)
        if (entry.isBillable && projectIsBillable) {
            isEntryBillable = true
            const proj = entry.project
            const user = entry.user

            // If project is null (shouldn't be if billable), use user rate
            if (!proj) {
                rate = user.billableRate || 0
            } else {
                if (user.role === "MANAGER") rate = proj.managerRate || proj.billableRate || user.billableRate || 0
                else if (user.role === "SENIOR") rate = proj.seniorRate || proj.billableRate || user.billableRate || 0
                else if (user.role === "ASSOCIATE") rate = proj.associateRate || proj.billableRate || user.billableRate || 0
                else rate = proj.billableRate || user.billableRate || 0
            }
        }

        const amount = duration * rate

        if (isEntryBillable) {
            billableHours += duration
            billableAmount += amount
        }

        // Add to entries list
        reportEntries.push({
            date: entry.startedAt.toISOString(),
            projectId: entry.projectId || "no-project",
            projectName: entry.project?.name || "No Project",
            userName: entry.user?.name || "Unknown User",
            // @ts-ignore
            taskTitle: entry.workItem?.title || entry.taskType || "No Task",
            description: entry.notes || "",
            hours: duration,
            billableAmount: amount
        })

        // Aggregate Project
        const pId = entry.projectId || "no-project"
        const pName = entry.project?.name || "No Project"
        if (!projectMap.has(pId)) projectMap.set(pId, { id: pId, name: pName, totalHours: 0, billableHours: 0, billableAmount: 0, percent: 0 })
        const pItem = projectMap.get(pId)!
        pItem.totalHours += duration
        if (isEntryBillable) {
            pItem.billableHours += duration
            pItem.billableAmount += amount
        }

        // Aggregate User
        const uId = entry.userId
        const uName = entry.user.name || "Unknown User"
        const uAvatar = entry.user.avatarUrl
        if (!userMap.has(uId)) userMap.set(uId, { id: uId, name: uName, imageUrl: uAvatar, totalHours: 0, billableHours: 0, billableAmount: 0, percent: 0 })
        const uItem = userMap.get(uId)!
        uItem.totalHours += duration
        if (isEntryBillable) {
            uItem.billableHours += duration
            uItem.billableAmount += amount
        }

        // Aggregate Task
        const tId = entry.workItemId || entry.taskType || "no-task"
        const tName = entry.workItem?.title || entry.taskType || "No Task"
        if (!taskMap.has(tId)) taskMap.set(tId, { id: tId, name: tName, totalHours: 0, billableHours: 0, billableAmount: 0, percent: 0 })
        const tItem = taskMap.get(tId)!
        tItem.totalHours += duration
        if (isEntryBillable) {
            tItem.billableHours += duration
            tItem.billableAmount += amount
        }
    }

    const finalizeArray = (map: Map<string, ReportGroupItem>) => Array.from(map.values())
        .map(item => ({ ...item, percent: totalHours > 0 ? (item.totalHours / totalHours) * 100 : 0 }))
        .sort((a, b) => b.totalHours - a.totalHours)

    return {
        summary: {
            totalHours,
            billableHours,
            nonBillableHours: totalHours - billableHours,
            billableAmount,
            uninvoicedAmount: billableAmount
        },
        byProject: finalizeArray(projectMap),
        byUser: finalizeArray(userMap),
        byTask: finalizeArray(taskMap),
        entries: reportEntries
    }
}


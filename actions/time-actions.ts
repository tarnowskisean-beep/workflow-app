"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"

const timeEntrySchema = z.object({
    workItemId: z.string().optional(),
    durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
    notes: z.string().optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date",
    }),
    projectId: z.string().min(1, "Project is required"),
})

export async function logTime(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    const rawData = {
        workItemId: formData.get("workItemId") || undefined,
        durationMinutes: formData.get("durationMinutes"),
        notes: formData.get("notes"),
        date: formData.get("date"),
        projectId: formData.get("projectId") || undefined, // Allow direct project selection
    }

    const validated = timeEntrySchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    const { workItemId, durationMinutes, notes, date } = validated.data
    const startedAt = new Date(date)

    // Duration in DB is seconds
    const durationSeconds = durationMinutes * 60

    try {
        let projectId: string = rawData.projectId as string
        let isBillable = true

        // Logic to determine Billable status based on Project
        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { isBillable: true }
            })
            if (project) isBillable = project.isBillable
        }

        await prisma.timeEntry.create({
            data: {
                userId: session.user.id,
                workItemId: workItemId || null,
                projectId: projectId,
                durationSeconds,
                startedAt,
                // Default endedAt for manual entry is same day or calculated? 
                // Typically manual entry implies "done". Schema has optional endedAt.
                // If duration is set, endedAt is implied startedAt + duration
                endedAt: new Date(startedAt.getTime() + durationSeconds * 1000),
                notes,
                isBillable
            },
        })

        revalidatePath("/time")
        revalidatePath("/dashboard")
        revalidatePath("/work")
        return { success: true }
    } catch (error) {
        console.error("Failed to log time:", error)
        return { error: "Failed to log time" }
    }
}

export async function updateTimeEntry(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const durationMinutes = Number(formData.get("durationMinutes"))
    const notes = formData.get("notes") as string
    const date = formData.get("date") as string
    const projectId = formData.get("projectId") as string
    const workItemId = formData.get("workItemId") as string

    try {
        await prisma.timeEntry.update({
            where: { id },
            data: {
                durationSeconds: durationMinutes * 60,
                notes,
                startedAt: new Date(date),
                projectId: projectId || undefined,
                workItemId: workItemId || undefined
            }
        })
        revalidatePath("/time")
        return { success: true }
    } catch (error) {
        return { error: "Failed to update" }
    }
}

export async function deleteTimeEntry(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await prisma.timeEntry.delete({ where: { id } })
        revalidatePath("/time")
        return { success: true }
    } catch (error) {
        return { error: "Failed to delete" }
    }
}




export async function getWeeklyEntries(date: Date) {
    const session = await auth()
    if (!session?.user?.id) return []

    // Calculate start/end of week (Monday start)
    const inputDate = new Date(date)
    const start = startOfWeek(inputDate, { weekStartsOn: 0 }) // 0 = Sunday
    const end = endOfWeek(inputDate, { weekStartsOn: 0 })

    return await prisma.timeEntry.findMany({
        where: {
            userId: session.user.id,
            startedAt: { gte: start, lte: end },
            endedAt: { not: null } // Exclude active timers from list view if preferred, or include them? Let's exclude for now.
        },
        include: {
            project: true,
            workItem: true
        },
        orderBy: { startedAt: 'desc' }
    })
}

export async function getRecentTimeEntries() {
    const session = await auth()
    if (!session?.user?.id) return []

    return await prisma.timeEntry.findMany({
        where: { userId: session.user.id, endedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 20,
        include: { workItem: { select: { title: true, project: { select: { name: true } } } } }
    })
}

export async function getWeeklySummary() {
    const session = await auth()
    if (!session?.user?.id) return { totalSeconds: 0, entries: [] }

    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 0 })

    const entries = await prisma.timeEntry.findMany({
        where: {
            userId: session.user.id,
            startedAt: { gte: start },
            endedAt: { not: null }
        }
    })

    const totalSeconds = entries.reduce((acc, curr) => acc + curr.durationSeconds, 0)
    return { totalSeconds, count: entries.length }
}

// --- Live Timer Actions ---

export async function startTimer(projectId: string, workItemId?: string, notes?: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    // Check for existing running timer
    const running = await prisma.timeEntry.findFirst({
        where: { userId: session.user.id, endedAt: null }
    })

    if (running) {
        return { error: "Timer already running" }
    }

    try {
        // Determine billable
        let isBillable = true
        if (projectId) {
            const project = await prisma.project.findUnique({ where: { id: projectId }, select: { isBillable: true } })
            if (project) isBillable = project.isBillable
        }

        const entry = await prisma.timeEntry.create({
            data: {
                userId: session.user.id,
                projectId,
                workItemId,
                notes,
                startedAt: new Date(),
                endedAt: null,
                durationSeconds: 0,
                isBillable
            },
            include: { workItem: true, project: true }
        })

        revalidatePath("/time")
        return { success: true, entry }
    } catch (error) {
        console.error("Start timer error:", error)
        return { error: "Failed to start timer" }
    }
}

export async function stopTimer(entryId: string, notes?: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } })
        if (!entry) return { error: "Entry not found" }
        if (entry.userId !== session.user.id) return { error: "Unauthorized" }

        const endedAt = new Date()
        const durationSeconds = Math.round((endedAt.getTime() - entry.startedAt.getTime()) / 1000)

        // Only update notes if provided string is not undefined/null (allows saving notes on stop)
        const updateData: any = {
            endedAt,
            durationSeconds
        }
        if (notes !== undefined) updateData.notes = notes

        await prisma.timeEntry.update({
            where: { id: entryId },
            data: updateData
        })

        revalidatePath("/time")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { error: "Failed to stop timer" }
    }
}

export async function discardTimer(entryId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await prisma.timeEntry.delete({ where: { id: entryId } })
        revalidatePath("/time")
        return { success: true }
    } catch (error) {
        return { error: "Failed to discard timer" }
    }
}

export async function getActiveTimer() {
    const session = await auth()
    if (!session?.user?.id) return null

    const entry = await prisma.timeEntry.findFirst({
        where: { userId: session.user.id, endedAt: null },
        include: { workItem: true, project: true }
    })

    return entry
}

"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"

const timeEntrySchema = z.object({
    workItemId: z.string().min(1, "Task is required"),
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
            startedAt: { gte: start, lte: end }
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
        where: { userId: session.user.id },
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
            startedAt: { gte: start }
        }
    })

    const totalSeconds = entries.reduce((acc, curr) => acc + curr.durationSeconds, 0)
    return { totalSeconds, count: entries.length }
}


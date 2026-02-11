"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { addDays } from "date-fns"

const templateGroupSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
})

const templateTaskSchema = z.object({
    groupId: z.string(),
    title: z.string().min(1),
    description: z.string().optional(),
    taskType: z.string().optional(),
    relativeDueDays: z.coerce.number().min(0),
    priority: z.enum(["P0", "P1", "P2", "P3"]),
    requiresDocument: z.boolean().optional(),
    assigneeRole: z.string().optional(), // "ASSOCIATE", "SENIOR", "MANAGER", "NONE"
    isRecurring: z.boolean().optional(),
    recurrenceInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional().nullable(),
    recurrenceDays: z.string().optional().nullable(),
})

const updateTaskSchema = templateTaskSchema.partial().omit({ groupId: true })

// --- Management Actions ---

export async function getTemplateGroups() {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        return await prisma.taskTemplateGroup.findMany({
            include: { templates: true },
            orderBy: { name: "asc" }
        })
    } catch (error) {
        console.error("Failed to fetch template groups:", error)
        return []
    }
}

export async function createTemplateGroup(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const userRole = session.user.role
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return { error: "Only Managers and Admins can create template groups." }
    }

    const rawData = {
        name: formData.get("name"),
        description: formData.get("description"),
    }

    const validated = templateGroupSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    try {
        await prisma.taskTemplateGroup.create({
            data: validated.data
        })
        revalidatePath("/templates")
        return { success: true }
    } catch (error) {
        return { error: "Failed to create template group" }
    }
}

export async function addTaskToGroup(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const userRole = session.user.role
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return { error: "Only Managers and Admins can add templates." }
    }

    const rawData = {
        groupId: formData.get("groupId"),
        title: formData.get("title"),
        description: formData.get("description"),
        taskType: formData.get("taskType"),
        relativeDueDays: formData.get("relativeDueDays"),
        priority: formData.get("priority") || "P2",
        assigneeRole: formData.get("assigneeRole") || "ASSOCIATE",
        requiresDocument: formData.get("requiresDocument") === "on",
        isRecurring: formData.get("isRecurring") === "on",
        recurrenceInterval: formData.get("recurrenceInterval") || null,
        recurrenceDays: formData.get("recurrenceDays") || null,
    }

    const validated = templateTaskSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    try {
        const template = await prisma.taskTemplate.create({
            data: {
                ...validated.data,
                // Ensure interval is null if not recurring
                recurrenceInterval: validated.data.isRecurring ? validated.data.recurrenceInterval : null,
                recurrenceDays: validated.data.isRecurring ? validated.data.recurrenceDays : null
            }
        })
        revalidatePath("/templates")
        revalidatePath(`/templates/${validated.data.groupId}`)
        return template
    } catch (error) {
        console.error(error)
        return { error: "Failed to add task template" }
    }
}

// Helper for client-side direct creation (used in Editor)
export async function addTaskTemplate(groupId: string, data: Partial<z.infer<typeof templateTaskSchema>>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const userRole = session.user.role
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        throw new Error("Insufficient permissions")
    }

    // Set defaults
    const taskData = {
        groupId,
        title: data.title || "New Task",
        description: data.description || null,
        taskType: data.taskType || "General",
        priority: data.priority || "P2",
        relativeDueDays: data.relativeDueDays || 0,
        assigneeRole: data.assigneeRole || "ASSOCIATE",
        requiresDocument: data.requiresDocument || false,
        isRecurring: data.isRecurring || false,
        recurrenceInterval: data.recurrenceInterval || null,
        recurrenceDays: data.recurrenceDays || null
    }

    try {
        const template = await prisma.taskTemplate.create({
            data: taskData
        })
        revalidatePath(`/templates/${groupId}`)
        return template
    } catch (e) {
        throw new Error("Failed to create task")
    }
}

export async function updateTaskTemplate(templateId: string, data: Partial<z.infer<typeof templateTaskSchema>>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const userRole = session.user.role
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        throw new Error("Insufficient permissions")
    }

    try {
        const template = await prisma.taskTemplate.update({
            where: { id: templateId },
            data
        })
        revalidatePath(`/templates/${template.groupId}`)
        return template
    } catch (error) {
        console.error("Update failed", error)
        throw new Error("Failed to update task")
    }
}

export async function deleteTaskTemplate(templateId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const userRole = session.user.role
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        throw new Error("Insufficient permissions")
    }

    try {
        const template = await prisma.taskTemplate.delete({
            where: { id: templateId }
        })
        revalidatePath(`/templates/${template.groupId}`)
        return { success: true }
    } catch (error) {
        throw new Error("Failed to delete task")
    }
}

// --- Instantiation Logic ---

// --- Assignment Logic ---

const assignTemplateSchema = z.object({
    groupId: z.string(),
    projectIds: z.string().transform((str, ctx) => {
        try {
            return JSON.parse(str) as string[]
        } catch (e) {
            ctx.addIssue({ code: 'custom', message: 'Invalid project IDs' })
            return z.NEVER
        }
    }),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
})

export async function assignTemplate(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const userRole = session.user.role // Assuming role is available on session user
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return { error: "Only Managers and Admins can assign workflows." }
    }

    const rawData = {
        groupId: formData.get("groupId"),
        projectIds: formData.get("projectIds"),
        startDate: formData.get("startDate")
    }

    const validated = assignTemplateSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    const { groupId, projectIds, startDate } = validated.data
    const start = new Date(startDate)

    // 1. Fetch templates in the group
    const group = await prisma.taskTemplateGroup.findUnique({
        where: { id: groupId },
        include: { templates: true }
    })

    if (!group || group.templates.length === 0) {
        return { error: "Template group not found or empty" }
    }

    let totalCreated = 0

    // 2. Iterate over projects
    for (const projectId of projectIds) {
        // Fetch project with roles
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                managerId: true,
                seniorId: true,
                associateId: true
            }
        })

        if (!project) continue

        // Link the Group to the Project (Persistence)
        await prisma.project.update({
            where: { id: projectId },
            data: {
                assignedTemplates: {
                    connect: { id: groupId }
                }
            }
        })

        const tasksToCreate = group.templates.map(t => {
            // Role Resolution Logic
            let assigneeId: string | null = null // Default to unassigned if role missing

            if (t.assigneeRole === "MANAGER") assigneeId = project.managerId
            else if (t.assigneeRole === "SENIOR") assigneeId = project.seniorId
            else if (t.assigneeRole === "ASSOCIATE") assigneeId = project.associateId

            return {
                title: t.title,
                status: "OPEN",
                priority: t.priority,
                projectId,
                assigneeId,
                requiresDocument: t.requiresDocument,
                dueDate: t.relativeDueDays !== null ? addDays(start, t.relativeDueDays) : null,
                description: t.description || `Generated from workflow: ${group.name}`,
                isRecurring: t.isRecurring,
                recurrenceInterval: t.recurrenceInterval,
                recurrenceDays: t.recurrenceDays,
                taskType: t.taskType || "General"
            }
        })

        const result = await prisma.workItem.createMany({
            data: tasksToCreate
        })
        totalCreated += result.count
    }

    revalidatePath("/work")
    revalidatePath("/projects")

    return { success: true, count: totalCreated }
}

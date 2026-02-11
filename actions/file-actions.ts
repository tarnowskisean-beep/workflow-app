"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const fileSchema = z.object({
    title: z.string().min(1),
    driveLink: z.string().url(),
    projectId: z.string().optional().nullable(),
    taskId: z.string().optional().nullable(),
})

export async function createFileLog(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const rawData = {
        title: formData.get("title"),
        driveLink: formData.get("driveLink"),
        projectId: formData.get("projectId") === "none" ? null : formData.get("projectId"),
        taskId: formData.get("taskId") === "none" ? null : formData.get("taskId"),
    }

    const validated = fileSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    try {
        // If taskId is provided, update the existing task
        if (rawData.taskId) {
            await prisma.workItem.update({
                where: { id: rawData.taskId as string },
                data: {
                    title: validated.data.title, // Update title?? Maybe user wants to rename it to the file name.
                    status: "DONE",
                    driveLink: validated.data.driveLink,
                    completedAt: new Date(),
                    // Project should already match, but we can enforce it or leave it.
                    // Let's assume the user selected the right project for the task filter.
                }
            })
        } else {
            // Create new file log (WorkItem)
            await prisma.workItem.create({
                data: {
                    title: validated.data.title,
                    status: "DONE",
                    priority: "P2", // Default
                    driveLink: validated.data.driveLink,
                    projectId: validated.data.projectId || null,
                    assigneeId: session.user.id,
                    completedAt: new Date()
                }
            })
        }

        revalidatePath("/files")
        return { success: true }
    } catch (error) {
        return { error: "Failed to create file log" }
    }
}

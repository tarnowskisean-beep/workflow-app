"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        return await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        })
    } catch (error) {
        console.error("Failed to fetch notifications:", error)
        return []
    }
}

export async function markAsRead(notificationId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await prisma.notification.update({
            where: { id: notificationId, userId: session.user.id },
            data: { read: true }
        })
        revalidatePath("/inbox")
        return { success: true }
    } catch (error) {
        return { error: "Failed to mark as read" }
    }
}

export async function markAllAsRead() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await prisma.notification.updateMany({
            where: { userId: session.user.id, read: false },
            data: { read: true }
        })
        revalidatePath("/inbox")
        return { success: true }
    } catch (error) {
        return { error: "Failed to mark all as read" }
    }
}

// Internal helper for other actions to use
export async function createNotification(userId: string, title: string, message: string, type: "INFO" | "SUCCESS" | "WARNING" | "ERROR", link?: string) {
    try {
        await prisma.notification.create({
            data: { userId, title, message, type, link }
        })
    } catch (error) {
        console.error("Failed to create notification", error)
    }
}

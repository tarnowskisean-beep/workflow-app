"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logSecurityEvent } from "@/lib/audit"

export async function getUsers() {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
        const isAdminOrManager = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER"

        // @ts-ignore
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                // Only return sensitive fields for admins/managers
                email: isAdminOrManager,
                role: isAdminOrManager,
                managerId: isAdminOrManager,
                manager: isAdminOrManager ? {
                    select: { id: true, name: true }
                } : false,
                projects: isAdminOrManager ? {
                    select: { id: true, name: true, code: true }
                } : false
            },
            orderBy: { name: 'asc' }
        })
        return users
    } catch (error) {
        console.error("Failed to fetch users:", error)
        return []
    }
}

export async function updateUserRoleAndManager(userId: string, role: string, managerId: string | null) {
    const session = await auth()
    // Authorization check: only admin or manager should do this? 
    // For now allow any authenticated user for simplicity as per request context
    if (!session?.user?.id) return { error: "Unauthorized" }

    if (session.user.role !== "ADMIN") {
        return { error: "Only Admins can update user roles." }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                role,
                managerId: managerId === "none" ? null : managerId
            }
        })

        await logSecurityEvent("USER_ROLE_UPDATED", "USER", userId, {
            newRole: role,
            newManagerId: managerId
        })

        revalidatePath("/settings/users")
        return { success: true }
    } catch (error) {
        console.error("Failed to update user:", error)
        return { error: "Failed to update user" }
    }
}

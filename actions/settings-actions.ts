"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"

const profileSchema = z.object({
    name: z.string().min(2),
    avatarUrl: z.string().url().optional().or(z.literal("")),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export async function updateProfile(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const rawData = {
        name: formData.get("name"),
        // avatarUrl: formData.get("avatarUrl"), // Not in form yet but good to have
    }

    const validated = profileSchema.safeParse({ ...rawData, avatarUrl: "" }) // Default empty for now

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: validated.data.name,
            }
        })
        revalidatePath("/settings")
        return { success: "Profile updated successfully" }
    } catch (error) {
        return { error: "Failed to update profile" }
    }
}

export async function changePassword(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const rawData = {
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
        confirmPassword: formData.get("confirmPassword"),
    }

    const validated = passwordSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    const { currentPassword, newPassword } = validated.data

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!user || !user.password) {
        return { error: "User not found" }
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password)

    if (!passwordMatch) {
        return { error: "Incorrect current password" }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                password: hashedPassword
            }
        })
        return { success: "Password changed successfully" }
    } catch (error) {
        return { error: "Failed to change password" }
    }
}

export async function getTeamMembers() {
    const session = await auth()
    if (!session?.user?.id) return []

    // Only allow managers/admins to see full list? or everyone?
    // For now everyone can see the team.
    return await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true
        },
        orderBy: { name: 'asc' }
    })
}

// --- User Management ---

const userSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    role: z.enum(["ASSOCIATE", "SENIOR", "MANAGER", "ADMIN"]),
    password: z.string().min(6).optional(), // Optional for updates
})

export async function addUser(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (currentUser?.role !== 'MANAGER' && currentUser?.role !== 'ADMIN') {
        return { error: "Insufficient permissions to add users." }
    }

    const rawData = {
        name: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role"),
        password: formData.get("password") || "Compass123!", // Default temp password
    }

    const validated = userSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    const { name, email, role, password } = validated.data
    const hashedPassword = await bcrypt.hash(password || "Compass123!", 10)

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                role,
                password: hashedPassword,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            }
        })
        revalidatePath("/settings")
        return { success: "User added successfully" }
    } catch (error) {
        // Unique constraint on email?
        return { error: "Failed to add user. Email might be in use." }
    }
}

export async function updateUser(userId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (currentUser?.role !== 'MANAGER' && currentUser?.role !== 'ADMIN') {
        return { error: "Insufficient permissions to update users." }
    }

    const rawData = {
        name: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role"),
    }

    const { name, email, role } = rawData

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: name as string,
                email: email as string,
                role: role as string
            }
        })
        revalidatePath("/settings")
        return { success: "User updated successfully" }
    } catch (error) {
        return { error: "Failed to update user" }
    }
}

export async function deleteUser(userId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (currentUser?.role !== 'MANAGER' && currentUser?.role !== 'ADMIN') {
        return { error: "Insufficient permissions to delete users." }
    }

    try {
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath("/settings")
        return { success: "User removed successfully" }
    } catch (error) {
        return { error: "Failed to remove user" }
    }
}

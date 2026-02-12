"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logSecurityEvent } from "@/lib/audit"

const projectSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2).max(10).toUpperCase(),
    description: z.string().optional(),
})



export async function getProjects(query?: string, projectId?: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    const isAdmin = session.user.role === "ADMIN"

    try {
        return await prisma.project.findMany({
            where: {
                ...(isAdmin ? {} : { users: { some: { id: session.user.id } } }),
                ...(projectId && projectId !== "all" ? { id: projectId } : {}), // Filter by specific project ID
                ...(query ? {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { code: { contains: query, mode: 'insensitive' } }
                    ]
                } : {})
            },
            orderBy: { updatedAt: "desc" },
            include: {
                _count: {
                    select: { workItems: true }
                },
                users: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                workItems: {
                    orderBy: { updatedAt: 'desc' },
                    take: 20 // Limit for now, or paginate later
                }
            }
        })
    } catch (error) {
        console.error("Failed to fetch projects:", error)
        return []
    }
}

export async function getProjectByCode(code: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const isAdmin = session.user.role === "ADMIN"

    try {
        // Use findFirst to allow filtering by user access for non-admins
        const project = await prisma.project.findFirst({
            where: {
                code,
                ...(isAdmin ? {} : { users: { some: { id: session.user.id } } })
            },
            include: {
                // @ts-ignore
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                },
                // Include team roles
                manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
                senior: { select: { id: true, name: true, email: true, avatarUrl: true } },
                associate: { select: { id: true, name: true, email: true, avatarUrl: true } },
                assignedTemplates: true,
                workItems: {
                    orderBy: { updatedAt: 'desc' },
                    take: 20
                }
            }
        })
        return project
    } catch (error) {
        console.error("Failed to fetch project:", error)
        return null
    }
}

export async function createProject(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    // Check Global Permissions
    const userRole = session.user.role // Assuming role is available on session user
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return { error: "Only Managers and Admins can create projects." }
    }

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        description: formData.get("description"),
    }

    const validated = projectSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    try {
        await prisma.project.create({
            data: {
                ...validated.data,
                users: {
                    connect: { id: session.user.id }
                }
            }
        })
        revalidatePath("/projects")
        return { success: true }
    } catch (error) {
        return { error: "Failed to create project. Code might be duplicate." }
    }
}

export async function updateProjectAccess(code: string, userIds: string[]) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const userRole = session.user.role
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return { error: "Insufficient permissions to update project access." }
    }

    try {
        // First verify user has access to this project
        const project = await prisma.project.findFirst({
            where: {
                code,
                users: { some: { id: session.user.id } }
            }
        })

        if (!project) return { error: "Project not found or unauthorized" }

        await prisma.project.update({
            where: { code },
            data: {
                users: {
                    set: userIds.map(id => ({ id }))
                }
            }
        })

        revalidatePath(`/projects/${code}`)
        revalidatePath("/projects")
        return { success: true }
    } catch (error) {
        console.error("Failed to update project access:", error)
        return { error: "Failed to update access" }
    }
}

export async function updateProjectTeam(
    code: string,
    team: {
        managerId?: string,
        seniorId?: string,
        associateId?: string,
        allowedTaskTypes?: string,
        assignedTemplateIds?: string[]
    }
) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const userRole = session.user.role
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return { error: "Insufficient permissions to update project settings." }
    }

    try {
        const data: any = {
            managerId: team.managerId === "none" ? null : team.managerId,
            seniorId: team.seniorId === "none" ? null : team.seniorId,
            associateId: team.associateId === "none" ? null : team.associateId,
            allowedTaskTypes: team.allowedTaskTypes
        }

        if (team.assignedTemplateIds) {
            data.assignedTemplates = {
                set: team.assignedTemplateIds.map(id => ({ id }))
            }
        }

        await prisma.project.update({
            where: { code },
            data
        })

        revalidatePath(`/projects/${code}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update project team:", error)
        return { error: "Failed to update project team" }
    }
}

export async function updateProjectDetails(
    code: string,
    details: {
        name: string,
        description?: string,
        isBillable: boolean,
        billableRate?: number,
        managerRate?: number,
        seniorRate?: number,
        associateRate?: number
    }
) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const userRole = session.user.role
    if (userRole !== "MANAGER" && userRole !== "ADMIN") {
        return { error: "Insufficient permissions to update project details." }
    }

    try {
        await prisma.project.update({
            where: { code },
            data: {
                name: details.name,
                description: details.description,
                isBillable: details.isBillable,
                billableRate: details.billableRate,
                managerRate: details.managerRate,
                seniorRate: details.seniorRate,
                associateRate: details.associateRate
            }
        })

        await logSecurityEvent("PROJECT_UPDATED", "PROJECT", code, {
            updatedFields: Object.keys(details)
        })

        revalidatePath(`/projects/${code}`)
        revalidatePath("/projects")
        return { success: true }
    } catch (error) {
        console.error("Failed to update project details:", error)
        return { error: "Failed to update project details" }
    }
}

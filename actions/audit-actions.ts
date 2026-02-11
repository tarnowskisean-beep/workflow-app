"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getAuditLogs(filters?: {
    action?: string
    search?: string
    startDate?: Date
    endDate?: Date
}) {
    const session = await auth()

    // Strict Admin Check
    if (session?.user?.role !== "ADMIN") {
        return []
    }

    try {
        const where: any = {}

        if (filters?.startDate) {
            where.occurredAt = { ...where.occurredAt, gte: filters.startDate }
        }

        if (filters?.endDate) {
            where.occurredAt = { ...where.occurredAt, lte: filters.endDate }
        }

        if (filters?.action && filters.action !== "ALL") {
            where.action = filters.action
        }

        if (filters?.search) {
            where.OR = [
                { actor: { name: { contains: filters.search } } },
                { actor: { email: { contains: filters.search } } },
                { entityId: { contains: filters.search } },
                // entityType is an enum-like string, we could search it too
                { entityType: { contains: filters.search } }
            ]
        }

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { occurredAt: 'desc' },
            take: 100, // Limit for performance
            include: {
                actor: {
                    select: { name: true, email: true }
                }
            }
        })
        return logs
    } catch (error) {
        console.error("Failed to fetch audit logs:", error)
        return []
    }
}

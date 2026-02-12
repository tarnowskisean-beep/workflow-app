import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export type AuditAction =
    | "USER_ROLE_UPDATED"
    | "PROJECT_CREATED"
    | "PROJECT_UPDATED"
    | "PROJECT_ACCESS_UPDATED"
    | "PROJECT_DELETED"
    | "TASK_CREATED"
    | "TASK_UPDATED"
    | "TASK_DELETED"
    | "TASK_STATUS_ADJUSTED"

export async function logSecurityEvent(
    action: AuditAction,
    entityType: "USER" | "PROJECT" | "TASK" | "SYSTEM",
    entityId: string,
    metadata?: any
) {
    try {
        const session = await auth()
        // If no session (e.g. system action), we might handle differently, 
        // but for now we assume authenticated actions. 
        // If strictly server-side background job, we'd need a system user ID.
        const actorId = session?.user?.id

        if (!actorId) {
            console.warn(`[AUDIT] Attempted to log ${action} without authenticated user.`)
            return
        }

        await prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                actorId,
                metadata: metadata ? JSON.stringify(metadata) : null,
                occurredAt: new Date()
            }
        })
    } catch (error) {
        // Fallback logging if DB fails - vital for audit
        console.error(`[AUDIT_FAILURE] Failed to persist audit log: ${action} on ${entityType}:${entityId}`, error)
    }
}

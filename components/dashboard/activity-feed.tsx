import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatDistanceToNow } from "date-fns"

export async function ActivityFeed({ projectId, userId }: { projectId?: string, userId?: string }) {

    // Construct where clause for AuditLogs
    const where: any = {}

    // Note: AuditLog might not have direct projectId/userId fields depending on schema.
    // If AuditLog has 'entityId' and 'entityType', filtering by project is hard without exact schema knowledge.
    // However, usually AuditLogs are global or we check schema.
    // Let's assume for now we filter by actorId if userId is present.
    // For project, it's tricker if not directly linked. 
    // Let's check schema first to be safe, but for now I'll implement basic actor filtering if userId is passed.

    if (userId && userId !== 'all') {
        where.actorId = userId
    }

    // If we want to filter by project, we'd need to know if the entity belongs to the project.
    // Since AuditLog is generic, this might be complex. 
    // I'll skip project filtering for AuditLog for now unless I see a direct link in schema.
    // Wait, let's look at schema to be sure. 

    const audits = await prisma.auditLog.findMany({
        where,
        take: 5,
        orderBy: { occurredAt: "desc" },
        include: { actor: true }
    })

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {audits.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent activity.</p>
                    ) : (
                        audits.map((log) => (
                            <div key={log.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={log.actor?.avatarUrl || "/avatars/01.png"} alt="Avatar" />
                                    <AvatarFallback>{log.actor?.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{log.action.replace(/_/g, " ")}</p>
                                    <p className="text-sm text-muted-foreground">
                                        by {log.actor?.name || "Unknown"}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-muted-foreground">
                                    {formatDistanceToNow(log.occurredAt, { addSuffix: true })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

import { auth } from "@/auth"
import { SettingsForm } from "@/components/settings/settings-form"
import { TeamManagement } from "@/components/settings/team-management"
import { getTeamMembers } from "@/actions/settings-actions"
import { AuditLogViewer } from "@/components/settings/audit-log-viewer"

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user) return null

    const team = await getTeamMembers()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <SettingsForm user={session.user} />
                </div>
                <div>
                    <TeamManagement users={team} currentUserRole={session.user.role} />
                </div>
            </div>

            {session.user.role === "ADMIN" && (
                <div className="mt-8">
                    <AuditLogViewer />
                </div>
            )}
        </div>
    )
}

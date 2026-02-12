import { auth } from "@/auth"
import { getUsers } from "@/actions/user-actions"
import { getProjects } from "@/actions/project-actions"
import { TeamManagement } from "@/components/settings/team-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function UsersSettingsPage() {
    const session = await auth()
    if (!session?.user) return null

    // Fetch all users with hierarchy info
    // @ts-ignore
    const users = await getUsers()
    const projects = await getProjects()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Team & Permissions</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your team structure and access levels.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                        Set roles and manager reporting lines.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TeamManagement
                        users={users}
                        allProjects={projects}
                        currentUserRole={session.user.role}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

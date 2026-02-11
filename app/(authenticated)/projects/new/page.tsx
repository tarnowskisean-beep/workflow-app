import { auth } from "@/auth"
import { CreateProjectForm } from "@/components/projects/create-project-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUsers } from "@/actions/user-actions"

export default async function NewProjectPage() {
    const session = await auth()
    if (!session?.user) return null

    const users = await getUsers()

    return (
        <div className="max-w-xl mx-auto py-12">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Project</CardTitle>
                    <CardDescription>
                        Create a new project profile to start managing jobs and tasks.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateProjectForm users={users} />
                </CardContent>
            </Card>
        </div>
    )
}

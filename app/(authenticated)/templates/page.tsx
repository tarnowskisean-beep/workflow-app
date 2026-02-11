import { auth } from "@/auth"
import { getTemplateGroups } from "@/actions/template-actions"
import { TemplateGrid } from "@/components/templates/template-grid"

export default async function TemplatesPage() {
    const session = await auth()
    if (!session?.user) return null

    const groups = await getTemplateGroups()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Task Groups</h1>
                    <p className="text-muted-foreground">
                        Manage task groups and role assignments for standard workflows.
                    </p>
                </div>
            </div>

            <TemplateGrid groups={groups} />
        </div>
    )
}

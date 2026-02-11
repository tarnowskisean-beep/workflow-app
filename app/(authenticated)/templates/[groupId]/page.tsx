import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { TemplateEditor } from "@/components/templates/template-editor"
import { ApplyTemplateDialog } from "@/components/templates/apply-template-dialog"

interface Props {
    params: {
        groupId: string
    }
}

export default async function TemplateDetailsPage({ params }: Props) {
    const session = await auth()
    if (!session?.user) return null

    const { groupId } = await params

    const group = await prisma.taskTemplateGroup.findUnique({
        where: { id: groupId },
        include: { templates: true }
    })

    if (!group) {
        return <div>Group not found</div>
    }

    // Need projects for the dialog
    const projectsData = await prisma.project.findMany({
        orderBy: { name: "asc" }
    })

    // Serialize
    const projects = projectsData.map(p => ({
        id: p.id,
        name: p.name
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold">{group.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <ApplyTemplateDialog group={group} projects={projects} />
                </div>
            </div>

            <TemplateEditor group={group} />
        </div>
    )
}

import { prisma } from "@/lib/prisma"
import { FileSearch } from "@/components/files/file-search"
import { AddFileDialog } from "@/components/files/add-file-dialog"

import { getUsers } from "@/actions/user-actions"
import { FileFilters } from "@/components/files/file-filters"
import { FileExplorer } from "@/components/files/file-explorer"

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ query?: string, projectId?: string, userId?: string, taskType?: string }> }) {
    const { query, projectId, userId, taskType } = await searchParams

    const whereClause: any = {
        driveLink: { not: null },
    }

    if (query) {
        whereClause.title = { contains: query }
    }
    if (projectId && projectId !== "all") {
        whereClause.projectId = projectId
    }
    if (userId && userId !== "all") {
        whereClause.assigneeId = userId
    }
    if (taskType && taskType !== "all") {
        whereClause.taskType = taskType
    }

    const files = await prisma.workItem.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: {
            project: true,
            assignee: true
        }
    })

    const projects = await prisma.project.findMany({
        orderBy: { name: 'asc' }
    })

    // Aggregate unique task types across all projects
    const allTaskTypes = Array.from(new Set(
        projects.flatMap(p => p.allowedTaskTypes ? p.allowedTaskTypes.split(",").map(t => t.trim()) : [])
    )).filter(Boolean).sort()

    // @ts-ignore
    const users = await getUsers()

    // Fetch open tasks for the Add File dialog
    const openTasks = await prisma.workItem.findMany({
        where: { status: { not: "DONE" } },
        select: { id: true, title: true, projectId: true, status: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Files</h1>
                    <p className="text-muted-foreground">
                        Central repository of all deliverables.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* @ts-ignore */}
                    <FileFilters projects={projects} users={users} taskTypes={allTaskTypes} />
                    <FileSearch />
                    <AddFileDialog projects={projects} tasks={openTasks} />
                </div>
            </div>

            <div className="grid gap-6">
                <FileExplorer data={files as any} />
            </div>
        </div>
    )
}

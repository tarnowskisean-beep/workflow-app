import { auth } from "@/auth"
import { getProjectByCode } from "@/actions/project-actions"
import { AddTaskDialog } from "@/components/work/add-task-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen, LayoutTemplate, MoreHorizontal } from "lucide-react"
import { notFound } from "next/navigation"

import { ProjectSettingsDialog } from "@/components/projects/project-team-dialog"
import { getUsers } from "@/actions/user-actions"
import { getTemplateGroups } from "@/actions/template-actions"


import { ProjectHeader } from "@/components/projects/project-header"
import { ProjectTeamCard } from "@/components/projects/project-team-card"
import { ProjectTaskList } from "@/components/projects/project-task-list"
import { ProjectFiles } from "@/components/projects/project-files"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function ProjectDetailPage({ params }: { params: Promise<{ code: string }> }) {
    const session = await auth()
    if (!session?.user?.id) return null

    const { code } = await params
    const project: any = await getProjectByCode(code)

    if (!project) {
        notFound()
    }

    const allUsers = await getUsers()
    const templateGroups = await getTemplateGroups()

    const canEdit = session.user.role === "MANAGER" || session.user.role === "ADMIN"

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b pb-6">
                <ProjectHeader project={project} />
                {canEdit && (
                    <div className="flex items-center gap-2">

                        {/* @ts-ignore - types match but prisma partials can be finicky */}
                        <ProjectSettingsDialog project={project} allUsers={allUsers} templateGroups={templateGroups} />
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3 xl:col-span-4">
                {/* Main Content Area */}
                <div className="lg:col-span-2 xl:col-span-3 space-y-6">

                    <Tabs defaultValue="tasks" className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <TabsList>
                                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                                <TabsTrigger value="files">Files</TabsTrigger>
                                <TabsTrigger value="notes">Notes</TabsTrigger>
                            </TabsList>

                            <AddTaskDialog
                                projects={[{
                                    id: project.id,
                                    name: project.name,
                                    allowedTaskTypes: project.allowedTaskTypes || ""
                                }]}
                                users={allUsers}
                                defaultProjectId={project.id}
                            />
                        </div>

                        <TabsContent value="tasks" className="space-y-4">
                            {/* @ts-ignore - workItems are included in getProjectByCode */}
                            <ProjectTaskList
                                tasks={project.workItems || []}
                                users={allUsers}
                                project={project}
                                currentUserId={session.user.id}
                                currentUserRole={session.user.role}
                            />
                        </TabsContent>

                        <TabsContent value="files" className="space-y-4">
                            <ProjectFiles files={project.workItems || []} />
                        </TabsContent>

                        <TabsContent value="notes" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Notes</CardTitle>
                                    <CardDescription>General information and notes about this project.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted/10 p-6 rounded-lg border min-h-[200px]">
                                        {project.description ? (
                                            <p className="whitespace-pre-wrap leading-relaxed">{project.description}</p>
                                        ) : (
                                            <p className="text-muted-foreground italic">No notes available for this project.</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-4">
                                        * To edit these notes, update the Project Description in settings.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <ProjectTeamCard
                        manager={project.manager}
                        senior={project.senior}
                        associate={project.associate}
                    />

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">About</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Description</span>
                                <p>{project.description || "No description"}</p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Project Code</span>
                                <code className="bg-muted px-1 py-0.5 rounded text-xs">{project.code}</code>
                            </div>
                            {project.allowedTaskTypes && (
                                <div>
                                    <span className="text-xs text-muted-foreground block mb-1">Allowed Types</span>
                                    <div className="flex flex-wrap gap-1">
                                        {project.allowedTaskTypes.split(',').map((type: string) => (
                                            <Badge key={type} variant="outline" className="text-[10px] font-normal">
                                                {type.trim()}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

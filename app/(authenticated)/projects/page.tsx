import { auth } from "@/auth"
import { getProjects } from "@/actions/project-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Link as AppLink } from "lucide-react" // Import conflict with next/link
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { ProjectSearch } from "@/components/projects/project-search"
import { ClientFilter } from "@/components/projects/client-filter"

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ query?: string, projectId?: string }> }) {
    const session = await auth()
    if (!session?.user) return null

    const { query, projectId } = await searchParams

    // Fetch all projects for the filter, but use query/projectId for list
    const allProjects = await getProjects()
    const filteredProjects = await getProjects(query, projectId)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">
                        Manage your project list and jobs.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ProjectSearch />
                    <ClientFilter projects={allProjects} />
                    {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
                        <Button asChild>
                            <Link href="/projects/new">New Project</Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                    <Link href={`/projects/${project.code}`} key={project.id}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {project.code.substring(0, 2)}
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                        {project.code}
                                    </span>
                                </div>
                                <CardTitle className="mt-4">{project.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {project.description || "No description provided."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 text-sm text-muted-foreground">

                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground">{project._count.workItems}</span>
                                        <span>Tasks</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}

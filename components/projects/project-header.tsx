
import { Project } from "@prisma/client"
import { CalendarDays, Hash } from "lucide-react"

interface ProjectHeaderProps {
    project: Project & {
        _count?: { workItems: number }
    }
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
                    <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-sm border">
                        {project.code}
                    </span>
                </div>
                <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                    {project.description || "No description provided."}
                </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 opacity-70" />
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                {project._count?.workItems !== undefined && (
                    <div className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 opacity-70" />
                        <span>{project._count.workItems} Tasks</span>
                    </div>
                )}
            </div>
        </div>
    )
}

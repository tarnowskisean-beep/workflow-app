"use client"

import { ApplyTemplateDialog } from "@/components/templates/apply-template-dialog"
import { LayoutTemplate } from "lucide-react"

interface TemplateGroupHeaderProps {
    group: any // Type this properly if possible, but any is safe for now to avoid extensive import chains
    projects: any[]
}

export function TemplateGroupHeader({ group, projects }: TemplateGroupHeaderProps) {
    return (
        <div className="flex items-center gap-4 text-left w-full pr-4">
            <div className="flex items-center gap-4 flex-1">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <LayoutTemplate className="h-5 w-5" />
                </div>
                <div>
                    <div className="font-semibold">{group.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{group.templates.length} tasks defined</div>
                </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
                <ApplyTemplateDialog group={group} projects={projects} />
            </div>
        </div>
    )
}

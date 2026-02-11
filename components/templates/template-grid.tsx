"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, LayoutTemplate, Briefcase, Users, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { CreateGroupForm } from "@/components/templates/create-group-form"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// We'll pass the initial data from server component wrapper
interface TemplateGroup {
    id: string
    name: string
    description: string | null
    templates: {
        id: string
        assigneeRole: string | null
    }[]
}

export function TemplateGrid({ groups }: { groups: TemplateGroup[] }) {
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* New Template Action Card */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Card className="flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-muted/50 transition-colors h-[200px]">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <Plus className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-lg">New Task Group</h3>
                            <p className="text-sm text-muted-foreground">Create a new workflow template</p>
                        </Card>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Task Group</DialogTitle>
                            <DialogDescription>
                                Start a new standard operating procedure.
                            </DialogDescription>
                        </DialogHeader>
                        <CreateGroupForm />
                    </DialogContent>
                </Dialog>

                {/* Existing Groups */}
                {groups.map((group) => {
                    // Calculate quick stats
                    const taskCount = group.templates.length
                    const roles = Array.from(new Set(group.templates.map(t => t.assigneeRole).filter(Boolean))) as string[]

                    return (
                        <Card
                            key={group.id}
                            className="cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden"
                            onClick={() => router.push(`/templates/${group.id}`)}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all" />
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="h-10 w-10 rounded bg-primary/5 flex items-center justify-center text-primary mb-2">
                                        <LayoutTemplate className="h-5 w-5" />
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {taskCount} Tasks
                                    </Badge>
                                </div>
                                <CardTitle className="leading-tight">{group.name}</CardTitle>
                                {group.description && (
                                    <CardDescription className="line-clamp-2 text-xs mt-1">
                                        {group.description}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {roles.length > 0 ? roles.map(role => (
                                        <Badge key={role} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                            {role}
                                        </Badge>
                                    )) : (
                                        <span className="text-xs text-muted-foreground italic">No roles defined</span>
                                    )}
                                </div>
                            </CardContent>

                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

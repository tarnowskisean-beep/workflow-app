"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TaskTemplate, TaskTemplateGroup } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Plus, Trash2, Clock, FileText, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
// Server actions
import { addTaskTemplate, updateTaskTemplate, deleteTaskTemplate } from "@/actions/template-actions"
import { TemplateStepDialog } from "./template-step-dialog"

interface TemplateEditorProps {
    group: TaskTemplateGroup & { templates: TaskTemplate[] }
}

export function TemplateEditor({ group }: TemplateEditorProps) {
    const router = useRouter()
    const [templates, setTemplates] = useState<TaskTemplate[]>(group.templates.sort((a, b) => (a.relativeDueDays || 0) - (b.relativeDueDays || 0)))
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)

    // Roles map for display
    const getRoleLabel = (role: string) => {
        switch (role) {
            case "ASSOCIATE": return "Associate"
            case "SENIOR": return "Senior"
            case "MANAGER": return "Manager"
            case "NONE": return "Unassigned"
            default: return role
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case "ASSOCIATE": return "bg-blue-100 text-blue-700 border-blue-200"
            case "SENIOR": return "bg-purple-100 text-purple-700 border-purple-200"
            case "MANAGER": return "bg-indigo-100 text-indigo-700 border-indigo-200"
            default: return "bg-slate-100 text-slate-700 border-slate-200"
        }
    }

    const handleAddStep = () => {
        setEditingTemplate(null)
        setIsDialogOpen(true)
    }

    const handleEditStep = (template: TaskTemplate) => {
        setEditingTemplate(template)
        setIsDialogOpen(true)
    }

    const handleSaveStep = async (data: any) => {
        if (editingTemplate) {
            // Update
            const updated = await updateTaskTemplate(editingTemplate.id, data)
            setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t).sort((a, b) => (a.relativeDueDays || 0) - (b.relativeDueDays || 0)))
        } else {
            // Create
            const created = await addTaskTemplate(group.id, data)
            setTemplates(prev => [...prev, created].sort((a, b) => (a.relativeDueDays || 0) - (b.relativeDueDays || 0)))
        }
    }

    const handleDelete = async (e: React.MouseEvent, templateId: string) => {
        e.stopPropagation() // Prevent opening edit dialog
        if (!confirm("Are you sure you want to delete this step?")) return

        setTemplates(prev => prev.filter(t => t.id !== templateId))
        await deleteTaskTemplate(templateId)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/templates')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Task Groups
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">{group.name}</h2>
                    <p className="text-muted-foreground text-sm">Edit workflow steps and assignments</p>
                </div>
            </div>

            <div className="space-y-4">
                {templates.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                        <p className="text-muted-foreground mb-4">No steps in this workflow yet.</p>
                        <Button onClick={handleAddStep}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Step
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <div className="col-span-12">Step Details</div>
                        </div>

                        {templates.map((t) => (
                            <div
                                key={t.id}
                                className="grid grid-cols-12 gap-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => handleEditStep(t)}
                            >
                                {/* Content Column */}
                                <div className="col-span-12 p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-base">{t.title}</h3>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 flex items-center gap-1">
                                                {t.priority}
                                            </Badge>
                                            {t.requiresDocument && (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 flex items-center gap-1">
                                                    <FileText className="h-3 w-3" /> Doc Req
                                                </Badge>
                                            )}
                                            {t.isRecurring && (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 flex items-center gap-1">
                                                    <Repeat className="h-3 w-3" /> {t.recurrenceInterval}
                                                </Badge>
                                            )}
                                        </div>
                                        {t.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">{t.description}</p>
                                        )}
                                        {t.taskType && (
                                            <p className="text-xs text-muted-foreground/80">Type: {t.taskType}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Role Badge */}
                                        <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", getRoleColor(t.assigneeRole || "ASSOCIATE"))}>
                                            {getRoleLabel(t.assigneeRole || "ASSOCIATE")}
                                        </span>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleDelete(e, t.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            className="w-full border-dashed py-6 text-muted-foreground hover:text-primary mt-4"
                            onClick={handleAddStep}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Step
                        </Button>
                    </div>
                )}
            </div>

            <TemplateStepDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSaveStep}
                initialData={editingTemplate}
                mode={editingTemplate ? "edit" : "create"}
            />
        </div>
    )
}

"use client"

import { useState } from "react"
import { assignTemplate } from "@/actions/template-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

import { Play, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function ApplyTemplateDialog({
    group,
    projects
}: {
    group: { id: string; name: string; templates: { assigneeRole: string | null }[] },
    projects: { id: string; name: string; manager?: { name: string | null } | null; senior?: { name: string | null } | null; associate?: { name: string | null } | null }[]
}) {
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
    const [step, setStep] = useState<"select" | "preview">("select")

    const toggleProject = (id: string) => {
        setSelectedProjectIds(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedProjectIds.length === projects.length) {
            setSelectedProjectIds([])
        } else {
            setSelectedProjectIds(projects.map(p => p.id))
        }
    }

    // Role calculations
    const tasksByRole = group.templates.reduce((acc, t) => {
        const role = t.assigneeRole || "ASSOCIATE" // Default
        acc[role] = (acc[role] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // Get unique roles needed
    const requiredRoles = Object.keys(tasksByRole)

    async function handleSubmit() {
        if (selectedProjectIds.length === 0) return

        setPending(true)
        const formData = new FormData()
        formData.append("groupId", group.id)
        formData.append("projectIds", JSON.stringify(selectedProjectIds))
        const startDate = (document.getElementById("startDate") as HTMLInputElement)?.value || new Date().toISOString().split('T')[0]
        formData.append("startDate", startDate)

        try {
            const result = await assignTemplate(formData)
            if (result?.error) {
                console.error(result.error)
            } else {
                setOpen(false)
                setSelectedProjectIds([])
                setStep("select")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setStep("select"); }}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                    <Play className="h-4 w-4" /> Assign Workflow
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Assign "{group.name}"</DialogTitle>
                    <DialogDescription>
                        {step === "select"
                            ? "Select projects to assign this workflow to. Tasks will be created and linked."
                            : "Review assignments before activating workflow."}
                    </DialogDescription>
                </DialogHeader>

                {step === "select" ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Projects ({selectedProjectIds.length} selected)</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={toggleAll} className="h-auto p-0 text-xs">
                                    {selectedProjectIds.length === projects.length ? "Deselect All" : "Select All"}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Projects with missing roles for this template will be highlighted.</p>

                            <div className="border rounded-md p-2">
                                <div className="h-[250px] overflow-y-auto pr-2 space-y-1">
                                    {projects.map((p) => {
                                        // Check for missing roles
                                        const missingRoles = requiredRoles.filter(role => {
                                            if (role === 'ASSOCIATE' && !p.associate) return true
                                            if (role === 'SENIOR' && !p.senior) return true
                                            if (role === 'MANAGER' && !p.manager) return true
                                            return false
                                        })

                                        return (
                                            <div key={p.id} className={cn(
                                                "flex items-center space-x-2 p-2 rounded border transition-colors",
                                                selectedProjectIds.includes(p.id) ? "bg-primary/5 border-primary/20" : "border-transparent hover:bg-muted"
                                            )}>
                                                <Checkbox
                                                    id={p.id}
                                                    checked={selectedProjectIds.includes(p.id)}
                                                    onCheckedChange={() => toggleProject(p.id)}
                                                />
                                                <label
                                                    htmlFor={p.id}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium">{p.name}</span>
                                                        {missingRoles.length > 0 && (
                                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                                Missing: {missingRoles.join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                                                        <span>M: {p.manager?.name || '-'}</span>
                                                        <span className="text-muted-foreground/30">|</span>
                                                        <span>S: {p.senior?.name || '-'}</span>
                                                        <span className="text-muted-foreground/30">|</span>
                                                        <span>A: {p.associate?.name || '-'}</span>
                                                    </div>
                                                </label>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date (T+0)</Label>
                            <Input id="startDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>

                        <Button
                            className="w-full"
                            disabled={selectedProjectIds.length === 0}
                            onClick={() => setStep("preview")}
                        >
                            Next: Preview Assignments
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/30 p-3 rounded-md space-y-2">
                                <h4 className="text-sm font-medium">Task Breakdown</h4>
                                <ul className="space-y-1">
                                    {Object.entries(tasksByRole).map(([role, count]: [string, number]) => (
                                        <li key={role} className="text-xs flex justify-between">
                                            <span className="text-muted-foreground capitalize">{role.toLowerCase()}</span>
                                            <span className="font-mono font-bold">{count} tasks</span>
                                        </li>
                                    ))}
                                    <li className="text-xs flex justify-between border-t pt-1 mt-1 font-medium">
                                        <span>Total per Project</span>
                                        <span>{group.templates.length}</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-md space-y-2 flex flex-col justify-center text-center">
                                <span className="text-3xl font-bold">{selectedProjectIds.length}</span>
                                <span className="text-xs text-muted-foreground">Projects Selected</span>
                                <span className="text-xs font-medium text-primary mt-1">
                                    {selectedProjectIds.length * group.templates.length} Total Tasks to Create
                                </span>
                            </div>
                        </div>

                        <div className="rounded-md border bg-blue-50 p-3 text-blue-800 text-xs">
                            <p className="font-semibold mb-1">Confirmation</p>
                            <p>You are assigning this workflow to {selectedProjectIds.length} projects. Tasks will be created with their recurrence settings and assigned to the current project roles.</p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>Back</Button>
                            <Button className="flex-1" onClick={handleSubmit} disabled={pending}>
                                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Assign"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

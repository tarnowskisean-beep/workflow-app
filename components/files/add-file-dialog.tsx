"use client"

import { useState } from "react"
import { createFileLog } from "@/actions/file-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"

type ProjectOption = { id: string; name: string }

export function AddFileDialog({ projects, tasks = [] }: { projects: ProjectOption[], tasks?: any[] }) {
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [selectedTaskId, setSelectedTaskId] = useState<string>("")

    async function handleSubmit(formData: FormData) {
        setPending(true)
        if (!selectedProjectId) {
            alert("Please select a project")
            setPending(false)
            return
        }

        // If task selected, we might want to update it? 
        // For now, the action processes the form. We just need to make sure taskId is sent.
        if (selectedTaskId && selectedTaskId !== "none") {
            formData.set("taskId", selectedTaskId)
        }

        const result = await createFileLog(formData)
        setPending(false)

        if (result?.success) {
            setOpen(false)
            // Reset state
            setSelectedProjectId("")
            setSelectedTaskId("")
        } else {
            console.error(result?.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Add File
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add File Link</DialogTitle>
                    <DialogDescription>
                        Log a completed deliverable.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">File Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Q4 Report" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="driveLink">Drive Link</Label>
                        <Input id="driveLink" name="driveLink" placeholder="https://docs.google.com/..." required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="projectId">Project</Label>
                        <Select name="projectId" onValueChange={setSelectedProjectId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedProjectId && (
                        <div className="space-y-2">
                            <Label htmlFor="taskId">Task (Optional)</Label>
                            <Select name="taskId" onValueChange={setSelectedTaskId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Task to Complete" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Create New Task</SelectItem>
                                    {tasks
                                        .filter(t => t.projectId === selectedProjectId && t.status !== "DONE") // Only show open tasks for this project
                                        .map((t) => (
                                            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Select an existing task to mark it as done, or leave as "Create New" to log a separate file.
                            </p>
                        </div>
                    )}


                    <DialogFooter>
                        <Button type="submit" disabled={pending}>
                            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save File"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}

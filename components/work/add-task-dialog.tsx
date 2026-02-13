"use client"

import { useState } from "react"
import { createTask } from "@/actions/task-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Loader2 } from "lucide-react"

import { RecurrencePicker, RecurrenceInterval } from "./recurrence-picker"

type ProjectOption = { id: string; name: string; allowedTaskTypes?: string }

export function AddTaskDialog({ projects = [], users = [], defaultProjectId }: { projects?: ProjectOption[], users?: any[], defaultProjectId?: string }) {
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)
    const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>(null)
    const [recurrenceDays, setRecurrenceDays] = useState<string[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || "")
    const [selectedTaskType, setSelectedTaskType] = useState<string>("")

    const getTaskTypesForProject = (pid: string) => {
        const proj = projects.find(p => p.id === pid)
        if (!proj || !proj.allowedTaskTypes) return []
        const types = proj.allowedTaskTypes.split(",").map(t => t.trim()).filter(Boolean)
        return types
    }

    async function handleSubmit(formData: FormData) {
        setPending(true)

        // Ensure taskType is set in formData if controlled
        if (selectedTaskType) {
            formData.set("taskType", selectedTaskType)
        }

        // Handle recurrence data
        if (recurrenceInterval) {
            formData.set("recurrenceInterval", recurrenceInterval)
            if (recurrenceInterval === "WEEKLY" && recurrenceDays.length > 0) {
                formData.set("recurrenceDays", recurrenceDays.join(","))
            }
        } else {
            formData.delete("recurrenceInterval")
        }

        const result = await createTask(formData)
        setPending(false)

        if (result?.success) {
            setOpen(false)
            // Reset form details if needed, but keep defaultProjectId if present
            if (!defaultProjectId) setSelectedProjectId("")
            setSelectedTaskType("") // Reset type
            setRecurrenceInterval(null)
            setRecurrenceDays([])
        } else {
            alert(result?.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> New Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Create a standalone task.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" required placeholder="Task name..." />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Details..." />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="requiresDocument"
                            name="requiresDocument"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="requiresDocument" className="font-normal">Requires a document (e.g. Google Drive link)</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="assigneeId">Assignee</Label>
                            <Select name="assigneeId" defaultValue="me">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="me">Assign to Me</SelectItem>
                                    <SelectItem value="none">Unassigned</SelectItem>
                                    {users.map((u: any) => (
                                        <SelectItem key={u.id} value={u.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={u.avatarUrl || ""} />
                                                    <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                {u.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="projectId">Project</Label>
                            <Select
                                name="projectId"
                                value={selectedProjectId}
                                onValueChange={setSelectedProjectId}
                                required
                                disabled={!!defaultProjectId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Internal)</SelectItem>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {defaultProjectId && <input type="hidden" name="projectId" value={defaultProjectId} />}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select name="priority" defaultValue="P2">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="P0">P0 (Critical)</SelectItem>
                                    <SelectItem value="P1">P1 (High)</SelectItem>
                                    <SelectItem value="P2">P2 (Normal)</SelectItem>
                                    <SelectItem value="P3">P3 (Low)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div >

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date {recurrenceInterval && <span className="text-red-500">*</span>}</Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                required={!!recurrenceInterval}
                            />
                        </div>

                        <div className="space-y-2">
                            <RecurrencePicker
                                interval={recurrenceInterval}
                                onIntervalChange={setRecurrenceInterval}
                                days={recurrenceDays}
                                onDaysChange={setRecurrenceDays}
                            />
                        </div>
                    </div>

                    {/* Task Type Selection */}
                    {
                        selectedProjectId && selectedProjectId !== "none" && (
                            <div className="space-y-2">
                                <Label htmlFor="taskType">Task Type <span className="text-red-500">*</span></Label>
                                <Select
                                    name="taskType"
                                    required
                                    value={selectedTaskType}
                                    onValueChange={setSelectedTaskType}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getTaskTypesForProject(selectedProjectId).length > 0 ? (
                                            getTaskTypesForProject(selectedProjectId).map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>No types defined for this project</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )
                    }

                    {
                        recurrenceInterval && (
                            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded border">
                                <p>
                                    Task will repeat <strong>{recurrenceInterval}</strong>
                                    {recurrenceInterval === 'WEEKLY' && recurrenceDays.length > 0 && ` on ${recurrenceDays.join(", ")}`}
                                    . Next task created upon completion.
                                </p>
                            </div>
                        )
                    }

                    <DialogFooter>
                        <Button type="submit" disabled={pending}>
                            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Task"}
                        </Button>
                    </DialogFooter>
                </form >
            </DialogContent >
        </Dialog >
    )
}

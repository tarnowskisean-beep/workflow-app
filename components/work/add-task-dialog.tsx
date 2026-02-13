"use client"

import { useState, useRef } from "react"
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
    const isSubmittingRef = useRef(false)

    const getTaskTypesForProject = (pid: string) => {
        const proj = projects.find(p => p.id === pid)
        if (!proj || !proj.allowedTaskTypes) return []
        const types = proj.allowedTaskTypes.split(",").map(t => t.trim()).filter(Boolean)
        return types
    }

    async function handleSubmit(formData: FormData) {
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true
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

        try {
            const result = await createTask(formData)

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
        } catch (e) {
            console.error(e)
            alert("An error occurred")
        } finally {
            setPending(false)
            isSubmittingRef.current = false
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


                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date {recurrenceInterval && <span className="text-red-500">*</span>}</Label>
                        {recurrenceInterval ? (
                            <div className="p-2 border rounded bg-muted/20 text-sm">
                                <span className="text-muted-foreground">First instance: </span>
                                <span className="font-medium">
                                    {/* We need to calculate this. Since we can't easily run the import function client-side if it uses date-fns efficiently without bloat? 
                                            Actually we can just logic it simply or assume the user wants it Today or Next X.
                                            But wait, we imported 'recurrence-picker' which is client.
                                            'calculateFirstInstance' is in 'lib/recurrence.ts'. Is it client safe? Yes.
                                        */}
                                    {(() => {
                                        // Simple client-side calc or use effect?
                                        // Let's rely on backend to set the correct DueDate if we omit it? 
                                        // No, we want to show it.
                                        // We can't easily use the imported function inside JSX directly if not state.
                                        // Let's add a useEffect to update a 'calculatedDate' state?
                                        // Or just render generic text "Determined by recurrence"
                                        return "Auto-set by recurrence rule"
                                    })()}
                                </span>
                                <input type="hidden" name="dueDate" value={new Date().toISOString().split('T')[0]} />
                                {/* 
                                      Wait, if we send Today, and Recurrence is "Next Friday".
                                      The BACKEND logic I wrote earlier creates the task.
                                      If create task takes "dueDate" as "Today".
                                      Then "Today" is the due date.
                                      If the User picked "Weekly on Friday" (and today is Thu), they want "Friday".
                                      So I MUST calculate it before submit or on Server.
                                      
                                      Let's update the SERVER ACTION 'createTask' to handle this.
                                      If isRecurring is true, we can recalculate the dueDate based on the rule starting from "Today".
                                      
                                      So here we just say "Determined by recurrence".
                                      And send a dummy date (or empty) and let server handle?
                                      Server schema validates 'dueDate' as date.
                                      I will send Today's date as placeholder.
                                    */}
                            </div>
                        ) : (
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                required
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <RecurrencePicker
                            interval={recurrenceInterval}
                            onIntervalChange={setRecurrenceInterval}
                            days={recurrenceDays}
                            onDaysChange={setRecurrenceDays}
                        />
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

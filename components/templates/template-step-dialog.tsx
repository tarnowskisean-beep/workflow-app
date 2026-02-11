"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { RecurrencePicker, RecurrenceInterval } from "../work/recurrence-picker"

interface TemplateStepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (data: any) => Promise<void>
    initialData?: any
    mode: "create" | "edit"
}

export function TemplateStepDialog({ open, onOpenChange, onSave, initialData, mode }: TemplateStepDialogProps) {
    const [pending, setPending] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [taskType, setTaskType] = useState("General")
    const [role, setRole] = useState("ASSOCIATE")
    const [priority, setPriority] = useState("P2")
    const [relativeDueDays, setRelativeDueDays] = useState(0)
    const [requiresDocument, setRequiresDocument] = useState(false)
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>(null)
    const [recurrenceDays, setRecurrenceDays] = useState<string[]>([])

    // Roles based on Project schema
    const roles = [
        { value: "ASSOCIATE", label: "Associate" },
        { value: "SENIOR", label: "Senior" },
        { value: "MANAGER", label: "Manager" },
        { value: "NONE", label: "Unassigned" }
    ]

    useEffect(() => {
        if (open) {
            if (mode === "edit" && initialData) {
                setTitle(initialData.title || "")
                setDescription(initialData.description || "")
                setTaskType(initialData.taskType || "General")
                setRole(initialData.assigneeRole || "ASSOCIATE")
                setPriority(initialData.priority || "P2")
                setRelativeDueDays(initialData.relativeDueDays || 0)
                setRequiresDocument(initialData.requiresDocument || false)
                setIsRecurring(initialData.isRecurring || false)
                setRecurrenceInterval(initialData.recurrenceInterval || null)
                setRecurrenceDays(initialData.recurrenceDays ? initialData.recurrenceDays.split(",") : [])
            } else {
                // Reset for create
                setTitle("")
                setDescription("")
                setTaskType("General")
                setRole("ASSOCIATE")
                setPriority("P2")
                setRelativeDueDays(0)
                setRequiresDocument(false)
                setIsRecurring(false)
                setRecurrenceInterval(null)
                setRecurrenceDays([])
            }
        }
    }, [open, mode, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setPending(true)

        const data = {
            title,
            description,
            taskType,
            assigneeRole: role,
            priority,
            relativeDueDays,
            requiresDocument,
            isRecurring,
            recurrenceInterval: isRecurring ? recurrenceInterval : null,
            recurrenceDays: isRecurring ? (recurrenceInterval === 'WEEKLY' ? recurrenceDays.join(",") : recurrenceDays[0]) : null
        }

        try {
            await onSave(data)
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Add Template Step" : "Edit Step"}</DialogTitle>
                    <DialogDescription>
                        Define the details for this workflow step.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Bank Reconciliation"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Assignee Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => (
                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="P0">Critical (P0)</SelectItem>
                                    <SelectItem value="P1">High (P1)</SelectItem>
                                    <SelectItem value="P2">Normal (P2)</SelectItem>
                                    <SelectItem value="P3">Low (P3)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>



                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Instructions for this step..."
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="taskType">Task Type</Label>
                        <Select value={taskType} onValueChange={setTaskType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Bookkeeping">Bookkeeping</SelectItem>
                                <SelectItem value="Audit">Audit</SelectItem>
                                <SelectItem value="Meeting">Meeting</SelectItem>
                                <SelectItem value="990">990</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                        <Switch
                            id="requiresDocument"
                            checked={requiresDocument}
                            onCheckedChange={setRequiresDocument}
                        />
                        <Label htmlFor="requiresDocument" className="font-normal">Requires a document link</Label>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isRecurring"
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                            />
                            <Label htmlFor="isRecurring">Recurring Step?</Label>
                        </div>

                        {isRecurring && (
                            <RecurrencePicker
                                interval={recurrenceInterval}
                                onIntervalChange={setRecurrenceInterval}
                                days={recurrenceDays}
                                onDaysChange={setRecurrenceDays}
                            />
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={pending}>
                            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (mode === "create" ? "Add Step" : "Save Changes")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

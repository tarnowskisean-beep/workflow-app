import { useState, useEffect } from "react"
import { Loader2, Clock, CheckCircle2, Trash2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { logTime, updateTimeEntry, deleteTimeEntry } from "@/actions/time-actions"
import { useTimer } from "@/components/providers/timer-provider"

interface TimeLogDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task?: any // Optional now
    tasks?: any[] // List of tasks for selection
    projects?: any[] // List of projects
    entryToEdit?: any // If editing
    initialValues?: { projectId?: string, taskId?: string, notes?: string } // For duplicating/starting from existing
    defaultDate?: string
    onComplete: () => void
}

export function TimeLogDialog({ open, onOpenChange, task, tasks = [], projects = [], entryToEdit, initialValues, defaultDate, onComplete }: TimeLogDialogProps) {
    const { startTimer, activeTimer } = useTimer()
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState<string>(defaultDate || new Date().toISOString().split('T')[0])

    // State for selection if generic
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [selectedTaskId, setSelectedTaskId] = useState<string>("")

    // Initialize state when entryToEdit changes or dialog opens
    useEffect(() => {
        if (entryToEdit) {
            setDate(new Date(entryToEdit.startedAt).toISOString().split('T')[0])
            setSelectedProjectId(entryToEdit.projectId || "")
            setSelectedTaskId(entryToEdit.workItemId || "")
        } else if (initialValues) {
            setDate(new Date().toISOString().split('T')[0]) // Default to today for new entry
            setSelectedProjectId(initialValues.projectId || "")
            setSelectedTaskId(initialValues.taskId || "")
        } else if (task) {
            setSelectedProjectId(task.projectId || "")
            setSelectedTaskId(task.id)
        } else {
            // Reset if creating new
            // But don't reset date if passed as defaultDate
            if (open && !entryToEdit) {
                setSelectedProjectId("")
                setSelectedTaskId("")
            }
        }
    }, [entryToEdit, task, initialValues, open])

    async function handleStartTimer() {
        if (!selectedProjectId) {
            // Validate project selection
            alert("Please select a project first")
            return
        }

        // If active timer exists, warn/stop? Context handles it (returns error if exists action side)
        // But UI should disable if activeTimer is present
        if (activeTimer) {
            alert("A timer is already running. Please stop it first.")
            return
        }

        const notes = (document.getElementById('notes') as HTMLTextAreaElement)?.value

        await startTimer(selectedProjectId, selectedTaskId || undefined, notes)
        onOpenChange(false)
        // onComplete() // Don't refresh list yet, better to just close dialog. 
        // Or if list shows running, then yes.
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)

        try {
            // Validation
            if (!selectedProjectId || selectedProjectId === "none") {
                alert("Please select a project")
                return
            }
            if (!selectedTaskId || selectedTaskId === "none") {
                alert("Please select a task")
                return
            }

            let result
            // If editing
            if (entryToEdit) {
                formData.set("date", new Date(date).toISOString())
                formData.set("projectId", selectedProjectId)
                formData.set("workItemId", selectedTaskId)
                result = await updateTimeEntry(entryToEdit.id, formData)
            } else {
                // Creating new
                formData.append("workItemId", selectedTaskId)
                formData.append("projectId", selectedProjectId)

                // Ensure date is valid before appending
                const submitDate = date ? new Date(date) : new Date()
                formData.set("date", submitDate.toISOString())

                result = await logTime(formData)
            }

            if (result?.error) {
                alert(typeof result.error === 'string' ? result.error : "Failed to save time entry")
                return
            }

            onComplete()
        } catch (error) {
            console.error("Submit error:", error)
            alert("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!entryToEdit) return
        if (!confirm("Are you sure you want to delete this time entry?")) return
        setLoading(true)
        await deleteTimeEntry(entryToEdit.id)
        setLoading(false)
        onComplete()
    }

    const isEditMode = !!entryToEdit

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditMode ? "Edit Time Entry" : "Log Time"}
                    </DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    {/* Project/Task Selection - Show if not pre-bound to a SPECIFIC task prop (contextual add) */}
                    {!task && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <Select
                                    value={selectedProjectId}
                                    onValueChange={(val) => {
                                        setSelectedProjectId(val)
                                        setSelectedTaskId("") // Reset task when project changes
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a project..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Task</Label>
                                <Select
                                    value={selectedTaskId}
                                    onValueChange={setSelectedTaskId}
                                    disabled={!selectedProjectId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={!selectedProjectId ? "Select a project first" : "Select a task"} />
                                    </SelectTrigger>
                                    <SelectContent>

                                        {tasks
                                            .filter(t => t.projectId === selectedProjectId)
                                            .map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.title}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Read-only display ONLY if strictly bound to a task prop (contextual add) */}
                    {task && (
                        <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                            {task.title}
                        </div>
                    )}


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="durationMinutes">Duration (min)</Label>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="durationMinutes"
                                    name="durationMinutes"
                                    type="number"
                                    min="1"
                                    defaultValue={entryToEdit ? entryToEdit.durationSeconds / 60 : "15"}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Briefly describe what you did..."
                            defaultValue={entryToEdit?.notes || ""}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 sm:justify-between items-center">
                        {/* Left side actions */}
                        <div className="flex gap-2">
                            {isEditMode && (
                                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            )}
                            {!isEditMode && !activeTimer && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleStartTimer}
                                    disabled={loading || (!selectedProjectId && !task)}
                                    className="gap-2"
                                >
                                    <Play className="h-4 w-4" /> Start Timer
                                </Button>
                            )}
                        </div>

                        {/* Right side actions */}
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? "Update Entry" : "Save Entry")}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

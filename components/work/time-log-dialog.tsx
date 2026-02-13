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
    const [selectedTaskType, setSelectedTaskType] = useState<string>("")

    // Debug logging effect
    useEffect(() => {
        if (open) {
            console.log("TimeLogDialog - Projects:", projects)
            const currentProject = projects.find(p => p.id === selectedProjectId)
            console.log("TimeLogDialog - Selected Project ID:", selectedProjectId)
            console.log("TimeLogDialog - Selected Project Data:", currentProject)
            console.log("TimeLogDialog - Allowed Task Types Raw:", currentProject?.allowedTaskTypes)

            if (currentProject?.allowedTaskTypes) {
                const types = currentProject.allowedTaskTypes.split(',').map((t: string) => t.trim()).filter(Boolean)
                console.log("TimeLogDialog - Parsed Types:", types)
            }
        }
    }, [open, projects, selectedProjectId])

    // Initialize state when entryToEdit changes or dialog opens
    useEffect(() => {
        if (entryToEdit) {
            setDate(new Date(entryToEdit.startedAt).toISOString().split('T')[0])
            setSelectedProjectId(entryToEdit.projectId || "")
            // Use taskType if available, fallback to workItemId or empty
            setSelectedTaskType(entryToEdit.taskType || entryToEdit.workItemId || "")
        } else if (initialValues) {
            setDate(new Date().toISOString().split('T')[0]) // Default to today for new entry
            setSelectedProjectId(initialValues.projectId || "")
            setSelectedTaskType(initialValues.taskId || "")
        } else if (task) {
            setSelectedProjectId(task.projectId || "")
            setSelectedTaskType(task.taskType || "")
            // Also reset date if provided (e.g. from wrapper)
            if (defaultDate) setDate(defaultDate)
        } else {
            // Reset if creating new
            if (open && !entryToEdit) {
                // Reset date to defaultDate (current page date) or Today
                setDate(defaultDate || new Date().toISOString().split('T')[0])

                setSelectedProjectId("")
                setSelectedTaskType("")
            }
        }
    }, [entryToEdit, task, initialValues, open, defaultDate])

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

        // selectedTaskType now holds the taskType string
        const taskType = selectedTaskType

        await startTimer(selectedProjectId, taskType || undefined, undefined, notes)
        onOpenChange(false)
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)

        try {
            // Validation
            if (!selectedProjectId || selectedProjectId === "none") {
                alert("Please select a project")
                return
            }
            if (!selectedTaskType) {
                alert("Please select a task type")
                return
            }

            let result

            // selectedTaskType now holds the taskType string
            const taskType = selectedTaskType

            // If editing
            if (entryToEdit) {
                formData.set("date", new Date(date).toISOString())
                formData.set("projectId", selectedProjectId)
                formData.set("taskType", taskType)
                // Clear workItemId if we are switching to task types primarily
                formData.delete("workItemId")
                result = await updateTimeEntry(entryToEdit.id, formData)
            } else {
                // Creating new
                if (taskType) formData.append("taskType", taskType)
                formData.append("projectId", selectedProjectId)

                // Ensure date is valid before appending
                // Construct a local date object from "YYYY-MM-DD" string to avoid UTC midnight shift
                // We set it to local noon to be safe from DST shifts, or use current time if it is today
                let submitDate: Date

                if (date) {
                    const [y, m, d] = date.split('-').map(Number)
                    // Create date in local time (noon to be safe)
                    submitDate = new Date(y, m - 1, d, 12, 0, 0)
                } else {
                    submitDate = new Date()
                }

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
            {/* ... (DialogContent -> Header) ... */}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditMode ? "Edit Time Entry" : "Log Time"}
                    </DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    {/* Project/Task Selection - Show if not pre-bound to a SPECIFIC task prop (contextual add) */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Project</Label>
                            {!task ? (
                                <Select
                                    value={selectedProjectId}
                                    onValueChange={(val) => {
                                        setSelectedProjectId(val)
                                        setSelectedTaskType("") // Reset task when project changes
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
                            ) : (
                                <div className="text-sm font-medium p-2 bg-muted rounded border">
                                    {task.project?.name || "Unknown Project"}
                                    <div className="text-xs text-muted-foreground font-normal mt-0.5">{task.title}</div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Task Type</Label>
                            <Select
                                value={selectedTaskType}
                                onValueChange={setSelectedTaskType}
                                disabled={!selectedProjectId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={!selectedProjectId ? "Select a project first" : "Select a task type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        // Try to find project in list, OR fallback to task.project if available
                                        let project = projects.find(p => p.id === selectedProjectId)

                                        // Fallback for when 'projects' prop is empty but 'task' has nested project data
                                        if (!project && task && task.project && task.projectId === selectedProjectId) {
                                            project = task.project
                                        }

                                        if (!project || !project.allowedTaskTypes) {
                                            return <SelectItem value="none" disabled>No types defined for project</SelectItem>
                                        }

                                        // Handle both comma-string (DB) or array (if pre-parsed, though unlikely here)
                                        const types = typeof project.allowedTaskTypes === 'string'
                                            ? project.allowedTaskTypes.split(',').map((t: string) => t.trim()).filter(Boolean)
                                            : []

                                        if (types.length === 0) {
                                            return <SelectItem value="none" disabled>No types defined for project</SelectItem>
                                        }

                                        return types.map((type: string) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))
                                    })()}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>




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

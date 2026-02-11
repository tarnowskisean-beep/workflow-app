
"use client"

import { useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    Calendar as CalendarIcon, Loader2, Clock, CheckCircle2,
    Link,
    Paperclip
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { cn } from "@/lib/utils"
import { updateTaskDetails, updateTaskStatus } from "@/actions/task-actions"
import { logTime } from "@/actions/time-actions"
import { TimeLogDialog } from "@/components/work/time-log-dialog"
import { User } from "@prisma/client"

interface TaskDetailSheetProps {
    task: any // specific type would be better but using any for flexibility with prisma includes
    open: boolean
    onOpenChange: (open: boolean) => void
    users: any[]
    currentUserRole?: string
    currentUserId?: string
}

export function TaskDetailSheet({ task, open, onOpenChange, users, currentUserRole, currentUserId }: TaskDetailSheetProps) {
    console.log("TaskDetailSheet Render:", {
        taskId: task?.id,
        currentUserRole,
        currentUserId,
        usersCount: users.length,
        assigneeId: task?.assigneeId
    })
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [showTimeLogDialog, setShowTimeLogDialog] = useState(false)

    const [status, setStatus] = useState(task?.status || "OPEN")
    const [priority, setPriority] = useState(task?.priority || "P2")
    const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId || "")
    const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate ? new Date(task.dueDate) : undefined)
    const [title, setTitle] = useState(task?.title || "")
    const [description, setDescription] = useState(task?.description || "")
    const [driveLink, setDriveLink] = useState(task?.driveLink || "")

    const canEditProperties = currentUserRole === "MANAGER" || currentUserRole === "SENIOR" || currentUserRole === "ADMIN" || (currentUserId && task?.assigneeId === currentUserId)

    // Assignee Permission Logic:
    // - Admins & Managers can change anyone
    // - Seniors can only change tasks assigned to Associates (or unassigned)
    // - Associates can never change assignee

    // Find current assignee in users list to get their role
    const currentAssigneeUser = users.find(u => u.id === (task?.assigneeId || assigneeId))
    const currentAssigneeRole = currentAssigneeUser?.role || "ASSOCIATE" // Default to associate if unknown/unassigned handling

    const canChangeAssignee =
        currentUserRole === "ADMIN" ||
        currentUserRole === "MANAGER" ||
        (currentUserRole === "SENIOR" && (currentAssigneeRole === "ASSOCIATE" || !task?.assigneeId))

    // Update local state when task changes (e.g. re-opening sheet for different task)
    useEffect(() => {
        if (task) {
            setStatus(task.status)
            setPriority(task.priority)
            setAssigneeId(task.assigneeId || "")
            setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
            setTitle(task.title)
            setDescription(task.description || "")
            setDriveLink(task.driveLink || "")
        }
    }, [task, open])

    if (!task) return null

    async function handleSave() {
        // Used for onBlur events where state is already updated in previous renders
        // We can trust specific state variables here for TextInputs
        const formData = new FormData()
        formData.set("title", title)
        formData.set("description", description)
        formData.set("priority", priority)
        if (dueDate) formData.set("dueDate", dueDate.toISOString())
        if (assigneeId && assigneeId !== "unassigned") formData.set("assigneeId", assigneeId)

        const result = await updateTaskDetails(task.id, formData)
        if (result.success) {
            router.refresh()
        }
    }

    // Explicit save for immediate interactions (Select, DatePicker) to avoid stale state in closures
    async function saveProperty(updates: { assigneeId?: string, priority?: string, dueDate?: Date, title?: string, description?: string }) {
        // 1. Optimistic Update
        if (updates.assigneeId !== undefined) setAssigneeId(updates.assigneeId)
        if (updates.priority !== undefined) setPriority(updates.priority)
        if (updates.dueDate !== undefined) setDueDate(updates.dueDate)
        if (updates.title !== undefined) setTitle(updates.title)

        // 2. Prepare Data using Overrides
        const formData = new FormData()
        formData.set("title", updates.title ?? title)
        formData.set("description", updates.description ?? description)
        formData.set("priority", updates.priority ?? priority)

        const d = updates.dueDate !== undefined ? updates.dueDate : dueDate
        if (d) formData.set("dueDate", d.toISOString())

        const a = updates.assigneeId !== undefined ? updates.assigneeId : assigneeId
        if (a && a !== "unassigned") formData.set("assigneeId", a)

        // 3. Save
        try {
            const result = await updateTaskDetails(task.id, formData)
            if (result.success) {
                router.refresh()
            } else {
                alert("Server Error: " + result.message)
                router.refresh()
            }
        } catch (e) {
            alert("Network/Client Error: " + (e as Error).message)
            console.error(e)
            router.refresh()
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (newStatus === "DONE" && task.requiresDocument && !driveLink) {
            alert("This task requires a Google Drive link before it can be completed.")
            return
        }

        setStatus(newStatus) // Optimistic update

        if (newStatus === "DONE" && status !== "DONE") {
            // Trigger Time Log Flow
            setShowTimeLogDialog(true)
        } else {
            // Just update status
            const result = await updateTaskStatus(task.id, newStatus)
            if (!result.success) {
                alert(result.message)
                setStatus(status) // Revert
                router.refresh()
            } else {
                router.refresh()
            }
        }
    }

    async function handleLinkAdd(url: string) {
        // Validate and save link
        if (!url) return
        // Call server action
        const { addDocumentLink } = await import("@/actions/task-actions")
        await addDocumentLink(task.id, url)
        setDriveLink(url)
        router.refresh()
    }

    const copyTaskLink = () => {
        const url = `${window.location.origin}/work?taskId=${task.id}`
        navigator.clipboard.writeText(url)
        // Could show toast here
        alert("Link copied to clipboard")
    }

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="sm:max-w-[600px] w-full p-0 flex flex-col gap-0 bg-background/95 backdrop-blur-sm sm:border-l">
                    {/* Premium Header Area */}
                    <SheetHeader className="px-6 py-5 border-b bg-muted/5">
                        <SheetTitle className="sr-only">Task Details</SheetTitle>
                        <div className="flex items-center justify-between mb-4">
                            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground bg-background/50">
                                {task.project?.code}-{task.id.slice(-4)}
                            </Badge>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-muted/80"
                                    onClick={copyTaskLink}
                                    title="Copy Link"
                                >
                                    <Link className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Separator orientation="vertical" className="h-4" />
                                <Select value={status} onValueChange={handleStatusChange}>
                                    <SelectTrigger className="h-8 text-xs border-transparent bg-muted/50 hover:bg-muted transition-colors rounded-md px-3 gap-2 font-medium">
                                        <div className={cn("w-2 h-2 rounded-full",
                                            status === 'DONE' ? 'bg-green-500' : 'bg-slate-300'
                                        )} />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent align="end" className="z-[100]">
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="DONE">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Project Breadcrumb */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground/80 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-sm bg-primary/60" />
                                    {task.project?.name || "No Project"}
                                </span>
                            </div>

                            {/* Title Input */}
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleSave}
                                disabled={!canEditProperties}
                                className="w-full text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-muted-foreground/40 leading-tight text-foreground transition-colors hover:text-foreground/90 disabled:cursor-not-allowed disabled:opacity-70"
                                placeholder="Task title"
                            />
                        </div>
                    </SheetHeader>

                    {/* Main Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-6 py-6 space-y-8">

                            {/* Action Bar (Attach Link) */}
                            {!driveLink && (
                                <div className="flex items-center gap-3">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 text-xs border-dashed text-muted-foreground hover:text-foreground hover:border-solid hover:bg-transparent" disabled={!canEditProperties}>
                                                <Paperclip className="h-3.5 w-3.5 mr-2" />
                                                Add Google Drive Link
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0" align="start">
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault()
                                                    const form = e.target as HTMLFormElement
                                                    const input = form.elements.namedItem('url') as HTMLInputElement
                                                    handleLinkAdd(input.value)
                                                }}
                                                className="p-3 flex gap-2"
                                            >
                                                <Input name="url" placeholder="Paste Drive URL..." className="h-8 text-xs" autoFocus />
                                                <Button type="submit" size="sm" className="h-8 text-xs">Add</Button>
                                            </form>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}

                            {/* Attached Link Card */}
                            {driveLink && (
                                <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50/50 border border-blue-100 group transition-all hover:bg-blue-50">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                                        <Paperclip className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-blue-900 truncate">Attached Document</p>
                                        <a href={driveLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                                            {driveLink}
                                        </a>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-blue-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => {
                                            setDriveLink("")
                                            // Ideally call server to remove, but for now just local clear + save would be needed
                                        }}
                                        disabled={!canEditProperties}
                                    >
                                        <span className="sr-only">Remove</span>
                                        <div className="h-3 w-3 rounded-full border border-current flex items-center justify-center">x</div>
                                    </Button>
                                </div>
                            )}

                            {/* Properties Grid - Refined */}
                            <div className="grid grid-cols-12 gap-6">
                                {/* Assignee */}
                                <div className="col-span-6 space-y-2">
                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Assignee</Label>
                                    <Select
                                        value={assigneeId}
                                        onValueChange={(val) => saveProperty({ assigneeId: val })}
                                        disabled={!canChangeAssignee}
                                    >
                                        <SelectTrigger className="w-full text-sm h-10 bg-muted/40 border-transparent hover:bg-muted/60 focus:ring-0 rounded-lg px-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <Avatar className="h-5 w-5 shrink-0 border border-background">
                                                    <AvatarImage src={users.find(u => u.id === assigneeId)?.avatarUrl || ""} />
                                                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                                        {users.find(u => u.id === assigneeId)?.name?.[0] || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="truncate">
                                                    {users.find(u => u.id === assigneeId)?.name || "Unassigned"}
                                                </span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="z-[100]">
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {users.map(u => (
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

                                {/* Due Date */}
                                <div className="col-span-6 space-y-2">
                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Due Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                disabled={!canEditProperties}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal h-10 px-3 bg-muted/40 border-transparent hover:bg-muted/60 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed",
                                                    !dueDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                                <span className="truncate">
                                                    {dueDate ? format(dueDate, "MMMM d, yyyy") : "No date set"}
                                                </span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 z-[100]" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={dueDate}
                                                onSelect={(date) => saveProperty({ dueDate: date })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Priority */}
                                <div className="col-span-6 space-y-2">
                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Priority</Label>
                                    <div className="relative">
                                        <select
                                            value={priority}
                                            onChange={(e) => saveProperty({ priority: e.target.value })}
                                            className={cn(
                                                "w-full appearance-none bg-muted/40 border border-transparent hover:bg-muted/60 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed",
                                                !canEditProperties && "opacity-70 cursor-not-allowed"
                                            )}
                                            disabled={!canEditProperties}
                                        >
                                            <option value="P0">Critical (P0)</option>
                                            <option value="P1">High (P1)</option>
                                            <option value="P2">Normal (P2)</option>
                                            <option value="P3">Low (P3)</option>
                                        </select>
                                        {/* Custom chevron to match design */}
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                            <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-4 pt-6 border-t mt-4">
                                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    Description
                                </Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleSave}
                                    disabled={!canEditProperties}
                                    className="min-h-[240px] bg-muted/20 border-transparent hover:bg-muted/40 focus:bg-background focus:border-input focus:ring-1 focus:ring-primary/20 p-4 rounded-xl text-sm leading-relaxed resize-none transition-all placeholder:text-muted-foreground/50 disabled:opacity-70 disabled:cursor-not-allowed"
                                    placeholder="Add tasks details, notes, and requirements..."
                                />
                            </div>

                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-6 border-t bg-muted/5 mt-auto">
                        <Button
                            className={cn(
                                "w-full h-11 text-sm font-medium transition-all",
                                status === "DONE"
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-primary hover:bg-primary/90"
                            )}
                            onClick={() => handleStatusChange(status === "DONE" ? "OPEN" : "DONE")}
                        >
                            {status === "DONE" ? (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Completed
                                </>
                            ) : (
                                "Mark as Complete"
                            )}
                        </Button>
                    </div>

                </SheetContent>
            </Sheet>

            <TimeLogDialog
                open={showTimeLogDialog}
                onOpenChange={setShowTimeLogDialog}
                task={task}
                onComplete={() => {
                    setShowTimeLogDialog(false)
                    updateTaskStatus(task.id, "DONE")
                    router.refresh()
                    onOpenChange(false)
                }}
            />
        </>
    )
}



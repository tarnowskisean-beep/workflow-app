
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, Circle, Clock, Briefcase, Pencil, Calendar } from "lucide-react"
import { TaskDetailSheet } from "@/components/work/task-detail-sheet"
import { format } from "date-fns"
import { User } from "@prisma/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TimeLogDialog } from "@/components/work/time-log-dialog"
import { updateTaskStatus } from "@/actions/task-actions"
import { useRouter } from "next/navigation"

interface WorkTaskListProps {
    initialWorkItems: any[]
    users: any[]
    currentUserRole?: string
    currentUserId?: string
    initialSelectedTaskId?: string
}

export function WorkTaskList({ initialWorkItems, users, currentUserRole, currentUserId, initialSelectedTaskId }: WorkTaskListProps) {
    console.log("WorkTaskList currentUserRole:", currentUserRole)
    const router = useRouter()
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [taskToLogTime, setTaskToLogTime] = useState<any>(null)

    // Auto-open task if initialSelectedTaskId is provided
    useState(() => {
        if (initialSelectedTaskId) {
            const task = initialWorkItems.find(t => t.id === initialSelectedTaskId)
            if (task) {
                setSelectedTask(task)
                setIsSheetOpen(true)
            }
        }
    })

    // Group items by Project (client-side grouping)
    const grouped = initialWorkItems.reduce((acc, item) => {
        const projectName = item.project?.name || "Internal / No Project"
        if (!acc[projectName]) acc[projectName] = []
        acc[projectName].push(item)
        return acc
    }, {} as Record<string, typeof initialWorkItems>)

    const handleTaskClick = (task: any) => {
        setSelectedTask(task)
        setIsSheetOpen(true)
    }

    const handleQuickComplete = async (e: React.MouseEvent, task: any) => {
        e.stopPropagation()
        if (task.status !== "DONE") {
            if (task.requiresDocument && !task.driveLink) {
                alert("This task requires a Google Drive link. Please open details to add one.")
                handleTaskClick(task)
                return
            }
            // Check if we need to prompt for time log
            // For now, assume yes if it's not done.
            setTaskToLogTime(task)
        } else {
            // If dragging back to open?
            // Just update status for now
            await updateTaskStatus(task.id, "OPEN")
            router.refresh()
        }
    }

    return (
        <div className="space-y-8">
            {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg bg-muted/5">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Briefcase className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="text-lg font-medium text-slate-900">No active work found</p>
                    <p className="text-sm">Try adjusting your filters.</p>
                </div>
            ) : (
                Object.entries(grouped).map(([projectName, items]) => (
                    <div key={projectName} className="space-y-2">
                        <div className="flex items-center justify-between px-2 pt-2 pb-1">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                {projectName}
                                <span className="text-[10px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                                    {(items as any[]).length}
                                </span>
                            </h2>
                        </div>

                        <div className="grid gap-1">
                            {(items as any[]).map((item: any) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleTaskClick(item)}
                                    className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-card hover:shadow-sm transition-all duration-200 cursor-pointer mb-2"
                                >
                                    <div className="mt-0.5">
                                        <button
                                            onClick={(e) => handleQuickComplete(e, item)}
                                            className="opacity-40 group-hover:opacity-100 transition-opacity focus:outline-none"
                                        >
                                            {item.status === "DONE" ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <span className={`font-medium text-sm truncate ${item.status === 'DONE' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                            {item.title}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {/* Priority Indicator */}
                                            {item.priority === "P0" && (
                                                <Badge variant="destructive" className="h-4 px-1 text-[10px] rounded-[4px]">P0</Badge>
                                            )}
                                            {item.priority === "P1" && (
                                                <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-100 hover:text-orange-700 rounded-[4px] border-orange-200">P1</Badge>
                                            )}

                                            {item.taskType && (
                                                <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-normal text-muted-foreground">
                                                    {item.taskType}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setTaskToLogTime(item)
                                            }}
                                            title="Log Time"
                                        >
                                            <Clock className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleTaskClick(item)
                                            }}
                                            title="Edit Details"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground border-l pl-4 border-border/50">
                                        {item.dueDate && (
                                            <span className={`flex items-center gap-1.5 ${new Date(item.dueDate) < new Date() && item.status !== 'DONE' ? 'text-red-500 font-medium' : ''}`}>
                                                <Calendar className="h-3.5 w-3.5" />
                                                {format(new Date(item.dueDate), "MMM d")}
                                            </span>
                                        )}

                                        {item.assignee ? (
                                            <div className="flex items-center gap-2" title={item.assignee.name}>
                                                <Avatar className="h-6 w-6 border border-background">
                                                    <AvatarImage src={item.assignee.avatarUrl} />
                                                    <AvatarFallback className="text-[10px]">{item.assignee.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        ) : (
                                            <span className="italic opacity-50">Unassigned</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            <TaskDetailSheet
                task={selectedTask}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                users={users}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
            />

            {/* Render TimeLogDialog directly for quick completions */}
            {taskToLogTime && (
                <TimeLogDialog
                    open={!!taskToLogTime}
                    onOpenChange={(open) => !open && setTaskToLogTime(null)}
                    task={taskToLogTime}
                    onComplete={() => {
                        updateTaskStatus(taskToLogTime.id, "DONE")
                        setTaskToLogTime(null)
                        router.refresh()
                    }}
                />
            )}
        </div>
    )
}

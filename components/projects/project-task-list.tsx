
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, LayoutTemplate, Check, Calendar, ArrowRight } from "lucide-react"
import { TaskDetailSheet } from "@/components/work/task-detail-sheet"
import { AddTaskDialog } from "@/components/work/add-task-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface ProjectTaskListProps {
    tasks: any[]
    users: any[]
    project: any
    currentUserId?: string
    currentUserRole?: string
}

export function ProjectTaskList({ tasks, users, project, currentUserId, currentUserRole }: ProjectTaskListProps) {
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const handleTaskClick = (task: any) => {
        setSelectedTask(task)
        setIsSheetOpen(true)
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/5 border-dashed text-center">
                <LayoutTemplate className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-medium text-lg">No tasks yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
                    Get started by creating a new task or assigning a workflow to this project.
                </p>
                <AddTaskDialog
                    projects={[{
                        id: project.id,
                        name: project.name,
                        allowedTaskTypes: project.allowedTaskTypes
                    }]}
                    users={users}
                    defaultProjectId={project.id}
                />
            </div>
        )
    }

    const getStatusVariant = (status: string) => {
        return status === "DONE" ? "outline" : "default"
    }

    return (
        <>
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead>Task Name</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead className="text-right">Due Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map((task: any) => (
                            <TableRow
                                key={task.id}
                                className={cn(
                                    "cursor-pointer hover:bg-muted/50 transition-colors",
                                    task.status === "DONE" && "opacity-60 bg-muted/20"
                                )}
                                onClick={() => handleTaskClick(task)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getStatusVariant(task.status)} className="text-[10px] px-1.5 py-0 h-5">
                                            {task.status}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{task.title}</span>
                                        {task.description && (
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{task.description}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                                        {task.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {task.taskType ? (
                                        <span className="text-xs text-muted-foreground">{task.taskType}</span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {task.assignee ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={task.assignee.avatarUrl} />
                                                <AvatarFallback className="text-[9px]">{task.assignee.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {task.dueDate ? (
                                        <span className={cn(
                                            "text-xs",
                                            new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "text-red-500 font-medium" : "text-muted-foreground"
                                        )}>
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <TaskDetailSheet
                task={selectedTask}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                users={users}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
            />
        </>
    )
}

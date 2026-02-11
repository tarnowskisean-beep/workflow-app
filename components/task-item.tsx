"use client"

import { useState, useTransition } from "react"
import { updateTaskStatus, addDocumentLink } from "@/actions/task-actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FileText, ExternalLink, Loader2 } from "lucide-react"

type Task = {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    driveLink: string | null
    requiresDocument: boolean
}

export function TaskItem({ task }: { task: Task }) {
    const [isPending, startTransition] = useTransition()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [documentLink, setDocumentLink] = useState("")
    const [linkError, setLinkError] = useState("")

    const isDone = task.status === "DONE"

    function handleStatusChange(checked: boolean) {
        if (checked) {
            // Attempting to mark as DONE
            if (task.requiresDocument && !task.driveLink) {
                setIsDialogOpen(true)
                return
            }
            updateStatus("DONE")
        } else {
            // Unchecking (reopening)
            updateStatus("OPEN")
        }
    }

    function updateStatus(status: string) {
        startTransition(async () => {
            await updateTaskStatus(task.id, status)
        })
    }

    async function handleAddLink() {
        if (!documentLink) {
            setLinkError("Link is required")
            return
        }
        setLinkError("")

        startTransition(async () => {
            const result = await addDocumentLink(task.id, documentLink)
            if (result.success) {
                setIsDialogOpen(false)
                setDocumentLink("")
                // After adding link, automatically mark as done
                await updateTaskStatus(task.id, "DONE")
            } else {
                setLinkError(result.message)
            }
        })
    }

    return (
        <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-white">
            <div className="flex items-start gap-3">
                <Checkbox
                    checked={isDone}
                    onCheckedChange={handleStatusChange}
                    disabled={isPending}
                    className="mt-1"
                />
                <div className="space-y-1">
                    <div className={`font-semibold ${isDone ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                        <span>•</span>
                        <span>{task.status}</span>

                        {task.requiresDocument && (
                            <Badge variant="secondary" className="text-xs gap-1">
                                <FileText className="h-3 w-3" />
                                Doc Required
                            </Badge>
                        )}
                    </div>

                    {task.driveLink && (
                        <a
                            href={task.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                        >
                            <ExternalLink className="h-3 w-3" />
                            View Document
                        </a>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Document Required</DialogTitle>
                        <DialogDescription>
                            This task requires a Google Drive link to be completed. Please paste it below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="link">Google Drive Link</Label>
                            <Input
                                id="link"
                                placeholder="https://docs.google.com/..."
                                value={documentLink}
                                onChange={(e) => setDocumentLink(e.target.value)}
                            />
                            {linkError && <span className="text-sm text-red-500">{linkError}</span>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddLink} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save & Complete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

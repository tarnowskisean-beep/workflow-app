"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { assignTemplate } from "@/actions/template-actions"
import { CopyPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface TemplateGroup {
    id: string
    name: string
    description: string | null
}

interface ApplyTemplateDialogProps {
    projectId: string
    templateGroups: TemplateGroup[]
    currentUserId: string
}

export function ApplyTemplateDialog({ projectId, templateGroups, currentUserId }: ApplyTemplateDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedGroupId, setSelectedGroupId] = useState("")
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]) // Today YYYY-MM-DD

    const handleApply = async () => {
        if (!selectedGroupId) return

        setLoading(true)
        const formData = new FormData()
        formData.append("groupId", selectedGroupId)
        // assignTemplate expects projectIds as a JSON string of an array
        formData.append("projectIds", JSON.stringify([projectId]))
        formData.append("startDate", startDate)

        const result = await assignTemplate(formData)
        setLoading(false)

        if (result.success) {
            setOpen(false)
            router.refresh()
            // Optional: Toast success
        } else {
            console.error(result.error)
            alert("Failed to apply template")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <CopyPlus className="h-4 w-4" />
                    Apply Template
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Workflow</DialogTitle>
                    <DialogDescription>
                        Select a workflow to assign to this project. Tasks will be created and linked.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Workflow Group</Label>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a workflow..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templateGroups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                                {templateGroups.length === 0 && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        No workflows found.
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Start Date</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Due dates will be calculated relative to this date.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleApply} disabled={loading || !selectedGroupId}>
                        {loading ? "Assigning..." : "Assign Workflow"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

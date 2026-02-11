"use client"

import { updateProjectAccess } from "@/actions/project-actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Project, User } from "@prisma/client"
import { UsersIcon } from "lucide-react" // Import naming conflict with variable
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProjectAccessDialogProps {
    project: Project & { users: User[] }
    allUsers: Partial<User>[]
}

export function ProjectAccessDialog({ project, allUsers }: ProjectAccessDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    // Initialize with current project users
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
        project.users.map(u => u.id)
    )

    const handleToggle = (userId: string) => {
        setSelectedUserIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId)
            } else {
                return [...prev, userId]
            }
        })
    }

    const handleSave = async () => {
        setSaving(true)
        const result = await updateProjectAccess(project.code, selectedUserIds)
        setSaving(false)
        if (result.success) {
            setOpen(false)
            router.refresh()
        } else {
            // Handle error (could use toast)
            console.error("Failed to update access")
            alert("Failed to update access")
        }
    }

    // Reset state when opening
    const onOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setSelectedUserIds(project.users.map(u => u.id))
        }
        setOpen(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UsersIcon className="h-4 w-4" />
                    Manage Access
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Project Access</DialogTitle>
                    <DialogDescription>
                        Select users who should have access to this project.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    {allUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`user-${user.id}`}
                                checked={user.id ? selectedUserIds.includes(user.id) : false}
                                onCheckedChange={() => user.id && handleToggle(user.id)}
                            />
                            <Label
                                htmlFor={`user-${user.id}`}
                                className="flex-1 cursor-pointer"
                            >
                                {user.name || user.email}
                                <span className="text-xs text-muted-foreground ml-2">
                                    {user.email}
                                </span>
                            </Label>
                        </div>
                    ))}
                    {allUsers.length === 0 && (
                        <p className="text-muted-foreground text-sm">No other users found.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

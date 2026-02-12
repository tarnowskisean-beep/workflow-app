"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface UserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (formData: FormData) => Promise<void>
    initialData?: any
    mode: "create" | "edit"
    allProjects?: any[]
}

export function UserDialog({ open, onOpenChange, onSave, initialData, mode, allProjects = [] }: UserDialogProps) {
    const [pending, setPending] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [role, setRole] = useState("ASSOCIATE")
    const [password, setPassword] = useState("")
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            if (mode === "edit" && initialData) {
                setName(initialData.name || "")
                setEmail(initialData.email || "")
                setRole(initialData.role || "ASSOCIATE")
                setPassword("") // Don't show current password
                setSelectedProjectIds(initialData.projects?.map((p: any) => p.id) || [])
            } else {
                setName("")
                setEmail("")
                setRole("ASSOCIATE")
                setPassword("")
                setSelectedProjectIds([])
            }
        }
    }, [open, mode, initialData])

    const handleProjectToggle = (projectId: string) => {
        setSelectedProjectIds(prev => {
            if (prev.includes(projectId)) {
                return prev.filter(id => id !== projectId)
            } else {
                return [...prev, projectId]
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setPending(true)

        const formData = new FormData()
        formData.append("name", name)
        formData.append("email", email)
        formData.append("role", role)
        if (password) formData.append("password", password)
        selectedProjectIds.forEach(id => formData.append("projectIds", id))

        try {
            await onSave(formData)
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Add Team Member" : "Edit User"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create" ? "Add a new user to the workspace." : "Update user details."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Jane Doe"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. jane@example.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ASSOCIATE">Associate</SelectItem>
                                <SelectItem value="SENIOR">Senior</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Project Access</Label>
                        <div className="grid gap-2 max-h-[150px] overflow-y-auto border rounded-md p-2">
                            {/* @ts-ignore */}
                            {allProjects.length === 0 ? (
                                <div className="text-sm text-center text-muted-foreground p-2">
                                    No projects available.
                                </div>
                            ) : (
                                // @ts-ignore
                                allProjects.map((project) => (
                                    <div key={project.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                                        <input
                                            type="checkbox"
                                            id={`proj-${project.id}`}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={selectedProjectIds.includes(project.id)}
                                            onChange={() => handleProjectToggle(project.id)}
                                        />
                                        <label
                                            htmlFor={`proj-${project.id}`}
                                            className="flex-1 text-sm cursor-pointer select-none"
                                        >
                                            {project.name}
                                            <span className="ml-1 text-xs text-muted-foreground">({project.code})</span>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Select projects this user can access.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">{mode === "create" ? "Password" : "New Password (Optional)"}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={mode === "create" ? "Create a password" : "Leave blank to keep current"}
                            required={mode === "create"}
                            minLength={6}
                        />
                        {mode === "create" && (
                            <p className="text-[10px] text-muted-foreground">Default: Compass123! if left blank (but required above for now)</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={pending}>
                            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (mode === "create" ? "Add User" : "Save Changes")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

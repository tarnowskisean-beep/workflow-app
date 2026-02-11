"use client"

import { updateProjectTeam, updateProjectAccess, updateProjectDetails } from "@/actions/project-actions"
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
import { Project, User } from "@prisma/client"
import { UsersIcon, Check, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

// Extended Project type with relations
type ProjectWithTeam = Project & {
    users: User[],
    manager: User | null,
    senior: User | null,
    associate: User | null,
    allowedTaskTypes: string
    assignedTemplates: { id: string }[]
}

interface TemplateGroup {
    id: string
    name: string
    description: string | null
}

interface ProjectSettingsDialogProps {
    project: ProjectWithTeam & { allowedTaskTypes: string, assignedTemplates: { id: string }[] }
    allUsers: Partial<User>[]
    templateGroups: TemplateGroup[]
}

export function ProjectSettingsDialog({ project, allUsers, templateGroups = [] }: ProjectSettingsDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // General State
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description || "")
    const [isBillable, setIsBillable] = useState(project.isBillable ?? true)

    // Rates State
    const [billableRate, setBillableRate] = useState<string>(project.billableRate?.toString() || "")
    const [managerRate, setManagerRate] = useState<string>(project.managerRate?.toString() || "")
    const [seniorRate, setSeniorRate] = useState<string>(project.seniorRate?.toString() || "")
    const [associateRate, setAssociateRate] = useState<string>(project.associateRate?.toString() || "")

    // Team State
    const [managerId, setManagerId] = useState<string>(project.managerId || "none")
    const [seniorId, setSeniorId] = useState<string>(project.seniorId || "none")
    const [associateId, setAssociateId] = useState<string>(project.associateId || "none")

    // Task Types State
    const [allowedTaskTypes, setAllowedTaskTypes] = useState<string>(project.allowedTaskTypes || "Bookkeeping,Audit,Meeting,990,General")

    // Assigned Templates State
    const [assignedTemplateIds, setAssignedTemplateIds] = useState<string[]>(
        project.assignedTemplates?.map(t => t.id) || []
    )

    // Access State (Checkbox list)
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
        project.users.map(u => u.id)
    )

    const handleAccessToggle = (userId: string) => {
        setSelectedUserIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId)
            } else {
                return [...prev, userId]
            }
        })
    }

    const handleTemplateToggle = (templateId: string) => {
        setAssignedTemplateIds(prev => {
            if (prev.includes(templateId)) {
                return prev.filter(id => id !== templateId)
            } else {
                return [...prev, templateId]
            }
        })
    }

    const handleSave = async () => {
        setSaving(true)

        // Save General Details
        await updateProjectDetails(project.code, {
            name,
            description,
            isBillable,
            billableRate: billableRate ? parseFloat(billableRate) : undefined,
            managerRate: managerRate ? parseFloat(managerRate) : undefined,
            seniorRate: seniorRate ? parseFloat(seniorRate) : undefined,
            associateRate: associateRate ? parseFloat(associateRate) : undefined
        })

        // Save Team & Templates
        await updateProjectTeam(project.code, {
            managerId,
            seniorId,
            associateId,
            allowedTaskTypes,
            assignedTemplateIds
        })

        // Save Access List
        await updateProjectAccess(project.code, selectedUserIds)

        setSaving(false)
        setOpen(false)
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings & Team
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Project Settings</DialogTitle>
                    <DialogDescription>
                        Manage general details, team structure, and access control.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                        <TabsTrigger value="types">Types</TabsTrigger>
                        <TabsTrigger value="access">Access</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Project Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Project Name"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Project description and notes..."
                                    className="resize-none min-h-[100px]"
                                />
                            </div>

                            <div className="flex items-center space-x-2 py-2">
                                <Checkbox
                                    id="isBillable"
                                    checked={isBillable}
                                    onCheckedChange={(c) => setIsBillable(!!c)}
                                />
                                <Label htmlFor="isBillable" className="cursor-pointer">
                                    Billable Project
                                </Label>
                            </div>

                            {isBillable && (
                                <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Billable Rates (Hourly)</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-xs">Standard Rate</Label>
                                            <Input
                                                type="number"
                                                value={billableRate}
                                                onChange={(e) => setBillableRate(e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs">Manager Rate</Label>
                                            <Input
                                                type="number"
                                                value={managerRate}
                                                onChange={(e) => setManagerRate(e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs">Senior Rate</Label>
                                            <Input
                                                type="number"
                                                value={seniorRate}
                                                onChange={(e) => setSeniorRate(e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs">Associate Rate</Label>
                                            <Input
                                                type="number"
                                                value={associateRate}
                                                onChange={(e) => setAssociateRate(e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="team" className="space-y-4 py-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Manager</Label>
                                <Select value={managerId} onValueChange={setManagerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {allUsers.map(u => (
                                            <SelectItem key={u.id} value={u.id || "unknown"}>{u.name || u.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Senior</Label>
                                <Select value={seniorId} onValueChange={setSeniorId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Senior" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {allUsers.map(u => (
                                            <SelectItem key={u.id} value={u.id || "unknown"}>{u.name || u.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Associate</Label>
                                <Select value={associateId} onValueChange={setAssociateId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Associate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {allUsers.map(u => (
                                            <SelectItem key={u.id} value={u.id || "unknown"}>{u.name || u.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            Templates will use these roles to automatically assign tasks.
                        </p>
                    </TabsContent>

                    <TabsContent value="templates" className="py-4">
                        <div className="grid gap-2">
                            <Label className="mb-2">Assigned Template Groups</Label>
                            <div className="grid gap-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                                {templateGroups.length === 0 ? (
                                    <div className="text-sm text-center text-muted-foreground p-4">
                                        No template groups available.
                                    </div>
                                ) : (
                                    templateGroups.map((group) => (
                                        <div key={group.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                                            <Checkbox
                                                id={`tpl-${group.id}`}
                                                checked={assignedTemplateIds.includes(group.id)}
                                                onCheckedChange={() => handleTemplateToggle(group.id)}
                                            />
                                            <div className="grid gap-0.5">
                                                <Label
                                                    htmlFor={`tpl-${group.id}`}
                                                    className="font-medium cursor-pointer"
                                                >
                                                    {group.name}
                                                </Label>
                                                {group.description && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {group.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Select which template groups are relevant for this project.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="types" className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Allowed Task Types</Label>
                            <p className="text-xs text-muted-foreground">Comma-separated list of task types available in this project.</p>
                            <Input
                                value={allowedTaskTypes}
                                onChange={(e) => setAllowedTaskTypes(e.target.value)}
                                placeholder="Audit, Bookkeeping, Tax, General"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="access" className="py-4">
                        <div className="grid gap-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                            {allUsers.map((user) => (
                                <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                                    <Checkbox
                                        id={`user-${user.id}`}
                                        checked={user.id ? selectedUserIds.includes(user.id) : false}
                                        onCheckedChange={() => user.id && handleAccessToggle(user.id)}
                                    />
                                    <Label
                                        htmlFor={`user-${user.id}`}
                                        className="flex-1 cursor-pointer"
                                    >
                                        {user.name || user.email}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Selected users can view this project.
                        </p>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    )
}

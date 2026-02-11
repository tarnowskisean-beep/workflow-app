"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Pencil, Trash2, UserPlus } from "lucide-react"
import { UserDialog } from "./user-dialog"
import { addUser, updateUser, deleteUser } from "@/actions/settings-actions"
import { useToast } from "@/hooks/use-toast"

type User = {
    id: string
    name: string | null
    email: string | null
    role: string
    avatarUrl: string | null
}

export function TeamManagement({ users, currentUserRole }: { users: User[], currentUserRole?: string }) {
    const { toast } = useToast()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    const canManage = currentUserRole === "MANAGER" || currentUserRole === "ADMIN"

    const handleAdd = () => {
        setEditingUser(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setIsDialogOpen(true)
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this user? This cannot be undone.")) return

        const result = await deleteUser(userId)
        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            })
        } else {
            toast({
                title: "Success",
                description: "User removed successfully"
            })
        }
    }

    const handleSave = async (formData: FormData) => {
        let result
        if (editingUser) {
            result = await updateUser(editingUser.id, formData)
        } else {
            result = await addUser(formData)
        }

        if (result.error) {
            const errorMessage = Array.isArray(result.error)
                ? result.error.join(", ")
                : (typeof result.error === 'object' ? JSON.stringify(result.error) : result.error)

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            })
            throw new Error(errorMessage)
        } else {
            toast({
                title: "Success",
                description: result.success
            })
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>People with access to this workspace.</CardDescription>
                </div>
                {canManage && (
                    <Button size="sm" onClick={handleAdd}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatarUrl || ""} />
                                    <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium text-sm">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{user.role}</Badge>
                                {canManage && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(user.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSave}
                initialData={editingUser}
                mode={editingUser ? "edit" : "create"}
            />
        </Card>
    )
}

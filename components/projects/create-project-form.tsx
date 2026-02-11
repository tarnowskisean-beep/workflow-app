"use client"

import { createProject } from "@/actions/project-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation" // Use next/navigation for app directory
import { useState } from "react"

import { User } from "@prisma/client" // Or define shape locally if preferred
import { Checkbox } from "@/components/ui/checkbox"

interface CreateProjectFormProps {
    users: Partial<User>[]
}

export function CreateProjectForm({ users }: CreateProjectFormProps) {
    const router = useRouter()
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setPending(true)
        setError(null)

        // Users are not handled in createProject action yet via FormData auto-binding if I modify the action to look for them,
        // BUT createProject schema is: name, code, description. 
        // I updated createProject action to connect *current user*.
        // If I want to add *other users*, I need to update createProject action to accept userIds.

        // Wait, I didn't update createProject to accept other users. I only connected session.user.
        // I should update createProject to accept a list of user IDs. 
        // But FormData doesn't handle arrays nicely without repeat entries.

        // let's stick to just creating it with current user first, 
        // OR update createProject to look for 'userIds' in formData?
        // Let's rely on the plan: "Update Project Dialog to allow selecting users". 
        // The plan said: "Update project creation/editing to include user assignment".

        // I will just add the current user logic for now as done in previous step. 
        // If I want to support adding others during creation, I need to update the action.
        // Let's stick to the current action implementation for now which connects the creator.
        // AND add a way to update it later. 

        // HOWEVER, the user asked to "limit what users have access". 
        // If I create a project, it's limited to me.
        // I should probably allow adding others.

        // Let's update createProject to handle assignments if I have time, but sticking to "Manage Access" button is safer for now.
        // Actually, the plan said "Update Project Project Dialog".
        // Let's implement the "Manage Access" dialog on the details page first. 
        // The create form can remain simple.

        const result = await createProject(formData)

        if (result?.error) {
            if (typeof result.error === 'string') {
                setError(result.error)
            } else {
                setError("Please check your input.")
            }
            setPending(false)
        } else {
            // Success
            router.push("/projects")
            router.refresh()
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" name="name" placeholder="Acme Corp" required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="code">Project Code</Label>
                <Input id="code" name="code" placeholder="ACME" maxLength={10} className="uppercase" required />
                <p className="text-xs text-muted-foreground">Unique identifier (e.g. CPRO, AFL)</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Brief description of the project..." />
            </div>

            <div className="text-sm text-muted-foreground">
                <p>You will be automatically assigned to this project. You can add more members later.</p>
            </div>

            {error && (
                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Creating..." : "Create Project"}
            </Button>
        </form>
    )
}

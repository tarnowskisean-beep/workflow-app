"use client"

import { useState } from "react"
import { createTemplateGroup } from "@/actions/template-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function CreateGroupForm() {
    const [pending, setPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setPending(true)
        try {
            const result = await createTemplateGroup(formData)
            if (result?.error) {
                alert("Failed to create group: " + JSON.stringify(result.error))
            } else {
                const form = document.getElementById("create-group-form") as HTMLFormElement
                form?.reset()
            }
        } catch (e) {
            alert("An error occurred")
        } finally {
            setPending(false)
        }
    }

    return (
        <form id="create-group-form" action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input id="name" name="name" placeholder="e.g. Monthly Bookkeeping" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Optional" />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Group
            </Button>
        </form>
    )
}

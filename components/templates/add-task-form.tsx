"use client"

import { useState } from "react"
import { addTaskToGroup } from "@/actions/template-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from "lucide-react"

export function AddTaskForm({ groupId }: { groupId: string }) {
    const [pending, setPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setPending(true)
        // We append the groupId here or it's already in the form as hidden
        formData.append("groupId", groupId)

        try {
            const result = await addTaskToGroup(formData)
            if (result && 'error' in result) {
                alert("Failed to add task: " + JSON.stringify(result.error))
            } else {
                // Success - form clears automatically if we reset it, or we can just rely on revalidation
                const form = document.getElementById(`form-${groupId}`) as HTMLFormElement
                form?.reset()
            }
        } catch (e) {
            alert("An error occurred")
        } finally {
            setPending(false)
        }
    }

    return (
        <form id={`form-${groupId}`} action={handleSubmit} className="flex flex-col gap-2 border p-3 rounded-lg bg-muted/20">
            <div className="flex gap-2 items-end">
                <div className="grid gap-2 flex-1">
                    <label className="text-xs font-medium">Task Title</label>
                    <Input name="title" placeholder="Task Title" required className="bg-background" />
                </div>
                <div className="w-24 grid gap-2">
                    <label className="text-xs font-medium">Rel. Due</label>
                    <Input name="relativeDueDays" type="number" placeholder="+ Days" defaultValue="0" className="bg-background" />
                </div>
                <Button type="submit" size="sm" variant="secondary" disabled={pending} className="mb-0.5 h-10">
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
            </div>

            <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id={`rec-${groupId}`} name="isRecurring" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor={`rec-${groupId}`} className="text-xs">Recurring?</label>
                </div>

                <select name="recurrenceInterval" className="text-xs h-7 rounded border bg-background px-2">
                    <option value="">No Recurrence</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                </select>

                <div className="flex items-center gap-2 ml-4">
                    <label className="text-xs font-medium">Assign Role:</label>
                    <select name="assigneeRole" className="text-xs h-7 rounded border bg-background px-2 w-24">
                        <option value="">None (Me)</option>
                        <option value="MANAGER">Manager</option>
                        <option value="SENIOR">Senior</option>
                        <option value="ASSOCIATE">Associate</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 ml-4 border-l pl-4">
                    <input type="checkbox" id={`doc-${groupId}`} name="requiresDocument" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor={`doc-${groupId}`} className="text-xs">Required Doc?</label>
                </div>
            </div>
        </form>
    )
}

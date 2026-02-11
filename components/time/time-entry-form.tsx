"use client"

import { useState } from "react"
import { logTime } from "@/actions/time-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { useToast } from "@/hooks/use-toast" 
import { Loader2 } from "lucide-react"

interface TaskOption {
    id: string
    title: string
}

export function TimeEntryForm({ tasks }: { tasks: TaskOption[] }) {
    const [pending, setPending] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setPending(true)
        setMessage(null)

        const result = await logTime(formData)

        if (result.error) {
            setMessage(typeof result.error === 'string' ? result.error : "Validation failed")
        } else {
            setMessage("Time logged successfully!")
            // Reset form manually or via key
            const form = document.getElementById("time-form") as HTMLFormElement
            form?.reset()
        }
        setPending(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Log Time</CardTitle>
                <CardDescription>Record hours worked on tasks or general duties.</CardDescription>
            </CardHeader>
            <CardContent>
                <form id="time-form" action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                type="date"
                                id="date"
                                name="date"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (Minutes)</Label>
                            <Input
                                type="number"
                                id="durationMinutes"
                                name="durationMinutes"
                                min="1"
                                placeholder="e.g. 60"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="task">Task (Optional)</Label>
                        <Select name="workItemId">
                            <SelectTrigger>
                                <SelectValue placeholder="Select a task..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General / No Task</SelectItem>
                                {tasks.map((task) => (
                                    <SelectItem key={task.id} value={task.id}>
                                        {task.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="What did you work on?"
                        />
                    </div>

                    {message && (
                        <div className={`text-sm font-medium ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                            {message}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={pending}>
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log Time"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

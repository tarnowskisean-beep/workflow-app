"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { createTask } from "@/actions/task-actions"
import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { taskSchema, type TaskFormValues } from "@/lib/schemas"
import { TASK_STATUS, PRIORITY } from "@/lib/constants"

export function TaskForm() {
    // const router = useRouter() // router unused
    const [isPending, startTransition] = useTransition()

    const [error, setError] = useState<string | null>(null)
    // const [open, setOpen] = useState(false) // unused for now

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: "",
            description: "",
            status: TASK_STATUS.OPEN,
            priority: PRIORITY.P2,
            driveLink: "",
        },
    })

    function onSubmit(values: TaskFormValues) {
        setError(null)
        startTransition(async () => {
            const formData = new FormData()
            formData.append("title", values.title)
            if (values.description) formData.append("description", values.description)
            formData.append("status", values.status)
            formData.append("priority", values.priority)
            if (values.driveLink) formData.append("driveLink", values.driveLink)
            if (values.requiresDocument) formData.append("requiresDocument", "on")
            if (values.dueDate) formData.append("dueDate", values.dueDate)
            if (values.driveLinkType) formData.append("driveLinkType", values.driveLinkType)

            const result = await createTask(formData)
            if (!result.success) {
                setError(result.message || "An error occurred.")
            } else {
                // Success is handled by redirect in server action
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Task Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Review Q1 Contracts" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="driveLink"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Google Drive Link (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://docs.google.com/..." {...field} />
                            </FormControl>
                            <FormDescription>
                                Paste the full URL to the file or folder.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="requiresDocument"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Requires Document
                                </FormLabel>
                                <FormDescription>
                                    If checked, this task cannot be marked as Done without a Drive link.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={TASK_STATUS.OPEN}>Open</SelectItem>
                                        <SelectItem value={TASK_STATUS.DONE}>Done</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={PRIORITY.P0}>P0 (Critical)</SelectItem>
                                        <SelectItem value={PRIORITY.P1}>P1 (High)</SelectItem>
                                        <SelectItem value={PRIORITY.P2}>P2 (Medium)</SelectItem>
                                        <SelectItem value={PRIORITY.P3}>P3 (Low)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {error && (
                    <div className="text-sm text-red-500 font-medium">
                        {error}
                    </div>
                )}
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Task"}
                </Button>
            </form>
        </Form>
    )
}

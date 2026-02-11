import * as z from "zod"

export const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE", "ARCHIVED"]),
    priority: z.enum(["P0", "P1", "P2", "P3"]),
    // driveLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    // For now, allow empty string or valid URL
    driveLink: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional(),
    driveLinkType: z.enum(["file", "folder"]).optional(),
    requiresDocument: z.boolean().default(false).optional(),
    dueDate: z.string().optional(), // ISO string from date picker
})

export type TaskFormValues = z.infer<typeof taskSchema>

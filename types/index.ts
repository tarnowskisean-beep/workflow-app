import { Prisma } from "@prisma/client"

export type TimeEntryWithFullRelations = Prisma.TimeEntryGetPayload<{
    include: {
        project: true,
        workItem: true
    }
}>

export type ProjectOption = Pick<Prisma.ProjectGetPayload<{}>, "id" | "name">
export type TaskOption = Pick<Prisma.WorkItemGetPayload<{ include: { project: true } }>, "id" | "title" | "projectId"> & { projectName?: string }

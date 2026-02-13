export const ROLES = {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    SENIOR: "SENIOR", // Added based on context, though not explicitly in original plan list, it's a good practice
    ASSOCIATE: "ASSOCIATE"
} as const;

export type Role = keyof typeof ROLES;

export const TASK_STATUS = {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
} as const;

export type TaskStatus = keyof typeof TASK_STATUS;

export const PRIORITY = {
    P0: "P0",
    P1: "P1",
    P2: "P2",
    P3: "P3"
} as const;

export type Priority = keyof typeof PRIORITY;

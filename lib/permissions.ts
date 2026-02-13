import { ROLES, Role } from "@/lib/constants"
import { User } from "@prisma/client"

type Action = "create:project" | "update:project" | "delete:project" | "manage:team"

export function can(user: { role: string | null }, action: Action): boolean {
    const role = (user.role || ROLES.ASSOCIATE) as Role

    switch (action) {
        case "create:project":
            return role === ROLES.ADMIN || role === ROLES.MANAGER
        case "update:project":
            return role === ROLES.ADMIN || role === ROLES.MANAGER
        case "delete:project":
            return role === ROLES.ADMIN
        case "manage:team":
            return role === ROLES.ADMIN || role === ROLES.MANAGER
        default:
            return false
    }
}

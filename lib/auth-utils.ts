import { auth } from "@/auth"

type AuthResult = {
    userId: string;
    role: string;
}

export async function requireAuth(): Promise<AuthResult> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }
    return {
        userId: session.user.id,
        role: session.user.role || "ASSOCIATE"
    }
}

export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
    const session = await requireAuth()
    if (!allowedRoles.includes(session.role)) {
        throw new Error("Insufficient permissions")
    }
    return session
}

// For actions that return an error object instead of throwing
export async function checkActionAuth() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized", session: null }
    return { error: null, session }
}

export async function checkActionRole(allowedRoles: string[]) {
    const authCheck = await checkActionAuth()
    if (authCheck.error || !authCheck.session) return { error: "Unauthorized", session: null }

    if (!allowedRoles.includes(authCheck.session.user.role || "ASSOCIATE")) {
        return { error: "Insufficient permissions", session: null }
    }

    return { error: null, session: authCheck.session }
}

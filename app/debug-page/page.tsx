

// Actually I simply want to render server-side props.

import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
    let dbStatus = "Unknown"
    let userCount = 0
    let adminUser = null
    let dbUrlRedacted = "Check Console"

    try {
        userCount = await prisma.user.count()

        const targetEmail = "starnowski@compassprofessional.com"
        adminUser = await prisma.user.findUnique({
            where: { email: targetEmail },
            select: { id: true, email: true, role: true, password: true }
        })

        dbStatus = "Connected"
    } catch (e) {
        dbStatus = "Error: " + (e instanceof Error ? e.message : String(e))
    }

    return (
        <div className="p-10 font-mono">
            <h1 className="text-2xl font-bold mb-4">Database Connection Debug</h1>

            <div className="border p-4 rounded bg-gray-100 dark:bg-gray-800">
                <p><strong>Status:</strong> {dbStatus}</p>
                <p><strong>User Count:</strong> {userCount}</p>
                <p><strong>Target User:</strong> {adminUser ? "FOUND" : "NOT FOUND"}</p>

                {adminUser && (
                    <div className="mt-4 border-t pt-4">
                        <p><strong>Email:</strong> {adminUser.email}</p>
                        <p><strong>Role:</strong> {adminUser.role}</p>
                        <p><strong>Has Password:</strong> {adminUser.password ? "YES (Hashed)" : "NO"}</p>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <p className="text-sm text-gray-500">
                    If User Count is 0, Vercel is connected to an empty database.
                </p>
            </div>
        </div>
    )
}


import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        console.log("Debug DB: Starting check...")

        // 1. Check connection and user count
        const userCount = await prisma.user.count()
        console.log("Debug DB: User count:", userCount)

        // 2. Check specific admin user
        const targetEmail = "starnowski@compassprofessional.com"
        const adminUser = await prisma.user.findUnique({
            where: { email: targetEmail },
            select: { id: true, email: true, role: true, password: true } // engaging selection to see if password exists (hashed)
        })

        // 3. Check environment variable (redacted)
        const dbUrl = process.env.DATABASE_URL || "NOT_SET"
        const dbUrlRedacted = dbUrl.replace(/:[^:@]+@/, ":****@")

        return NextResponse.json({
            status: "success",
            environment: {
                database_url_set: !!process.env.DATABASE_URL,
                database_url_redacted: dbUrlRedacted,
            },
            database_check: {
                total_users: userCount,
                admin_user_found: !!adminUser,
                admin_user_details: adminUser ? {
                    id: adminUser.id,
                    email: adminUser.email,
                    role: adminUser.role,
                    has_password: !!adminUser.password,
                    password_hash_start: adminUser.password ? adminUser.password.substring(0, 10) + "..." : null
                } : "NOT FOUND"
            }
        })
    } catch (error) {
        console.error("Debug DB Error:", error)
        return NextResponse.json({
            status: "error",
            error: error instanceof Error ? error.message : String(error),
            env_check: {
                database_url_set: !!process.env.DATABASE_URL
            }
        }, { status: 500 })
    }
}

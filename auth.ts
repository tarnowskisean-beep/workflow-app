import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/auth.config"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"

// Merge the config with the adapter
export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma) as any,
    trustHost: true,
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                console.log("Auth.ts: Authorizing with credentials:", JSON.stringify(credentials, null, 2))
                // Triggering new deployment to ensure debug-db is present
                try {
                    const parsedCredentials = z
                        .object({ email: z.string().email(), password: z.string().min(6) })
                        .safeParse(credentials)

                    if (parsedCredentials.success) {
                        const { email, password } = parsedCredentials.data
                        console.log("Auth.ts: Validated input for", email)

                        const user = await prisma.user.findUnique({ where: { email } })

                        if (!user) {
                            console.log("Auth.ts: User not found in database:", email)
                            return null
                        }

                        if (!user.password) {
                            console.log("Auth.ts: User has no password set in database")
                            return null
                        }

                        console.log("Auth.ts: Verifying password...")
                        const passwordsMatch = await bcrypt.compare(password, user.password)

                        if (passwordsMatch) {
                            console.log("Auth.ts: Password match! Returning user object.")
                            // Return only necessary fields to avoid serialization issues
                            return {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                role: user.role,
                            }
                        } else {
                            console.log("Auth.ts: Password mismatch for user:", email)
                        }
                    } else {
                        console.log("Auth.ts: Zod validation failed:", parsedCredentials.error)
                    }

                    return null
                } catch (error) {
                    console.error("Auth.ts UNEXPECTED ERROR:", error)
                    return null
                }
            },
        }),
    ],
})

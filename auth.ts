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
                console.log("Auth.ts: Authorizing...")
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data
                    const user = await prisma.user.findUnique({ where: { email } })

                    if (!user) {
                        console.log("User not found:", email)
                        return null
                    }

                    if (!user.password) {
                        console.log("User has no password set")
                        return null
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password)

                    if (passwordsMatch) {
                        return user
                    } else {
                        console.log("Password mismatch")
                    }
                } else {
                    console.log("Invalid fields")
                }

                return null
            },
        }),
    ],
})

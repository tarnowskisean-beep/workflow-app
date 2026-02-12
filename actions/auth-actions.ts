"use server"

import { signIn } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AuthError } from "next-auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
})

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        console.log("Action: Attempting sign in")
        await signIn("credentials", Object.fromEntries(formData))
        console.log("Action: Sign in successful (should not be reached if redirecting)")
    } catch (error) {
        console.error("Action: Sign in error:", error)
        if (error instanceof AuthError) {
            console.error("Action: AuthError type:", error.type)
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials."
                default:
                    return "Something went wrong."
            }
        }
        console.error("Action: Re-throwing error (likely redirect)")
        throw error
    }
}

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(1, "Name is required"),
})

export async function register(formData: FormData) {
    const rawData = Object.fromEntries(formData)
    const validatedFields = registerSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return { success: false, message: "Invalid fields" }
    }

    const { email, password, name } = validatedFields.data

    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        })

        return { success: true, message: "User created" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "User already exists or database error" }
    }
}

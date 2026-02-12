
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function resetPassword(email: string, newPassword: string) {
    console.log(`Resetting password for ${email}...`)

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        const user = await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
            },
        })

        console.log(`Password reset successful for user: ${user.email}`)
        console.log(`New password is: ${newPassword}`)
    } catch (error) {
        console.error("Error resetting password:", error)
    } finally {
        await prisma.$disconnect()
    }
}

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <password>")
    process.exit(1)
}

resetPassword(email, password)

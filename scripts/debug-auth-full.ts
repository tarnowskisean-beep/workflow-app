
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { z } from "zod"

const prisma = new PrismaClient()

async function main() {
    console.log("Starting full auth debug...")

    const credentials = {
        email: "starnowski@compassprofessional.com",
        password: "Welcome123!"
    }

    try {
        console.log("1. Testing Zod validation...")
        const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials)

        if (!parsedCredentials.success) {
            console.log("Zod validation FAILED")
            console.log(parsedCredentials.error)
            return
        }
        console.log("Zod validation PASSED")

        const { email, password } = parsedCredentials.data

        console.log("2. Finding user...")
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            console.log("User not found")
            return
        }
        console.log("User found")

        if (!user.password) {
            console.log("User has no password")
            return
        }

        console.log("3. Comparing password...")
        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (passwordsMatch) {
            console.log("Password MATCHED")
            console.log("User:", user)
        } else {
            console.log("Password MISMATCH")
        }

    } catch (e) {
        console.error("An error occurred:", e)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

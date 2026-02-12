import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const email = "starnowski@compassprofessional.com"
    const password = "Welcome123!" // Temporary password
    const name = "Sean Tarnowski"
    const role = "ADMIN"

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: role,
        },
        create: {
            email,
            name,
            password: hashedPassword,
            role: role,
        },
    })

    console.log(`User ${user.email} upserted with role ${user.role}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })


import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const email = "starnowski@compassprofessional.com"
    const password = "Welcome123!"

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.password) {
        console.log("User or password not found")
        return
    }

    console.log("Testing password:", password)
    console.log("Stored hash:", user.password)

    const match = await bcrypt.compare(password, user.password)
    console.log("Match result:", match)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

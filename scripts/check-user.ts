
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Checking for user...")
    const email = "starnowski@compassprofessional.com"
    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (user) {
        console.log("User found:", user)
        console.log("Has password:", !!user.password)
        console.log("Role:", user.role)
    } else {
        console.log("User NOT found")
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

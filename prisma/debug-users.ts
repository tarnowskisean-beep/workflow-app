
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        include: {
            projects: true
        }
    })
    console.log("Users in DB:", JSON.stringify(users, null, 2))

    const projects = await prisma.project.findMany({
        include: {
            users: true
        }
    })
    console.log("Projects in DB:", JSON.stringify(projects, null, 2))
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

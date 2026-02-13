const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const project = await prisma.project.findFirst({
        where: { name: 'Compass Professional' }
    })

    if (!project) {
        console.log("Project 'Compass Professional' not found")
        return
    }

    console.log(`Project: ${project.name}`)
    console.log(`Allowed Task Types: '${project.allowedTaskTypes}'`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

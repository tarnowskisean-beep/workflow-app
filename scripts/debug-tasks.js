
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const project = await prisma.project.findFirst({
        where: { name: 'Compass Professional' }
    })

    if (!project) {
        console.log('Project "Compass Professional" not found')
        return
    }

    console.log(`Project ID: ${project.id}`)

    const tasks = await prisma.workItem.findMany({
        where: {
            projectId: project.id,
            status: { not: 'DONE' }
        }
    })

    console.log(`Found ${tasks.length} active tasks for this project.`)
    tasks.forEach(t => console.log(`- [${t.status}] ${t.title}`))
}

main()
    .catch(e => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

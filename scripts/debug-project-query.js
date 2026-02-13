const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const code = 'COMP' // Replace with actual code for Compass Professional if different, I'll check DB first or guess
    // Actually, I'll find the project first to get the code
    const project = await prisma.project.findFirst({
        where: { name: 'Compass Professional' }
    })

    if (!project) {
        console.log("Project not found")
        return
    }

    console.log(`Found project: ${project.name} (${project.code})`)

    // Simulate the query from getProjectByCode
    const projectWithInclude = await prisma.project.findFirst({
        where: { code: project.code },
        include: {
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true
                }
            },
            manager: { select: { id: true, name: true } },
            senior: { select: { id: true, name: true } },
            associate: { select: { id: true, name: true } },
            assignedTemplates: true,
            workItems: {
                take: 1
            }
        }
    })

    console.log("allowedTaskTypes:", projectWithInclude.allowedTaskTypes)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

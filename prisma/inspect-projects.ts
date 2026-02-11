
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Inspecting Projects...')
    const projects = await prisma.project.findMany({
        include: {
            users: { select: { id: true, email: true, name: true } }
        }
    })
    console.log('Total Projects:', projects.length)
    projects.forEach(p => {
        console.log(`Project: ${p.name} (${p.code}) - Users: ${p.users.length}`)
        p.users.forEach(u => console.log(`  - ${u.name} (${u.email})`))
    })

    console.log('\nInspecting Users...')
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } })
    users.forEach(u => console.log(`User: ${u.email} (${u.role}) ID: ${u.id}`))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

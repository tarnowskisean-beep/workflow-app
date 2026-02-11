
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fixing Project Access...')

    // Find the likely admin/main user. 
    // Based on previous output: test@example.com (cmlg15m5100005ra4ren3jhf8)
    const targetUserEmail = 'test@example.com'
    const user = await prisma.user.findUnique({ where: { email: targetUserEmail } })

    if (!user) {
        console.error(`User ${targetUserEmail} not found!`)
        return
    }

    console.log(`Assigning user ${user.email} (${user.id}) to all projects...`)

    const projects = await prisma.project.findMany()

    for (const p of projects) {
        console.log(`Processing project: ${p.name} (${p.code})`)
        await prisma.project.update({
            where: { id: p.id },
            data: {
                users: {
                    connect: { id: user.id }
                }
            }
        })
    }

    console.log('Done! User should now see all projects.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding verification data...')

    // 1. Create Users
    const manager = await prisma.user.create({
        data: {
            email: 'manager@example.com',
            name: 'Alice Manager',
            role: 'MANAGER',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        }
    })

    const senior = await prisma.user.create({
        data: {
            email: 'senior@example.com',
            name: 'Bob Senior',
            role: 'SENIOR',
            managerId: manager.id,
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        }
    })

    const associate = await prisma.user.create({
        data: {
            email: 'associate@example.com',
            name: 'Charlie Associate',
            role: 'ASSOCIATE',
            managerId: senior.id,
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
        }
    })

    console.log('Created users:', { manager: manager.id, senior: senior.id, associate: associate.id })

    // 2. Create Tasks
    await prisma.workItem.create({
        data: {
            title: 'Manager Task',
            description: 'Task for manager',
            status: 'OPEN',
            assigneeId: manager.id,
        }
    })

    await prisma.workItem.create({
        data: {
            title: 'Senior Task',
            description: 'Task for senior',
            status: 'OPEN',
            assigneeId: senior.id,
        }
    })

    await prisma.workItem.create({
        data: {
            title: 'Associate Task',
            description: 'Task for associate',
            status: 'OPEN',
            assigneeId: associate.id,
        }
    })

    console.log('Seeding complete. Use these emails to login (if credentials setup) or just verify via DB inspection.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Template Data...')

    // Create Template Group
    const group = await prisma.taskTemplateGroup.create({
        data: {
            name: 'Monthly Bookkeeping',
            description: 'Standard monthly closing tasks',
            templates: {
                create: [
                    {
                        title: 'Collect Bank Statements',
                        priority: 'P1',
                        relativeDueDays: 0,
                        requiresDocument: true
                    },
                    {
                        title: 'Reconcile Accounts',
                        priority: 'P2',
                        relativeDueDays: 3,
                    },
                    {
                        title: 'Review financials with Client',
                        priority: 'P2',
                        relativeDueDays: 7,
                        isRecurring: true,
                        recurrenceInterval: 'MONTHLY'
                    }
                ]
            }
        }
    })

    console.log(`Created Template Group: ${group.name} (${group.id})`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

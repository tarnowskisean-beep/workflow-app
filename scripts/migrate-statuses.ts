import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Starting migration of legacy task statuses...")

    // Find all tasks with legacy statuses
    const legacyStatuses = ["IN_PROGRESS", "IN_REVIEW", "BLOCKED"]

    const result = await prisma.workItem.updateMany({
        where: {
            status: {
                in: legacyStatuses
            }
        },
        data: {
            status: "OPEN"
        }
    })

    console.log(`Migration complete. Updated ${result.count} tasks to 'OPEN' status.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

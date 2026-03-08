
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function inspectNegativeEntries() {
    console.log("Checking for negative duration time entries...")

    try {
        const negativeEntries = await prisma.timeEntry.findMany({
            where: {
                durationSeconds: {
                    lt: 0
                },
            },
            select: {
                id: true,
                userId: true,
                startedAt: true,
                endedAt: true,
                durationSeconds: true
            }
        })

        console.log(`Found ${negativeEntries.length} entries with negative duration.`)
        console.table(negativeEntries)

    } catch (error) {
        console.error("Error inspecting entries:", error)
    } finally {
        await prisma.$disconnect()
    }
}

inspectNegativeEntries()

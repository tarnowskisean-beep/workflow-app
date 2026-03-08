
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function deleteNegativeEntries() {
    console.log("Deleting negative duration time entries...")

    try {
        const { count } = await prisma.timeEntry.deleteMany({
            where: {
                durationSeconds: {
                    lt: 0
                },
            },
        })

        console.log(`Successfully deleted ${count} entries with negative duration.`)

    } catch (error) {
        console.error("Error deleting entries:", error)
    } finally {
        await prisma.$disconnect()
    }
}

deleteNegativeEntries()

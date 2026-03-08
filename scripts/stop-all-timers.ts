
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function stopAllTimers() {
    console.log("Checking for active time entries...")

    try {
        const activeEntries = await prisma.timeEntry.findMany({
            where: {
                endedAt: null,
            },
        })

        console.log(`Found ${activeEntries.length} active time entries.`)

        if (activeEntries.length === 0) {
            console.log("No active timers to stop.")
            return
        }

        const now = new Date()
        let stoppedCount = 0

        for (const entry of activeEntries) {
            const durationSeconds = Math.round((now.getTime() - entry.startedAt.getTime()) / 1000)

            await prisma.timeEntry.update({
                where: { id: entry.id },
                data: {
                    endedAt: now,
                    durationSeconds: durationSeconds,
                },
            })
            stoppedCount++
        }

        console.log(`Successfully stopped ${stoppedCount} timers.`)
    } catch (error) {
        console.error("Error stopping timers:", error)
    } finally {
        await prisma.$disconnect()
    }
}

stopAllTimers()

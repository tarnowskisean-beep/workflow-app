
import { PrismaClient } from '@prisma/client'
import { addDays, startOfDay } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting February 2026 seed...")

    const users = await prisma.user.findMany()
    const projects = await prisma.project.findMany()

    if (users.length === 0 || projects.length === 0) {
        console.error("❌ No users or projects found.")
        return
    }

    // February 2026 Range
    const febStart = new Date('2026-02-01T00:00:00.000Z')
    // const febEnd = new Date('2026-02-28T23:59:59.999Z')

    // 1. Create Tasks for Feb
    console.log("Creating Feb tasks...")
    const workItems = []
    const statuses = ["OPEN", "IN_PROGRESS", "DONE"]
    const types = ["1099s", "Audit", "Tax Prep", "Consulting"]

    for (let i = 0; i < 40; i++) {
        const project = projects[Math.floor(Math.random() * projects.length)]
        const assignee = users[Math.floor(Math.random() * users.length)]

        // Random date in Feb 1-28
        const dayOffset = Math.floor(Math.random() * 28)
        const date = addDays(febStart, dayOffset)

        const task = await prisma.workItem.create({
            data: {
                title: `Feb Task: ${types[Math.floor(Math.random() * types.length)]} - ${project.code}`,
                description: "February specific workload",
                status: statuses[Math.floor(Math.random() * statuses.length)],
                priority: Math.random() > 0.5 ? "P1" : "P2",
                projectId: project.id,
                assigneeId: assignee.id,
                dueDate: addDays(date, 5),
                createdAt: date
            }
        })
        workItems.push(task)
    }

    // 2. Create Time Entries for Feb
    console.log("Creating Feb time entries...")
    for (let i = 0; i < 150; i++) {
        const user = users[Math.floor(Math.random() * users.length)]

        // Random date in Feb 1-13 (Current date is Feb 13, so lets populate up to now primarily)
        // Actually user asked for Feb, let's do whole month spread to show future planning or past work
        // Let's stick to 1-28 for comprehensive data
        const dayOffset = Math.floor(Math.random() * 28)
        const entryDate = addDays(febStart, dayOffset)

        // Pick a random project
        const project = projects[Math.floor(Math.random() * projects.length)]

        // 40% chance to link to one of our new Feb tasks
        const linkedTask = Math.random() < 0.4 && workItems.length > 0
            ? workItems.filter(t => t.projectId === project.id)[0]
            : null

        await prisma.timeEntry.create({
            data: {
                userId: user.id,
                projectId: project.id,
                workItemId: linkedTask?.id,
                durationSeconds: Math.floor(Math.random() * 10800) + 1800, // 30m - 3.5h
                startedAt: startOfDay(entryDate),
                notes: "Feb work log",
                isBillable: true
            }
        })
    }

    console.log("✅ Feb 2026 Seed Complete")
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

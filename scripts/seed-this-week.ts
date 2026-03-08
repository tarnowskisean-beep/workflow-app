import { PrismaClient } from '@prisma/client'
import { addDays, startOfDay, startOfWeek, endOfWeek, subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting This Week seed...")

    const users = await prisma.user.findMany()
    const projects = await prisma.project.findMany()

    if (users.length === 0 || projects.length === 0) {
        console.error("❌ No users or projects found.")
        return
    }

    const today = new Date('2026-02-26T12:00:00.000Z')
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }) // Sunday start

    // 1. Create Tasks for this week
    console.log("Creating tasks for this week...")
    const workItems = []
    const statuses = ["OPEN", "IN_PROGRESS", "DONE"]
    const types = ["1099s", "Audit", "Tax Prep", "Consulting", "Review", "Meeting"]

    for (let i = 0; i < 30; i++) {
        const project = projects[Math.floor(Math.random() * projects.length)]
        const assignee = users[Math.floor(Math.random() * users.length)]

        // Random date in the current week (Sunday to Saturday)
        const dayOffset = Math.floor(Math.random() * 7)
        const date = addDays(weekStart, dayOffset)

        const task = await prisma.workItem.create({
            data: {
                title: `Demo Task: ${types[Math.floor(Math.random() * types.length)]} - ${project.code}`,
                description: "Demo data for current week",
                status: statuses[Math.floor(Math.random() * statuses.length)],
                priority: Math.random() > 0.5 ? "P1" : "P2",
                projectId: project.id,
                assigneeId: assignee.id,
                dueDate: addDays(date, 2),
                createdAt: subDays(date, 2)
            }
        })
        workItems.push(task)
    }

    // 2. Create Time Entries for this week
    console.log("Creating time entries for this week...")
    for (let i = 0; i < 100; i++) {
        const user = users[Math.floor(Math.random() * users.length)]

        // Random date in the current week (Sunday to Saturday)
        const dayOffset = Math.floor(Math.random() * 7)
        const entryDate = addDays(weekStart, dayOffset)

        // Pick a random project
        const project = projects[Math.floor(Math.random() * projects.length)]

        // 50% chance to link to one of our new tasks
        const projectTasks = workItems.filter(t => t.projectId === project.id)
        const linkedTask = Math.random() < 0.5 && projectTasks.length > 0
            ? projectTasks[Math.floor(Math.random() * projectTasks.length)]
            : null

        await prisma.timeEntry.create({
            data: {
                userId: user.id,
                projectId: project.id,
                workItemId: linkedTask?.id,
                durationSeconds: Math.floor(Math.random() * 10800) + 1800, // 30m - 3.5h
                startedAt: startOfDay(entryDate),
                notes: "Demo work log for this week",
                isBillable: project.isBillable
            }
        })
    }

    console.log("✅ This Week Seed Complete")
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

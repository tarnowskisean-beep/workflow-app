
import { PrismaClient } from '@prisma/client'
import { subDays, addDays, startOfDay } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting task seed...")

    // 1. Fetch Existing Data
    const users = await prisma.user.findMany()
    const projects = await prisma.project.findMany()

    if (users.length === 0 || projects.length === 0) {
        console.error("❌ No users or projects found. Please run the main seed first.")
        return
    }

    console.log(`Found ${users.length} users and ${projects.length} projects.`)

    // 2. Generate Work Items (Tasks)
    const taskTitles = [
        "Financial Review", "Tax Prep", "Payroll Audit", "Strategy Meeting",
        "Client Onboarding", "Cleanup", "EOM Close", "Budget Planning",
        "Compliance Check", "Vendor Analysis", "Data Entry", "Reconciliation"
    ]
    const taskStatuses = ["OPEN", "IN_PROGRESS", "DONE", "REVIEW"]
    const priorities = ["P1", "P2", "P3", "P4"]

    console.log("Creating 50+ tasks...")
    const workItems = []

    for (let i = 0; i < 55; i++) {
        const project = projects[Math.floor(Math.random() * projects.length)]
        const assignee = users[Math.floor(Math.random() * users.length)]
        const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)]

        // Date logic
        const isOverdue = Math.random() > 0.8
        const dueDate = isOverdue
            ? subDays(new Date(), Math.floor(Math.random() * 10))
            : addDays(new Date(), Math.floor(Math.random() * 30))

        const createdAt = subDays(new Date(), Math.floor(Math.random() * 60))
        const completedAt = status === "DONE" ? addDays(createdAt, Math.floor(Math.random() * 10)) : null

        const task = await prisma.workItem.create({
            data: {
                title: `${taskTitles[Math.floor(Math.random() * taskTitles.length)]} - ${project.code}`,
                description: `Auto-generated task for ${project.name}. Needs attention.`,
                status,
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                projectId: project.id,
                assigneeId: assignee.id,
                dueDate,
                completedAt,
                createdAt
            }
        })
        workItems.push(task)
    }

    // 3. Generate Time Entries for these tasks (to populate charts)
    console.log("Creating time entries...")
    const today = new Date()

    for (let i = 0; i < 80; i++) {
        const task = workItems[Math.floor(Math.random() * workItems.length)]
        const user = users.find(u => u.id === task.assigneeId) || users[0]

        const dateOffset = Math.floor(Math.random() * 30) // Last 30 days
        const entryDate = subDays(today, dateOffset)
        const duration = Math.floor(Math.random() * 4 * 3600) + 900 // 15m to 4h

        await prisma.timeEntry.create({
            data: {
                userId: user.id,
                projectId: task.projectId,
                workItemId: task.id,
                durationSeconds: duration,
                startedAt: startOfDay(entryDate),
                notes: `Working on ${task.title}`,
                isBillable: true
            }
        })
    }

    console.log("✅ Task seeding completed!")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

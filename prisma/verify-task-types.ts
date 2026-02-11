
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Starting Task Type Verification...")

    // 1. Setup a Project with Allowed Task Types
    const projectCode = "TYPE-TEST"
    let project = await prisma.project.findUnique({ where: { code: projectCode } })

    if (!project) {
        project = await prisma.project.create({
            data: {
                name: "Type Test Project",
                code: projectCode,
                allowedTaskTypes: "Audit,Tax,Consulting"
            }
        })
        console.log("Created Project:", project.name)
    } else {
        project = await prisma.project.update({
            where: { code: projectCode },
            data: { allowedTaskTypes: "Audit,Tax,Consulting" }
        })
        console.log("Updated Project:", project.name)
    }

    // 2. Create a User (Assignee)
    const userEmail = "typetestuser@example.com"
    let user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: userEmail,
                name: "Type Test User",
                role: "ASSOCIATE"
            }
        })
    }

    // 3. Create a Task with a specific Type
    const taskTitle = "Audit Task 1"
    const taskType = "Audit"

    const task = await prisma.workItem.create({
        data: {
            title: taskTitle,
            status: "OPEN",
            priority: "P2",
            projectId: project.id,
            assigneeId: user.id,
            taskType: taskType,
            driveLink: "https://docs.google.com/document/d/123" // To simulate file
        }
    })
    console.log(`Created Task: ${task.title} with Type: ${task.taskType}`)

    // 4. Verify Task Type Persistence
    const fetchedTask = await prisma.workItem.findUnique({
        where: { id: task.id }
    })

    if (fetchedTask?.taskType === taskType) {
        console.log("SUCCESS: Task Type persisted correctly.")
    } else {
        console.error("FAILURE: Task Type mismatch or missing.")
    }

    // 5. Verify Filtering Logic (Simulation)
    const allFiles = await prisma.workItem.findMany({
        where: {
            driveLink: { not: null }
        }
    })

    const auditFiles = await prisma.workItem.findMany({
        where: {
            driveLink: { not: null },
            taskType: "Audit"
        }
    })

    console.log(`Total Files: ${allFiles.length}`)
    console.log(`Audit Files: ${auditFiles.length}`)

    if (auditFiles.length > 0 && auditFiles.every(t => t.taskType === "Audit")) {
        console.log("SUCCESS: Filtering by Task Type works correctly.")
    } else {
        console.log("WARNING: No Audit files found or filtering failed (might be ok if this is first run).")
    }

    // Cleanup
    await prisma.workItem.delete({ where: { id: task.id } })
    await prisma.project.delete({ where: { id: project.id } }) // Optional: keep for UI testing
    await prisma.user.delete({ where: { id: user.id } })

    console.log("Verification Complete.")
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

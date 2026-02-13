
import { PrismaClient } from '@prisma/client'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting template seed...")

    // 1. Fetch Existing Projects
    const projects = await prisma.project.findMany()
    const users = await prisma.user.findMany()

    if (projects.length === 0) {
        console.error("❌ No projects found.")
        return
    }

    // 2. Define Template Groups (SOPs)
    const templatesData = [
        {
            name: "Quarterly Audit Review",
            description: "Standard procedure for quarterly audits",
            templates: [
                { title: "Request Bank Statements", priority: "P2", relativeDueDays: 0, assigneeRole: "ASSOCIATE", taskType: "Audit" },
                { title: "Analyze Variance", priority: "P1", relativeDueDays: 3, assigneeRole: "SENIOR", taskType: "Audit" },
                { title: "Draft Audit Report", priority: "P2", relativeDueDays: 7, assigneeRole: "SENIOR", taskType: "Reporting" },
                { title: "Manager Review", priority: "P1", relativeDueDays: 10, assigneeRole: "MANAGER", taskType: "Review" },
            ]
        },
        {
            name: "New Client Onboarding",
            description: "Steps for setting up a new client",
            templates: [
                { title: "Send Welcome Packet", priority: "P2", relativeDueDays: 1, assigneeRole: "ASSOCIATE", taskType: "Onboarding" },
                { title: "Set up QuickBooks", priority: "P1", relativeDueDays: 2, assigneeRole: "SENIOR", taskType: "Setup" },
                { title: "Kickoff Meeting", priority: "P1", relativeDueDays: 5, assigneeRole: "MANAGER", taskType: "Meeting" },
            ]
        },
        {
            name: "Payroll Processing",
            description: "Bi-weekly payroll checks",
            templates: [
                { title: "Collect Timesheets", priority: "P1", relativeDueDays: 0, assigneeRole: "ASSOCIATE", taskType: "Payroll" },
                { title: "Verify Overtime", priority: "P2", relativeDueDays: 1, assigneeRole: "SENIOR", taskType: "Payroll" },
                { title: "Submit to Provider", priority: "P1", relativeDueDays: 2, assigneeRole: "MANAGER", taskType: "Payroll" },
            ]
        }
    ]

    // 3. Create Groups and Templates
    for (const tData of templatesData) {
        const group = await prisma.taskTemplateGroup.create({
            data: {
                name: tData.name,
                description: tData.description,
                templates: {
                    create: tData.templates
                }
            },
            include: {
                templates: true
            }
        })
        console.log(`Created Template Group: ${group.name}`)

        // 4. "Apply" to random projects (Create WorkItems from these templates)
        // We'll pick 3 random projects to apply this SOP to
        for (let i = 0; i < 3; i++) {
            const project = projects[Math.floor(Math.random() * projects.length)]
            console.log(`-> Applying to Project: ${project.name}`)

            // Assign Group to Project (Relation)
            await prisma.project.update({
                where: { id: project.id },
                data: {
                    assignedTemplates: {
                        connect: { id: group.id }
                    }
                }
            })

            // Create Actual Tasks (WorkItems)
            for (const template of group.templates) {
                // Find a user with the matching role, or fallback to random
                const assignee = users.find(u => u.role === template.assigneeRole) || users[Math.floor(Math.random() * users.length)]

                await prisma.workItem.create({
                    data: {
                        title: `${template.title} - ${project.code}`,
                        description: `Generated from template: ${group.name}`,
                        status: "OPEN",
                        priority: template.priority,
                        projectId: project.id,
                        assigneeId: assignee.id,
                        dueDate: addDays(new Date(), template.relativeDueDays || 7),
                        taskType: template.taskType
                    }
                })
            }
        }
    }

    console.log("✅ Template seeding completed!")
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

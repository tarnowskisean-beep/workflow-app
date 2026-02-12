
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const projects = [
    { name: "American Accountability Foundation", code: "AAF", description: "Project for organization American Accountability Foundation" },
    { name: "American Accountability Foundation Action", code: "AAFA", description: "Project for organization American Accountability Foundation Action" },
    { name: "American Bull Moose Foundation", code: "ABMF", description: "Project for organization American Bull Moose Foundation" },
    { name: "America First Legal Foundation", code: "AFL", description: "Project for organization America First Legal Foundation" },
    { name: "American Legislative Exchange Council", code: "ALEC", description: "Project for organization American Legislative Exchange Council" },
    { name: "The Bull Moose Project", code: "BMP", description: "Project for organization The Bull Moose Project" },
    { name: "Citizens for Renewing America", code: "CFRA", description: "Project for organization Citizens for Renewing America" },
    { name: "Compass Legal Group", code: "CLG", description: "Project for organization Compass Legal Group" },
    { name: "Conservative Partnership Campus", code: "CPCI", description: "Project for organization Conservative Partnership Campus" },
    { name: "Conservative Partnership Institute", code: "CPI", description: "Project for organization Conservative Partnership Institute" },
    { name: "Conservative Partnership International", code: "CPNT", description: "Project for organization Conservative Partnership International" },
    { name: "Center for Renewing America", code: "CRA", description: "Project for organization Center for Renewing America" },
    { name: "CongressStrong Action", code: "CSA", description: "Project for organization CongressStrong Action" },
    { name: "CongressStrong Foundation", code: "CSF", description: "Project for organization CongressStrong Foundation" },
    { name: "Compass Strategies", code: "CSTRA", description: "Project for organization Compass Strategies" },
    { name: "Center For Urban Renewal and Education", code: "CURE", description: "Project for organization Center For Urban Renewal and Education" },
    { name: "Election Integrity Network", code: "EIN", description: "Project for organization Election Integrity Network" },
    { name: "FAIR Elections Fund", code: "FAIR", description: "Project for organization FAIR Elections Fund" },
    { name: "Immigration Accountability Project", code: "IAP", description: "Project for organization Immigration Accountability Project" },
    { name: "Maryland Family Institute", code: "MFI", description: "Project for organization Maryland Family Institute" },
    { name: "Our America", code: "OA", description: "Project for organization Our America" },
    { name: "Our America Foundation", code: "OAF", description: "Project for organization Our America Foundation" },
    { name: "Personnel Policy Organization", code: "PPO", description: "Project for organization Personnel Policy Organization" },
    { name: "State Freedom Caucus Action", code: "SFCA", description: "Project for organization State Freedom Caucus Action" },
    { name: "State Freedom Caucus Foundation", code: "SFCF", description: "Project for organization State Freedom Caucus Foundation" },
    { name: "State Freedom Caucus Network", code: "SFCN", description: "Project for organization State Freedom Caucus Network" },
    { name: "State Leadership Foundation", code: "SLF", description: "Project for organization State Leadership Foundation" },
]

async function main() {
    console.log("🚀 Starting bulk project import/upsert...")

    let createdCount = 0
    let updatedCount = 0

    for (const project of projects) {
        const existing = await prisma.project.findUnique({
            where: { code: project.code }
        })

        if (existing) {
            console.log(`Updating existing project: ${project.name} (${project.code})`)
            await prisma.project.update({
                where: { code: project.code },
                data: {
                    name: project.name,
                    description: project.description
                }
            })
            updatedCount++
        } else {
            console.log(`Creating new project: ${project.name} (${project.code})`)
            await prisma.project.create({
                data: {
                    name: project.name,
                    code: project.code,
                    description: project.description,
                    isBillable: true // Default to true based on typical business logic, verify if needed
                }
            })
            createdCount++
        }
    }

    console.log("✅ Import completed!")
    console.log(`- Created: ${createdCount}`)
    console.log(`- Updated: ${updatedCount}`)
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

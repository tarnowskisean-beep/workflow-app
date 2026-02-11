
import { prisma } from "../lib/prisma"

async function main() {
    const projects = await prisma.project.findMany()
    console.log("Projects found:", projects.length)
    projects.forEach(p => {
        console.log(`Project: ${p.name} (${p.code})`)
        console.log(`Allowed Types: ${p.allowedTaskTypes}`)
    })
}

main()

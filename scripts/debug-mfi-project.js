const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const projectName = "Maryland Family Institute";
    console.log(`Checking project: ${projectName}`);

    const project = await prisma.project.findFirst({
        where: { name: projectName },
        select: { id: true, name: true, code: true, allowedTaskTypes: true }
    });

    if (!project) {
        console.log("Project not found!");
    } else {
        console.log("Project found:", project);
        if (!project.allowedTaskTypes) {
            console.log("WARNING: allowedTaskTypes is null or empty/undefined");
        } else {
            console.log("Allowed Task Types:", project.allowedTaskTypes);
            console.log("Split types:", project.allowedTaskTypes.split(',').map(t => t.trim()).filter(Boolean));
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

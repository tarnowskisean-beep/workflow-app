const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfWeek, endOfWeek } = require('date-fns');

async function main() {
    // 1. Get a user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found");
        return;
    }
    console.log("Testing with user:", user.email, user.id);

    // 2. Simulate getWeeklyEntries
    const date = new Date();
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const end = endOfWeek(date, { weekStartsOn: 0 });

    console.log("Date Range:", start, end);

    const entries = await prisma.timeEntry.findMany({
        where: {
            userId: user.id,
            startedAt: { gte: start, lte: end }
        },
        include: {
            project: true,
            workItem: true
        },
        orderBy: { startedAt: 'desc' }
    });

    console.log(`Found ${entries.length} entries. First entry:`, entries[0]);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

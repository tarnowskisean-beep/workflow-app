const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@compass.com';
    const password = 'password123';
    console.log(`Upserting test user ${email}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword, role: 'ADMIN' },
        create: { email, password: hashedPassword, name: 'Admin Tester', role: 'ADMIN' }
    });

    console.log(`Password reset for user ${user.id} (${user.email})`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

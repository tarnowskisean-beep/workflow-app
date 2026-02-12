
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'starnowski@compassprofessional.com';
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, password: true }
    });

    if (!user) {
        console.log(`User ${email} not found.`);
        return;
    }

    if (!user.password) {
        console.log(`User ${email} has no password set.`);
    } else {
        console.log(`User ${email} has a password set (hash length: ${user.password.length}).`);
        // Check against common passwords
        const commonPasswords = ['password', 'password123', 'admin', '123456'];
        for (const pwd of commonPasswords) {
            const match = await bcrypt.compare(pwd, user.password);
            if (match) {
                console.log(`Password matches: "${pwd}"`);
                return;
            }
        }
        console.log('Password does not match common defaults.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

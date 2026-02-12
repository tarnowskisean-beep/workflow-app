import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting user seed...")

    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)

    const usersData = [
        { email: 'pcorrigan@compassprofessional.com', name: 'Pat Corrigan', role: 'ADMIN' },
        { email: 'smcmahon@compassprofessional.com', name: 'Sean McMahon', role: 'MANAGER' },
        { email: 'agraham@compassprofessional.com', name: 'Alyssa Graham', role: 'MANAGER' },
        { email: 'cjones@compassprofessional.com', name: 'Colton Jones', role: 'ASSOCIATE' },
        { email: 'lmyers@compassprofessional.com', name: 'Lillie Myers', role: 'ASSOCIATE' },
        { email: 'gsullivan@compassprofessional.com', name: 'Grace Sullivan', role: 'SENIOR' },
        { email: 'achang@compassprofessional.com', name: 'Andre Chang', role: 'SENIOR' },
        { email: 'zodom@compassprofessional.com', name: 'Zach Odom', role: 'ASSOCIATE' },
    ]

    for (const u of usersData) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: { name: u.name, role: u.role },
            create: {
                email: u.email,
                name: u.name,
                role: u.role,
                password: hashedPassword,
                // Default values for other fields
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
                billableRate: u.role === 'MANAGER' ? 250 : u.role === 'SENIOR' ? 185 : 125
            },
        })
        console.log(`Upserted user: ${user.email} (${user.role})`)
    }

    console.log("✅ User seed completed!")
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

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'user@compass.com'
    const password = 'password123'

    const user = await prisma.user.findUnique({ where: { email } })
    console.log('User found:', user)

    if (user && user.password) {
        const match = await bcrypt.compare(password, user.password)
        console.log('Password match:', match)
    } else {
        console.log('User has no password or not found')
    }
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

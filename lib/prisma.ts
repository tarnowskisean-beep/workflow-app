import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prismaDbV2: PrismaClient }

export const prisma = globalForPrisma.prismaDbV2 || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaDbV2 = prisma

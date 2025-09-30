import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Choose DATABASE_URL by NODE_ENV. Default to DATABASE_URL.
// In production on Fly, set FLY_DATABASE_URL or keep DATABASE_URL in secrets.
const databaseUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.FLY_DATABASE_URL || process.env.DATABASE_URL
    : process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

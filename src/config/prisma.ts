import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:dummy@localhost:5432/dummy";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Database connection established');
  } catch (err: any) {
    console.error('Database connection failed:', err);
  }
};

export default prisma;

import { PrismaClient } from '@prisma/client';

// Lazy load or handle connection errors manually to prevent crash
export const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Database connection established');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
};

export default prisma;

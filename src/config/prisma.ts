import pkg from '@prisma/client';
const { PrismaClient } = pkg;

export const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Database connection established');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
};

export default prisma;

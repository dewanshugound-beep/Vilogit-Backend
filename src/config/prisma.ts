import pkg from '@prisma/client';
const { PrismaClient } = pkg;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['warn', 'error'],
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

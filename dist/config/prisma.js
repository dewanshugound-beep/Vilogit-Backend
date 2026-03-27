import { PrismaClient } from '@prisma/client';
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:dummy@localhost:5432/dummy";
const options = {
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
    log: ['query', 'info', 'warn', 'error'],
};
export const prisma = new PrismaClient(options);
export const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('Database connection established');
    }
    catch (err) {
        console.error('Database connection failed:', err);
    }
};
export default prisma;
//# sourceMappingURL=prisma.js.map
import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';
const PORT = process.env.PORT || 8000;
const server = http.createServer(app);
async function bootstrap() {
    try {
        // 1. Connect to Database
        await prisma.$connect();
        logger.info('Database connection established');
        // 2. Connect to Redis
        // Redis connection is handled automatically by ioredis, 
        // but we can verify it's working
        const ping = await redis.ping();
        if (ping === 'PONG') {
            logger.info('Redis connection verified');
        }
        // 3. Start Server
        server.listen(PORT, () => {
            logger.info(`Nexvora Backend running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
        });
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle Graceful Shutdown
const gracefulShutdown = async () => {
    logger.info('Graceful shutdown initiated...');
    server.close(async () => {
        logger.info('HTTP server closed');
        try {
            await prisma.$disconnect();
            logger.info('Database disconnected');
            redis.disconnect();
            logger.info('Redis disconnected');
            process.exit(0);
        }
        catch (err) {
            logger.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
    // Force close after 10s
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// Start
bootstrap();
//# sourceMappingURL=index.js.map
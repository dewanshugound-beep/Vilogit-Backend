import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

import { connectDB } from './config/prisma.js';

async function bootstrap() {
  // 1. Database Connection (Non-blocking)
  connectDB().catch((err: any) => logger.error('Unhandled DB error during start:', err));
  
  // 2. Redis Connection (Graceful)

  try {
    const ping = await redis.ping();
    if (ping === 'PONG') {
      logger.info('Redis connection verified');
    }
  } catch (error) {
    logger.error('Redis connection failed:', error);
  }

  // 3. Start Server
  server.listen(PORT, () => {
    logger.info(`Vilogit Backend running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
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
    } catch (err) {
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

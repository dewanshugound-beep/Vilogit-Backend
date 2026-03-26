import { Redis } from 'ioredis';
import { logger } from './logger.js';
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  },
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Successfully connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

export default redis;

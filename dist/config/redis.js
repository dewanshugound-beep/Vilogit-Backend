import { Redis } from 'ioredis';
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
    },
};
export const redis = new Redis(redisConfig);
redis.on('connect', () => {
    console.log('Successfully connected to Redis');
});
redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});
export default redis;
//# sourceMappingURL=redis.js.map
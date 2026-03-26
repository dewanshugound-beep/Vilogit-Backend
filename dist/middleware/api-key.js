import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { AppError } from './error-handler.js';
import { redis } from '../config/redis.js';
export const requireApiKey = async (req, _res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Authentication requires a Bearer token or API key', 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new AppError('Invalid API key format', 401);
        }
        // Hash the token since it's stored hashed in the database
        // Typically, standard API keys might be plain hash like sha256. 
        // Here we'll do a lookup. We can use Redis to cache valid API keys to avoid DB hit on every inference!
        const hashedKeyCandidate = crypto.createHash('sha256').update(token).digest('hex');
        // Check cache
        const cachedKeyId = await redis.get(`apikey:${hashedKeyCandidate}`);
        let keyData;
        if (cachedKeyId) {
            keyData = await prisma.apiKey.findUnique({
                where: { id: cachedKeyId },
                include: { user: true },
            });
        }
        else {
            keyData = await prisma.apiKey.findFirst({
                where: { keyHash: hashedKeyCandidate, status: 'ACTIVE' },
                include: { user: true },
            });
            if (keyData) {
                // Cache for 5 minutes
                await redis.setex(`apikey:${hashedKeyCandidate}`, 300, keyData.id);
            }
        }
        if (!keyData || keyData.status !== 'ACTIVE') {
            throw new AppError('Invalid or inactive API key', 401);
        }
        // Attach user and key to request
        req.user = keyData.user;
        req.apiKey = keyData;
        next();
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=api-key.js.map
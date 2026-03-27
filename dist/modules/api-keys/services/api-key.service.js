import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../middleware/error-handler.js';
export class ApiKeyService {
    static async listApiKeys(userId) {
        const keys = await prisma.apiKey.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                keyPrefix: true,
                status: true,
                permissions: true,
                usageCount: true,
                lastUsedAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        // Serialize BigInt if needed, Prisma client returns BigInt for usageCount
        return keys.map((k) => ({
            ...k,
            usageCount: Number(k.usageCount),
        }));
    }
    static async createApiKey(userId, input) {
        // Generate a secure 32-byte key in hex (64 chars)
        const rawKey = crypto.randomBytes(32).toString('hex');
        const fullKey = `nx-live-${rawKey}`;
        // keyPrefix is used for display purposes
        const keyPrefix = `nx-live-${rawKey.substring(0, 4)}`;
        // Hash the full key for storage
        const keyHash = await bcrypt.hash(fullKey, 10);
        const apiKey = await prisma.apiKey.create({
            data: {
                userId,
                name: input.name,
                keyPrefix,
                keyHash,
                status: 'ACTIVE',
                permissions: input.permissions,
                rateLimit: 100, // Default per-minute ratelimit
            },
            select: {
                id: true,
                name: true,
                keyPrefix: true,
                status: true,
                permissions: true,
                usageCount: true,
                createdAt: true,
            },
        });
        return {
            key: fullKey,
            apiKey: {
                ...apiKey,
                usageCount: Number(apiKey.usageCount),
            },
        };
    }
    static async revokeApiKey(userId, keyId) {
        const key = await prisma.apiKey.findFirst({
            where: { id: keyId, userId },
        });
        if (!key)
            throw new AppError('API Key not found', 404);
        if (key.status === 'REVOKED')
            return;
        await prisma.apiKey.update({
            where: { id: key.id },
            data: {
                status: 'REVOKED',
                revokedAt: new Date(),
                revokedReason: 'User requested revocation',
            },
        });
    }
}
//# sourceMappingURL=api-key.service.js.map
import { z } from 'zod';
export const createApiKeySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'API Key name is required').max(50, 'Name is too long'),
        permissions: z.array(z.string()).optional().default(['inference:text']),
    }),
});
//# sourceMappingURL=api-key.schema.js.map
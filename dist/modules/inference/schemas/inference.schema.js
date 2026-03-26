import { z } from 'zod';
export const inferenceRequestSchema = z.object({
    body: z.object({
        modelId: z.string().uuid(),
        prompt: z.string().min(1, 'Prompt cannot be empty'),
        payload: z.any().optional().default({}),
    }),
});
//# sourceMappingURL=inference.schema.js.map
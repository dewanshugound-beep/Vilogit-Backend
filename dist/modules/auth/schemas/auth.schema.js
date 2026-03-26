import { z } from 'zod';
export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        username: z.string().min(3),
    }),
});
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});
export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    }),
});
//# sourceMappingURL=auth.schema.js.map
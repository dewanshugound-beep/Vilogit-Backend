import { authService } from '../services/auth.service.js';
import { AppError } from '../../../middleware/error-handler.js';
const COOKIE_NAME = 'vilogit_rt';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
};
function sanitizeUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl ?? null,
        role: user.role,
        status: user.status,
        plan: user.plan,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
    };
}
export class AuthController {
    static async register(req, res, next) {
        try {
            const data = req.body;
            const { user, tokens } = await authService.register(data);
            // Store refresh token in httpOnly cookie
            res.cookie(COOKIE_NAME, tokens.refreshToken, COOKIE_OPTIONS);
            res.status(201).json({
                status: 'success',
                message: 'Registration successful',
                data: {
                    user: sanitizeUser(user),
                    tokens: {
                        accessToken: tokens.accessToken,
                        // Do not send refreshToken in response body — it's in the cookie
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const data = req.body;
            const { user, tokens } = await authService.login(data);
            res.cookie(COOKIE_NAME, tokens.refreshToken, COOKIE_OPTIONS);
            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: {
                    user: sanitizeUser(user),
                    tokens: {
                        accessToken: tokens.accessToken,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async refresh(req, res, next) {
        try {
            const rawRefreshToken = req.cookies?.[COOKIE_NAME];
            if (!rawRefreshToken) {
                throw new AppError('No refresh token provided', 401);
            }
            const { tokens } = await authService.refreshAccessToken(rawRefreshToken);
            // Rotate: set new refresh token cookie
            res.cookie(COOKIE_NAME, tokens.refreshToken, COOKIE_OPTIONS);
            res.status(200).json({
                status: 'success',
                data: {
                    accessToken: tokens.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            const rawRefreshToken = req.cookies?.[COOKIE_NAME];
            if (rawRefreshToken) {
                await authService.logout(rawRefreshToken);
            }
            res.clearCookie(COOKIE_NAME, { path: '/' });
            res.status(200).json({ status: 'success', message: 'Logged out successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    static async signInWithOtp(req, res, next) {
        try {
            const { email } = req.body;
            const result = await authService.signInWithOtp(email);
            res.status(200).json({ status: 'success', ...result });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyOtp(req, res, next) {
        try {
            const { email, token } = req.body;
            const { user, tokens } = await authService.verifyOtp(email, token);
            res.cookie(COOKIE_NAME, tokens.refreshToken, COOKIE_OPTIONS);
            res.status(200).json({
                status: 'success',
                message: 'OTP verified successfully',
                data: {
                    user: sanitizeUser(user),
                    tokens: {
                        accessToken: tokens.accessToken,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=auth.controller.js.map
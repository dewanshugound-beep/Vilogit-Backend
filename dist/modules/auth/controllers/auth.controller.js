import { authService } from '../services/auth.service.js';
export class AuthController {
    static async register(req, res, next) {
        try {
            const data = req.body;
            const { user, tokens } = await authService.register(data);
            res.status(201).json({
                status: 'success',
                message: 'Registration successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        role: user.role,
                    },
                    tokens,
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
            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        role: user.role,
                    },
                    tokens,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=auth.controller.js.map
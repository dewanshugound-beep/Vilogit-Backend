import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data: RegisterInput = req.body;
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
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data: LoginInput = req.body;
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
    } catch (error) {
      next(error);
    }
  }
}

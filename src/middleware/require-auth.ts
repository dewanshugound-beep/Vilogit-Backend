import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';

export interface AuthenticatedRequest extends Request {
  userId: string;
  userRole: string;
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as { sub: string; role: string };

    (req as AuthenticatedRequest).userId = payload.sub;
    (req as AuthenticatedRequest).userRole = payload.role;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new AppError('Access token expired', 401));
    } else if (err.name === 'JsonWebTokenError') {
      next(new AppError('Invalid access token', 401));
    } else {
      next(err);
    }
  }
};

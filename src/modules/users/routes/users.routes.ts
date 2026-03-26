import { Router } from 'express';
import { prisma } from '../../../config/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/require-auth.js';
import { AppError } from '../../../middleware/error-handler.js';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/v1/users/me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        role: true,
        status: true,
        plan: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) throw new AppError('User not found', 404);

    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/me
router.patch('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { name, username, avatarUrl } = req.body;

    // Check username uniqueness if changing
    if (username) {
      const taken = await prisma.user.findFirst({
        where: { username, NOT: { id: userId } },
      });
      if (taken) throw new AppError('Username is already taken', 400);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(username && { username }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true, email: true, name: true, username: true,
        avatarUrl: true, role: true, status: true, plan: true,
        emailVerified: true, createdAt: true,
      },
    });

    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/me/usage
router.get('/me/usage', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const records = await prisma.usageRecord.groupBy({
      by: ['billingMonth'],
      where: { userId },
      _sum: { totalTokens: true, costUsd: true },
      _count: { id: true },
      orderBy: { billingMonth: 'desc' },
      take: 12,
    });

    const data = records.map((r: typeof records[0]) => ({
      billingMonth: r.billingMonth,
      totalTokens: r._sum.totalTokens ?? 0,
      totalCost: r._sum.costUsd ?? 0,
      apiCallsCount: r._count.id,
    }));

    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
});

export default router;

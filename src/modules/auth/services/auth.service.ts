import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../middleware/error-handler.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRE = process.env.JWT_EXPIRE || '1h';
const REFRESH_EXPIRE_DAYS = 7;

class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === input.email) {
        throw new AppError('An account with this email already exists', 400);
      }
      throw new AppError('Username is taken', 400);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        username: input.username,
        status: 'ACTIVE',
      },
    });

    const tokens = this.generateTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Your account has been suspended. Contact support.', 403);
    }

    if (user.status === 'DELETED') {
      throw new AppError('This account no longer exists', 404);
    }

    const tokens = this.generateTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user, tokens };
  }

  async refreshAccessToken(rawRefreshToken: string) {
    let payload: any;
    try {
      payload = jwt.verify(rawRefreshToken, JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const userId = payload.sub as string;

    // Find all active (non-revoked, non-expired) refresh tokens for this user
    const storedTokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    // Verify the submitted token against stored hashes
    let matchedToken: (typeof storedTokens)[0] | undefined;
    for (const t of storedTokens) {
      if (await bcrypt.compare(rawRefreshToken, t.tokenHash)) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      // Refresh token rotation — if token not found, revoke ALL user tokens (possible theft)
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
      throw new AppError('Refresh token reuse detected. Please log in again.', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('User account is not active', 401);
    }

    // Rotate: revoke old, issue new pair
    await prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { isRevoked: true },
    });

    const tokens = this.generateTokens(userId, user.role);
    await this.saveRefreshToken(userId, tokens.refreshToken);

    return { tokens };
  }

  async logout(rawRefreshToken: string) {
    try {
      const payload: any = jwt.verify(rawRefreshToken, JWT_REFRESH_SECRET);
      const userId = payload.sub as string;

      const storedTokens = await prisma.refreshToken.findMany({
        where: { userId, isRevoked: false },
      });

      for (const t of storedTokens) {
        if (await bcrypt.compare(rawRefreshToken, t.tokenHash)) {
          await prisma.refreshToken.update({ where: { id: t.id }, data: { isRevoked: true } });
          break;
        }
      }
    } catch {
      // Best-effort logout
    }
  }

  generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign({ sub: userId, role }, JWT_ACCESS_SECRET, {
      expiresIn: ACCESS_EXPIRE as any,
    });

    const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
      expiresIn: `${REFRESH_EXPIRE_DAYS}d` as any,
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRE_DAYS);

    await prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }
}

export const authService = new AuthService();

import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '@worknest/validators';
import { registerUser, loginUser, refreshTokens, logoutUser } from './auth.service';
import { setCookies, clearCookies } from '../../services/token.service';
import { AppError } from '../../middleware/error.middleware';
import type { AuthRequest } from '../../middleware/auth.middleware';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await registerUser(data);
    setCookies(res, accessToken, refreshToken);
    res.status(201).json({ success: true, message: 'Account created', data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await loginUser(data);
    setCookies(res, accessToken, refreshToken);
    res.json({ success: true, message: 'Logged in', data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.refresh_token;
    if (!rawRefreshToken) {
      throw new AppError('Refresh token missing', 401, 'UNAUTHORIZED');
    }
    const { user, accessToken, refreshToken } = await refreshTokens(rawRefreshToken);
    setCookies(res, accessToken, refreshToken);
    res.json({ success: true, message: 'Tokens refreshed', data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user) {
      await logoutUser(req.user.id);
    }
    clearCookies(res);
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { prisma } = await import('../../config/prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, name: true, avatarUrl: true,
        createdAt: true, updatedAt: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: { id: true, name: true, slug: true, accentColor: true, description: true },
            },
          },
        },
      },
    });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}

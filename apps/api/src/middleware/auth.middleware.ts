import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './error.middleware';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Read token from httpOnly cookie OR Authorization header (for dev tools)
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: string;
      email: string;
      name: string;
    };

    req.user = { id: payload.id, email: payload.email, name: payload.name };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
}

// Guard: user must be a member of the workspace (param: workspaceId)
export async function workspaceGuard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!member) {
      throw new AppError('Workspace not found or access denied', 403, 'FORBIDDEN');
    }

    // Attach role to request for downstream use
    (req as AuthRequest & { memberRole: string }).memberRole = member.role;
    next();
  } catch (error) {
    next(error);
  }
}

// Guard: user must be ADMIN in the workspace
export async function adminGuard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!member || member.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403, 'FORBIDDEN');
    }

    next();
  } catch (error) {
    next(error);
  }
}

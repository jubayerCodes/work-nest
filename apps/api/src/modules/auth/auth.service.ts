import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  compareToken,
  verifyRefreshToken,
} from '../../services/token.service';
import type { RegisterInput, LoginInput } from '@worknest/validators';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  memberships: {
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          accentColor: true,
          description: true,
        },
      },
    },
  },
} as const;

export async function registerUser(data: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      preferences: { create: {} },
    },
    select: USER_SELECT,
  });

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });
  const refreshToken = signRefreshToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  const hashedRefresh = await hashToken(refreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefresh },
  });

  return { user, accessToken, refreshToken };
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { ...USER_SELECT, passwordHash: true, id: true },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const { passwordHash: _pw, ...safeUser } = user;

  const accessToken = signAccessToken({
    id: safeUser.id,
    email: safeUser.email,
    name: safeUser.name,
  });
  const refreshToken = signRefreshToken({
    id: safeUser.id,
    email: safeUser.email,
    name: safeUser.name,
  });

  const hashedRefresh = await hashToken(refreshToken);
  await prisma.user.update({
    where: { id: safeUser.id },
    data: { refreshToken: hashedRefresh },
  });

  return { user: safeUser, accessToken, refreshToken };
}

export async function refreshTokens(rawRefreshToken: string) {
  let payload: { id: string; email: string; name: string };
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, refreshToken: true, memberships: { select: { role: true, workspace: { select: { id: true, name: true, slug: true, accentColor: true, description: true } } } } },
  });

  if (!user || !user.refreshToken) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  const isValid = await compareToken(rawRefreshToken, user.refreshToken);
  if (!isValid) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  const { refreshToken: _rt, ...safeUser } = user;

  const newAccessToken = signAccessToken({
    id: safeUser.id,
    email: safeUser.email,
    name: safeUser.name,
  });
  const newRefreshToken = signRefreshToken({
    id: safeUser.id,
    email: safeUser.email,
    name: safeUser.name,
  });

  const hashedRefresh = await hashToken(newRefreshToken);
  await prisma.user.update({
    where: { id: safeUser.id },
    data: { refreshToken: hashedRefresh },
  });

  return { user: safeUser, accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

interface TokenPayload {
  id: string;
  email: string;
  name: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function compareToken(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function setCookies(
  res: import('express').Response,
  accessToken: string,
  refreshToken: string
): void {
  const isProduction = env.NODE_ENV === 'production';

  // SameSite=None is required for cross-domain deployments (e.g. Render web + API on different subdomains).
  // SameSite=None requires Secure=true, which is enforced in production.
  const sameSite = isProduction ? 'none' : 'lax';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

export function clearCookies(res: import('express').Response): void {
  const isProduction = env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'none' : 'lax';
  // Must clear with same options as set, otherwise browser ignores the clear
  res.clearCookie('access_token', { secure: isProduction, sameSite });
  res.clearCookie('refresh_token', { path: '/', secure: isProduction, sameSite });
}

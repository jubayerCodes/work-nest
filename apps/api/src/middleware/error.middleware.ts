import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Prisma unique constraint violation
  if ((err as { code?: string }).code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'A record with that value already exists.',
      code: 'UNIQUE_CONSTRAINT',
    });
    return;
  }

  // Prisma record not found
  if ((err as { code?: string }).code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Record not found.',
      code: 'NOT_FOUND',
    });
    return;
  }

  console.error('[Unhandled Error]', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/errors/app-error';
import { sendError } from '@shared/utils/response.util';
import { logger } from '../logger';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Request error', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    code: err.code,
  });

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.details);
    return;
  }

  // Handle TypeORM QueryFailedError (e.g. unique constraint violation)
  if (err.code === '23505') {
    sendError(res, 'A duplicate record already exists.', 409, { detail: err.detail });
    return;
  }

  // Handle TypeORM foreign key violation
  if (err.code === '23503') {
    sendError(res, 'Referenced record does not exist or cannot be deleted.', 400, { detail: err.detail });
    return;
  }

  // Fallback internal error
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  sendError(res, message, 500, process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined);
}

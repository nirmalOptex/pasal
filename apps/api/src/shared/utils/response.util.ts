import { Response } from 'express';
import { ApiResponse } from '@chhiyapasal/shared-types';

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message = 'Success',
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message = 'Internal Server Error',
  statusCode = 500,
  error?: any
): Response {
  const payload: ApiResponse = {
    success: false,
    message,
    ...(error ? { error } : {}),
  };
  return res.status(statusCode).json(payload);
}

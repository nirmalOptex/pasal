import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@shared/errors/app-error';
import { JwtUserPayload } from '@chhiyapasal/shared-types';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token is missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_secret_key_change_in_production';

  try {
    const payload = jwt.verify(token, secret) as JwtUserPayload;
    req.user = payload;
    req.businessId = payload.businessId;
    // If user belongs to a specific branch, inject it
    if (payload.branchId) {
      req.branchId = payload.branchId;
    } else if (req.headers['x-branch-id']) {
      // Owner or multi-branch admin passing x-branch-id
      req.branchId = req.headers['x-branch-id'] as string;
    }
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

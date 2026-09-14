import { Request, Response, NextFunction } from 'express';
import { BadRequestError, UnauthorizedError } from '@shared/errors/app-error';

export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.businessId) {
    throw new UnauthorizedError('Tenant business context is required');
  }
  next();
}

export function requireBranch(req: Request, _res: Response, next: NextFunction): void {
  if (!req.branchId) {
    throw new BadRequestError('Branch context is required (set via header x-branch-id or user assignment)');
  }
  next();
}

import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '@shared/errors/app-error';

export function authorize(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User is not authenticated');
    }

    const userPermissions = req.user.permissions || [];
    
    // Check if user has all required permissions or is owner
    if (req.user.roleName === 'OWNER') {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));
    if (!hasAll) {
      throw new ForbiddenError('You do not have permission to perform this action');
    }

    next();
  };
}

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '@shared/utils/response.util';

export class AuthController {
  private authService = new AuthService();

  getTenantBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await this.authService.getTenantBySlug(req.params.slug);
      sendSuccess(res, tenant);
    } catch (err) {
      next(err);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminSecret = req.body.adminSecret || (req.headers['x-admin-secret'] as string | undefined);
      const result = await this.authService.register({ ...req.body, adminSecret });
      sendSuccess(res, result, 'Registered successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const tenantSlug = req.headers['x-tenant-slug'] as string | undefined;
      const result = await this.authService.login(email, password, tenantSlug);
      sendSuccess(res, result, 'Logged in successfully');
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      await this.authService.logout(refreshToken);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  };

  loginPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pin, branchId, employeeId } = req.body;
      const tenantSlug = req.headers['x-tenant-slug'] as string | undefined;
      const result = await this.authService.loginWithPin(pin, branchId, employeeId, tenantSlug);
      sendSuccess(res, result, 'Staff authenticated successfully');
    } catch (err) {
      next(err);
    }
  };

  getBranchStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { branchId } = req.query;
      const tenantSlug = req.headers['x-tenant-slug'] as string | undefined;
      const result = await this.authService.getBranchStaff(branchId as string | undefined, tenantSlug);
      sendSuccess(res, result, 'Branch staff fetched');
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, req.user, 'Current user profile');
    } catch (err) {
      next(err);
    }
  };
}

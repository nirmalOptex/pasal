import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '@shared/utils/response.util';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);
      sendSuccess(res, result, 'Registered successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
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
      const result = await this.authService.loginWithPin(pin, branchId, employeeId);
      sendSuccess(res, result, 'Staff authenticated successfully');
    } catch (err) {
      next(err);
    }
  };

  getBranchStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { branchId } = req.query;
      const result = await this.authService.getBranchStaff(branchId as string | undefined);
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

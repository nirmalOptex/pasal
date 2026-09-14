import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@middleware/validate';
import { authenticate } from '@middleware/authenticate';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';

const router = Router();
const controller = new AuthController();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/login-pin', controller.loginPin);
router.get('/branch-staff', controller.getBranchStaff);
router.post('/refresh', validate(refreshTokenSchema), controller.refreshToken);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

export const authRoutes = router;

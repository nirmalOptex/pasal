import './aliases';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { logger } from './logger';

import { errorHandler } from '@middleware/error-handler';
import { authRoutes } from '@modules/auth/auth.routes';
import { businessRoutes } from '@modules/business/business.routes';
import { branchRoutes } from '@modules/branch/branch.routes';
import { userRoutes } from '@modules/user/user.routes';
import { roleRoutes } from '@modules/role/role.routes';
import { categoryRoutes } from '@modules/category/category.routes';
import { productRoutes } from '@modules/product/product.routes';
import { tableAreaRoutes } from '@modules/table-area/table-area.routes';
import { tableRoutes } from '@modules/table/table.routes';
import { orderRoutes } from '@modules/order/order.routes';
import { kotRoutes } from '@modules/kot/kot.routes';
import { invoiceRoutes } from '@modules/invoice/invoice.routes';
import { paymentRoutes } from '@modules/payment/payment.routes';
import { customerRoutes } from '@modules/customer/customer.routes';
import { creditRoutes } from '@modules/credit/credit.routes';
import { inventoryRoutes } from '@modules/inventory/inventory.routes';
import { recipeRoutes } from '@modules/recipe/recipe.routes';
import { supplierRoutes } from '@modules/supplier/supplier.routes';
import { purchaseRoutes } from '@modules/purchase/purchase.routes';
import { expenseRoutes } from '@modules/expense/expense.routes';
import { loyaltyRoutes } from '@modules/loyalty/loyalty.routes';
import { dashboardRoutes } from '@modules/dashboard/dashboard.routes';
import { reportRoutes } from '@modules/report/report.routes';

export function createApp(): Application {
  const app = express();

  // ─── Security ─────────────────────────────────────────────
  app.use(helmet());

  const allowedOrigin = process.env.FRONTEND_URL;
  app.use(
    cors({
      origin: allowedOrigin || true, // true = reflect any origin; safe for internal/private deployments
      credentials: true,
    })
  );
  if (!allowedOrigin && process.env.NODE_ENV === 'production') {
    logger.warn('CORS is open to all origins. Set FRONTEND_URL in .env.production to restrict access.');
  }

  // ─── Rate limiting ─────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many login attempts. Try again later.' },
  });

  // ─── Parsing ───────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  // ─── Health check ──────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
    });
  });

  // ─── Optional: serve built frontend ───────────────────────
  if (process.env.SERVE_FRONTEND === 'true') {
    const frontendDist = path.resolve(__dirname, '../../../web/dist');
    app.use(express.static(frontendDist));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
    logger.info(`Serving frontend from ${frontendDist}`);
  }

  // ─── API Routes ────────────────────────────────────────────
  const api = '/api/v1';

  app.use(`${api}/auth`, authLimiter, authRoutes);
  app.use(`${api}/businesses`, businessRoutes);
  app.use(`${api}/branches`, branchRoutes);
  app.use(`${api}/users`, userRoutes);
  app.use(`${api}/roles`, roleRoutes);
  app.use(`${api}/categories`, categoryRoutes);
  app.use(`${api}/products`, productRoutes);
  app.use(`${api}/table-areas`, tableAreaRoutes);
  app.use(`${api}/tables`, tableRoutes);
  app.use(`${api}/orders`, orderRoutes);
  app.use(`${api}/kot`, kotRoutes);
  app.use(`${api}/invoices`, invoiceRoutes);
  app.use(`${api}/payments`, paymentRoutes);
  app.use(`${api}/customers`, customerRoutes);
  app.use(`${api}/credit`, creditRoutes);
  app.use(`${api}/inventory`, inventoryRoutes);
  app.use(`${api}/recipes`, recipeRoutes);
  app.use(`${api}/suppliers`, supplierRoutes);
  app.use(`${api}/purchases`, purchaseRoutes);
  app.use(`${api}/expenses`, expenseRoutes);
  app.use(`${api}/loyalty`, loyaltyRoutes);
  app.use(`${api}/dashboard`, dashboardRoutes);
  app.use(`${api}/reports`, reportRoutes);

  // ─── Global error handler ──────────────────────────────────
  app.use(errorHandler);

  return app;
}

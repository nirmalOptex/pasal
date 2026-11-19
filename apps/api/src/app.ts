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

  // Trust first proxy (Render, AWS, Nginx, cloud load balancers)
  app.set('trust proxy', 1);

  // ─── Security ─────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  const frontendEnv = process.env.FRONTEND_URL;

  const corsOrigin = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (e.g. mobile apps, curl, uptime probes)
    if (!origin) return callback(null, true);

    if (!frontendEnv) {
      return callback(null, true);
    }

    const normalized = origin.trim().toLowerCase().replace(/\/+$/, '');
    const allowedOrigins = frontendEnv
      .split(',')
      .map((url) => url.trim().toLowerCase().replace(/\/+$/, ''))
      .filter(Boolean);

    const isAllowed =
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(normalized) ||
      (allowedOrigins.some((url) => url.includes('vercel.app')) && normalized.endsWith('.vercel.app')) ||
      normalized.startsWith('http://localhost:') ||
      normalized.startsWith('http://127.0.0.1:');

    if (isAllowed) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked request from origin: ${origin} (Allowed: ${frontendEnv})`);
    return callback(null, false);
  };

  const corsOptions: cors.CorsOptions = {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-branch-id',
      'x-tenant-slug',
    ],
    exposedHeaders: ['x-branch-id', 'Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

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

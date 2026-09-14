import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import {
  Order,
  Payment,
  Expense,
  CreditAccount,
  InventoryItem,
  OrderItem,
} from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { OrderStatus } from '@chhiyapasal/shared-types';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

// Sales Report by day
router.get('/sales', authorize(PERMISSIONS.REPORT_SALES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const businessId = req.businessId!;
    const branchId = req.branchId;

    const fromStr = (startDate as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const toStr = (endDate as string) || new Date().toISOString().slice(0, 10);

    const query = AppDataSource.getRepository(Order)
      .createQueryBuilder('o')
      .where('o.business_id = :businessId', { businessId })
      .andWhere('DATE(o.created_at) >= :fromStr AND DATE(o.created_at) <= :toStr', { fromStr, toStr })
      .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED });

    if (branchId) query.andWhere('o.branch_id = :branchId', { branchId });

    const dailySales = await query
      .select('DATE(o.created_at)', 'date')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('SUM(o.total_amount)', 'totalSales')
      .addSelect('SUM(o.discount_amount)', 'totalDiscounts')
      .addSelect('SUM(o.tax_amount)', 'totalTax')
      .groupBy('DATE(o.created_at)')
      .orderBy('DATE(o.created_at)', 'ASC')
      .getRawMany();

    sendSuccess(res, dailySales);
  } catch (err) {
    next(err);
  }
});

// Product Sales Report
router.get('/products', authorize(PERMISSIONS.REPORT_SALES), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const businessId = req.businessId!;

    const fromStr = (startDate as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const toStr = (endDate as string) || new Date().toISOString().slice(0, 10);

    const productsSold = await AppDataSource.getRepository(OrderItem)
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .where('o.business_id = :businessId', { businessId })
      .andWhere('DATE(o.created_at) >= :fromStr AND DATE(o.created_at) <= :toStr', { fromStr, toStr })
      .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .select('oi.product_name', 'name')
      .addSelect('SUM(oi.quantity)', 'quantity')
      .addSelect('SUM(oi.total_price)', 'revenue')
      .groupBy('oi.product_name')
      .orderBy('SUM(oi.quantity)', 'DESC')
      .getRawMany();

    sendSuccess(res, productsSold);
  } catch (err) {
    next(err);
  }
});

// Inventory stock report
router.get('/inventory', authorize(PERMISSIONS.REPORT_INVENTORY), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await AppDataSource.getRepository(InventoryItem).find({
      where: { business_id: req.businessId },
      order: { current_stock: 'ASC' },
    });
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
});

export const reportRoutes = router;

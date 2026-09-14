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
import { PaymentMethod, OrderStatus } from '@chhiyapasal/shared-types';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

// Dashboard summary metrics
router.get('/summary', authorize(PERMISSIONS.DASHBOARD_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { range, startDate, endDate } = req.query;
    const businessId = req.businessId!;
    const branchId = req.branchId;

    // Date range calculation
    let fromDate = new Date();
    let toDate = new Date();

    if (range === 'yesterday') {
      fromDate.setDate(fromDate.getDate() - 1);
      toDate.setDate(toDate.getDate() - 1);
    } else if (range === 'this_week') {
      const day = fromDate.getDay();
      fromDate.setDate(fromDate.getDate() - day);
    } else if (range === 'this_month') {
      fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    } else if (startDate && endDate) {
      fromDate = new Date(startDate as string);
      toDate = new Date(endDate as string);
    }

    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr = toDate.toISOString().slice(0, 10);

    // 1. Orders & Sales
    const orderQuery = AppDataSource.getRepository(Order)
      .createQueryBuilder('o')
      .where('o.business_id = :businessId', { businessId })
      .andWhere('DATE(o.created_at) >= :fromStr AND DATE(o.created_at) <= :toStr', { fromStr, toStr })
      .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED });

    if (branchId) orderQuery.andWhere('o.branch_id = :branchId', { branchId });

    const totalOrders = await orderQuery.getCount();
    const salesRaw = await orderQuery.select('COALESCE(SUM(o.total_amount), 0)', 'totalSales').getRawOne();
    const totalSales = parseFloat(salesRaw.totalSales || '0');
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // 2. Payments Breakdown (Cash, QR, Card, Credit)
    const payQuery = AppDataSource.getRepository(Payment)
      .createQueryBuilder('p')
      .where('p.business_id = :businessId', { businessId })
      .andWhere('DATE(p.created_at) >= :fromStr AND DATE(p.created_at) <= :toStr', { fromStr, toStr });

    if (branchId) payQuery.andWhere('p.branch_id = :branchId', { branchId });

    const paymentsByType = await payQuery
      .select('p.payment_method', 'method')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .groupBy('p.payment_method')
      .getRawMany();

    const paymentMap: Record<string, number> = {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.QR]: 0,
      [PaymentMethod.CARD]: 0,
      [PaymentMethod.CREDIT]: 0,
    };
    paymentsByType.forEach((p) => {
      paymentMap[p.method] = parseFloat(p.total);
    });

    // 3. Outstanding Credit (Khata Total across all customers)
    const creditRaw = await AppDataSource.getRepository(CreditAccount)
      .createQueryBuilder('ca')
      .where('ca.business_id = :businessId', { businessId })
      .select('COALESCE(SUM(ca.balance), 0)', 'totalCredit')
      .getRawOne();
    const outstandingCredit = parseFloat(creditRaw.totalCredit || '0');

    // 4. Expenses
    const expenseQuery = AppDataSource.getRepository(Expense)
      .createQueryBuilder('e')
      .where('e.business_id = :businessId', { businessId })
      .andWhere('e.expense_date >= :fromStr AND e.expense_date <= :toStr', { fromStr, toStr });

    if (branchId) expenseQuery.andWhere('e.branch_id = :branchId', { branchId });

    const expenseRaw = await expenseQuery.select('COALESCE(SUM(e.amount), 0)', 'totalExpenses').getRawOne();
    const totalExpenses = parseFloat(expenseRaw.totalExpenses || '0');

    // 5. Top Selling Products
    const topProducts = await AppDataSource.getRepository(OrderItem)
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .where('o.business_id = :businessId', { businessId })
      .andWhere('DATE(o.created_at) >= :fromStr AND DATE(o.created_at) <= :toStr', { fromStr, toStr })
      .andWhere('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .select('oi.product_name', 'name')
      .addSelect('SUM(oi.quantity)', 'totalQuantity')
      .addSelect('SUM(oi.total_price)', 'totalRevenue')
      .groupBy('oi.product_name')
      .orderBy('SUM(oi.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    // 6. Low Stock Alert Count
    const lowStockCount = await AppDataSource.getRepository(InventoryItem)
      .createQueryBuilder('ii')
      .where('ii.business_id = :businessId', { businessId })
      .andWhere('ii.current_stock <= ii.low_stock_threshold')
      .getCount();

    sendSuccess(res, {
      totalSales,
      totalOrders,
      averageOrderValue,
      payments: paymentMap,
      outstandingCredit,
      totalExpenses,
      topProducts,
      lowStockCount,
      dateRange: { from: fromStr, to: toStr },
    });
  } catch (err) {
    next(err);
  }
});

export const dashboardRoutes = router;

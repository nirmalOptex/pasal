import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Purchase, PurchaseItem, InventoryItem, InventoryTransaction, Supplier } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant, requireBranch } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError, BadRequestError } from '@shared/errors/app-error';
import { InventoryTransactionType, PurchasePaymentStatus } from '@chhiyapasal/shared-types';

const router = Router();
const purchaseRepo = AppDataSource.getRepository(Purchase);

router.use(authenticate);
router.use(requireTenant);

// List purchases
router.get('/', authorize(PERMISSIONS.PURCHASE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchases = await purchaseRepo.find({
      where: { business_id: req.businessId },
      relations: ['supplier', 'items', 'items.inventory_item'],
      order: { purchase_date: 'DESC' },
    });
    sendSuccess(res, purchases);
  } catch (err) {
    next(err);
  }
});

// Record purchase & update inventory stock
router.post('/', requireBranch, authorize(PERMISSIONS.PURCHASE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { supplier_id, purchase_date, invoice_number, items, paid_amount, payment_status, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Purchase items are required');
    }

    let subtotal = 0;
    const purchaseItemsData: PurchaseItem[] = [];

    for (const item of items) {
      const qty = Number(item.quantity);
      const unitCost = Number(item.unit_cost);
      const totalCost = qty * unitCost;
      subtotal += totalCost;

      const pItem = queryRunner.manager.create(PurchaseItem, {
        inventory_item_id: item.inventory_item_id,
        quantity: qty,
        unit_cost: unitCost,
        total_cost: totalCost,
      });
      purchaseItemsData.push(pItem);

      // Increase inventory stock
      const invItem = await queryRunner.manager.findOne(InventoryItem, {
        where: { id: item.inventory_item_id, business_id: req.businessId },
      });
      if (!invItem) {
        throw new NotFoundError(`Inventory item ${item.inventory_item_id} not found`);
      }

      const newStock = Number(invItem.current_stock) + qty;
      invItem.current_stock = newStock;
      invItem.cost_per_unit = unitCost;
      await queryRunner.manager.save(invItem);

      // Log Inventory Transaction
      const invTx = queryRunner.manager.create(InventoryTransaction, {
        business_id: req.businessId!,
        branch_id: req.branchId!,
        inventory_item_id: invItem.id,
        type: InventoryTransactionType.PURCHASE,
        quantity: qty,
        balance_after: newStock,
        notes: `Purchase from invoice ${invoice_number || 'N/A'}`,
        created_by: req.user!.userId,
      });
      await queryRunner.manager.save(invTx);
    }

    const totalAmount = subtotal; // can add tax if passed
    const paid = Number(paid_amount || 0);
    const status = paid >= totalAmount 
      ? PurchasePaymentStatus.PAID 
      : paid > 0 
      ? PurchasePaymentStatus.PARTIAL 
      : PurchasePaymentStatus.UNPAID;

    const purchase = queryRunner.manager.create(Purchase, {
      business_id: req.businessId!,
      branch_id: req.branchId!,
      supplier_id,
      purchase_date: purchase_date || new Date().toISOString().slice(0, 10),
      invoice_number: invoice_number || null,
      subtotal,
      tax_amount: 0,
      total_amount: totalAmount,
      paid_amount: paid,
      payment_status: payment_status || status,
      notes: notes || null,
      created_by: req.user!.userId,
    });

    await queryRunner.manager.save(purchase);

    for (const pItem of purchaseItemsData) {
      pItem.purchase_id = purchase.id;
    }
    await queryRunner.manager.save(purchaseItemsData);

    await queryRunner.commitTransaction();

    const created = await purchaseRepo.findOne({
      where: { id: purchase.id },
      relations: ['supplier', 'items', 'items.inventory_item'],
    });

    sendSuccess(res, created, 'Purchase recorded and stock updated', 201);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    next(err);
  } finally {
    await queryRunner.release();
  }
});

export const purchaseRoutes = router;

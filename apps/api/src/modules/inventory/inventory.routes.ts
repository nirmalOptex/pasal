import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { InventoryItem, InventoryTransaction } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant, requireBranch } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError, BadRequestError } from '@shared/errors/app-error';
import { InventoryTransactionType } from '@chhiyapasal/shared-types';

const router = Router();
const itemRepo = AppDataSource.getRepository(InventoryItem);
const txRepo = AppDataSource.getRepository(InventoryTransaction);

router.use(authenticate);
router.use(requireTenant);

// List inventory items (with low-stock filter)
router.get('/', authorize(PERMISSIONS.INVENTORY_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lowStock } = req.query;
    const query = itemRepo.createQueryBuilder('item')
      .where('item.business_id = :businessId', { businessId: req.businessId });

    if (lowStock === 'true') {
      query.andWhere('item.current_stock <= item.low_stock_threshold');
    }

    const items = await query.orderBy('item.name', 'ASC').getMany();
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
});

// Create inventory item
router.post('/', authorize(PERMISSIONS.INVENTORY_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, unit, current_stock, low_stock_threshold, cost_per_unit } = req.body;
    const item = itemRepo.create({
      business_id: req.businessId!,
      name,
      unit,
      current_stock: current_stock || 0,
      low_stock_threshold: low_stock_threshold || 0,
      cost_per_unit: cost_per_unit || null,
      is_active: true,
    });
    await itemRepo.save(item);
    sendSuccess(res, item, 'Inventory item created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Adjust stock (Addition, Deduct, Wastage, Adjustment)
router.post('/:id/adjust', requireBranch, authorize(PERMISSIONS.INVENTORY_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { type, quantity, notes } = req.body;
    const qtyChange = Number(quantity); // positive or negative

    if (isNaN(qtyChange)) {
      throw new BadRequestError('Quantity must be a valid number');
    }

    const item = await queryRunner.manager.findOne(InventoryItem, {
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!item) throw new NotFoundError('Inventory item not found');

    const newStock = Number(item.current_stock) + qtyChange;
    item.current_stock = newStock;
    await queryRunner.manager.save(item);

    const tx = queryRunner.manager.create(InventoryTransaction, {
      business_id: req.businessId!,
      branch_id: req.branchId!,
      inventory_item_id: item.id,
      type: type || InventoryTransactionType.ADJUSTMENT,
      quantity: qtyChange,
      balance_after: newStock,
      notes: notes || null,
      created_by: req.user!.userId,
    });
    await queryRunner.manager.save(tx);

    await queryRunner.commitTransaction();
    sendSuccess(res, { item, transaction: tx }, 'Stock adjusted successfully');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    next(err);
  } finally {
    await queryRunner.release();
  }
});

// Get stock transaction history
router.get('/:id/transactions', authorize(PERMISSIONS.INVENTORY_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await txRepo.find({
      where: { inventory_item_id: req.params.id, business_id: req.businessId },
      relations: ['creator'],
      order: { created_at: 'DESC' },
      take: 50,
    });
    sendSuccess(res, transactions);
  } catch (err) {
    next(err);
  }
});

export const inventoryRoutes = router;

import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Table } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireBranch } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const tableRepo = AppDataSource.getRepository(Table);

// List tables for branch
router.get('/', authenticate, requireBranch, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await tableRepo.find({
      where: { branch_id: req.branchId },
      relations: ['area'],
      order: { name: 'ASC' },
    });
    sendSuccess(res, tables);
  } catch (err) {
    next(err);
  }
});

// Create table
router.post('/', authenticate, requireBranch, authorize(PERMISSIONS.TABLE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table_area_id, name, capacity, status } = req.body;
    const table = tableRepo.create({
      branch_id: req.branchId!,
      table_area_id,
      name,
      capacity: capacity || 4,
      status: status || undefined,
    });
    await tableRepo.save(table);
    const created = await tableRepo.findOne({ where: { id: table.id }, relations: ['area'] });
    sendSuccess(res, created, 'Table created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Update table (status e.g. AVAILABLE, OCCUPIED, RESERVED, CLEANING)
router.patch('/:id', authenticate, requireBranch, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const table = await tableRepo.findOne({
      where: { id: req.params.id, branch_id: req.branchId },
    });
    if (!table) throw new NotFoundError('Table not found');

    const { table_area_id, name, capacity, status } = req.body;
    if (table_area_id !== undefined) table.table_area_id = table_area_id;
    if (name !== undefined) table.name = name;
    if (capacity !== undefined) table.capacity = capacity;
    if (status !== undefined) table.status = status;

    await tableRepo.save(table);
    const updated = await tableRepo.findOne({ where: { id: table.id }, relations: ['area'] });
    sendSuccess(res, updated, 'Table updated successfully');
  } catch (err) {
    next(err);
  }
});

// Transfer order from this table to another table
router.post('/:id/transfer-order', authenticate, requireBranch, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { target_table_id } = req.body;
    if (!target_table_id) {
      res.status(400).json({ success: false, message: 'target_table_id is required' });
      return;
    }

    const orderRepo = AppDataSource.getRepository('Order');

    // Find source table
    const sourceTable = await tableRepo.findOne({
      where: { id: req.params.id, branch_id: req.branchId },
    });
    if (!sourceTable) throw new NotFoundError('Source table not found');

    // Find target table
    const targetTable = await tableRepo.findOne({
      where: { id: target_table_id, branch_id: req.branchId },
    });
    if (!targetTable) throw new NotFoundError('Target table not found');

    // Find the active order on source table
    const activeOrder = await orderRepo.findOne({
      where: { table_id: req.params.id, branch_id: req.branchId, status: 'open' } as any,
    });
    if (!activeOrder) {
      res.status(400).json({ success: false, message: 'No active order on source table' });
      return;
    }

    await AppDataSource.transaction(async (manager) => {
      // Move the order
      await manager.update('Order', (activeOrder as any).id, { table_id: target_table_id });
      // Mark source as cleaning
      await manager.update('Table', sourceTable.id, { status: 'cleaning' });
      // Mark target as occupied
      await manager.update('Table', targetTable.id, { status: 'occupied' });
    });

    sendSuccess(res, { moved_order_id: (activeOrder as any).id }, 'Order transferred successfully');
  } catch (err) {
    next(err);
  }
});

// Delete a table
router.delete('/:id', authenticate, requireBranch, authorize(PERMISSIONS.TABLE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const table = await tableRepo.findOne({
      where: { id: req.params.id, branch_id: req.branchId },
    });
    if (!table) throw new NotFoundError('Table not found');
    await tableRepo.remove(table);
    sendSuccess(res, null, 'Table deleted successfully');
  } catch (err) {
    next(err);
  }
});

export const tableRoutes = router;

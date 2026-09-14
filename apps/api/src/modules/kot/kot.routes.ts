import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Kot, KotItem, Order } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireBranch } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';
import { KotStatus, OrderStatus } from '@chhiyapasal/shared-types';

const router = Router();
const kotRepo = AppDataSource.getRepository(Kot);
const kotItemRepo = AppDataSource.getRepository(KotItem);
const orderRepo = AppDataSource.getRepository(Order);

router.use(authenticate);

// Get all active KOTs for kitchen display
router.get('/', requireBranch, authorize(PERMISSIONS.KOT_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const query = kotRepo.createQueryBuilder('kot')
      .leftJoinAndSelect('kot.items', 'items')
      .leftJoinAndSelect('kot.order', 'order')
      .leftJoinAndSelect('order.table', 'table')
      .where('kot.branch_id = :branchId', { branchId: req.branchId });

    if (status) {
      query.andWhere('kot.status = :status', { status });
    } else {
      // By default show active tickets (not served)
      query.andWhere('kot.status != :served', { served: KotStatus.SERVED });
    }

    const kots = await query.orderBy('kot.created_at', 'ASC').getMany();
    sendSuccess(res, kots);
  } catch (err) {
    next(err);
  }
});

// Update KOT status (NEW -> PREPARING -> READY -> SERVED)
router.patch('/:id/status', requireBranch, authorize(PERMISSIONS.KOT_STATUS_UPDATE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const kot = await kotRepo.findOne({
      where: { id: req.params.id, branch_id: req.branchId },
      relations: ['order', 'items'],
    });
    if (!kot) throw new NotFoundError('KOT not found');

    kot.status = status;
    await kotRepo.save(kot);

    // Update all item statuses inside KOT
    await kotItemRepo.update({ kot_id: kot.id }, { status });

    // Sync corresponding Order status if appropriate
    if (status === KotStatus.PREPARING) {
      await orderRepo.update({ id: kot.order_id }, { status: OrderStatus.PREPARING });
    } else if (status === KotStatus.READY) {
      await orderRepo.update({ id: kot.order_id }, { status: OrderStatus.READY });
    } else if (status === KotStatus.SERVED) {
      await orderRepo.update({ id: kot.order_id }, { status: OrderStatus.SERVED });
    }

    const updated = await kotRepo.findOne({
      where: { id: kot.id },
      relations: ['items', 'order'],
    });

    sendSuccess(res, updated, `KOT status updated to ${status}`);
  } catch (err) {
    next(err);
  }
});

export const kotRoutes = router;

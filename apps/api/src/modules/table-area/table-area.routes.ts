import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { TableArea } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireBranch } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const areaRepo = AppDataSource.getRepository(TableArea);

// List table areas for branch
router.get('/', authenticate, requireBranch, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const areas = await areaRepo.find({
      where: { branch_id: req.branchId },
      relations: ['tables'],
      order: { name: 'ASC' },
    });
    sendSuccess(res, areas);
  } catch (err) {
    next(err);
  }
});

// Create table area
router.post('/', authenticate, requireBranch, authorize(PERMISSIONS.TABLE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const area = areaRepo.create({
      branch_id: req.branchId!,
      name,
      description,
    });
    await areaRepo.save(area);
    sendSuccess(res, area, 'Table area created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Update table area
router.patch('/:id', authenticate, requireBranch, authorize(PERMISSIONS.TABLE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await areaRepo.findOne({
      where: { id: req.params.id, branch_id: req.branchId },
    });
    if (!area) throw new NotFoundError('Table area not found');

    const { name, description } = req.body;
    if (name !== undefined) area.name = name;
    if (description !== undefined) area.description = description;

    await areaRepo.save(area);
    sendSuccess(res, area, 'Table area updated successfully');
  } catch (err) {
    next(err);
  }
});

export const tableAreaRoutes = router;

import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Branch } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const branchRepo = AppDataSource.getRepository(Branch);

// List branches for current business
router.get('/', authenticate, requireTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await branchRepo.find({
      where: { business_id: req.businessId },
      order: { created_at: 'ASC' },
    });
    sendSuccess(res, branches);
  } catch (err) {
    next(err);
  }
});

// Create new branch
router.post('/', authenticate, requireTenant, authorize(PERMISSIONS.BRANCH_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, phone } = req.body;
    const branch = branchRepo.create({
      business_id: req.businessId!,
      name,
      address,
      phone,
    });
    await branchRepo.save(branch);
    sendSuccess(res, branch, 'Branch created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Get single branch
router.get('/:id', authenticate, requireTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await branchRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!branch) throw new NotFoundError('Branch not found');
    sendSuccess(res, branch);
  } catch (err) {
    next(err);
  }
});

// Update branch
router.patch('/:id', authenticate, requireTenant, authorize(PERMISSIONS.BRANCH_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await branchRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!branch) throw new NotFoundError('Branch not found');

    const { name, address, phone, status } = req.body;
    if (name !== undefined) branch.name = name;
    if (address !== undefined) branch.address = address;
    if (phone !== undefined) branch.phone = phone;
    if (status !== undefined) branch.status = status;

    await branchRepo.save(branch);
    sendSuccess(res, branch, 'Branch updated successfully');
  } catch (err) {
    next(err);
  }
});

export const branchRoutes = router;

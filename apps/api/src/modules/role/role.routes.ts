import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Role } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError, BadRequestError } from '@shared/errors/app-error';

const router = Router();
const roleRepo = AppDataSource.getRepository(Role);

// List roles
router.get('/', authenticate, requireTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await roleRepo.find({
      where: { business_id: req.businessId },
      order: { is_system: 'DESC', name: 'ASC' },
    });
    sendSuccess(res, roles);
  } catch (err) {
    next(err);
  }
});

// Create role
router.post('/', authenticate, requireTenant, authorize(PERMISSIONS.ROLE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, permissions } = req.body;
    const role = roleRepo.create({
      business_id: req.businessId!,
      name,
      permissions: permissions || [],
      is_system: false,
    });
    await roleRepo.save(role);
    sendSuccess(res, role, 'Role created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Update role
router.patch('/:id', authenticate, requireTenant, authorize(PERMISSIONS.ROLE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await roleRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!role) throw new NotFoundError('Role not found');

    const { name, permissions } = req.body;
    if (name !== undefined) role.name = name;
    if (permissions !== undefined) role.permissions = permissions;

    await roleRepo.save(role);
    sendSuccess(res, role, 'Role updated successfully');
  } catch (err) {
    next(err);
  }
});

// Delete role (cannot delete system roles)
router.delete('/:id', authenticate, requireTenant, authorize(PERMISSIONS.ROLE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await roleRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!role) throw new NotFoundError('Role not found');
    if (role.is_system) throw new BadRequestError('Cannot delete a system role');

    await roleRepo.remove(role);
    sendSuccess(res, null, 'Role deleted successfully');
  } catch (err) {
    next(err);
  }
});

export const roleRoutes = router;

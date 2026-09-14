import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '@database/data-source';
import { User, Role, Branch } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '@shared/errors/app-error';

const router = Router();
const userRepo = AppDataSource.getRepository(User);
const roleRepo = AppDataSource.getRepository(Role);
const branchRepo = AppDataSource.getRepository(Branch);

// List users for business
router.get('/', authenticate, requireTenant, authorize(PERMISSIONS.USER_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = userRepo.createQueryBuilder('user')
      .addSelect('user.pin_hash')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.branch', 'branch')
      .where('user.business_id = :businessId', { businessId: req.businessId });

    // If branch filter specified in query
    if (req.query.branchId) {
      query.andWhere('(user.branch_id = :branchId OR user.branch_id IS NULL)', { branchId: req.query.branchId });
    }

    const users = await query.orderBy('user.created_at', 'DESC').getMany();

    // Map has_pin and strip sensitive hash
    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      business_id: u.business_id,
      branch_id: u.branch_id,
      branch: u.branch ? { id: u.branch.id, name: u.branch.name } : null,
      role_id: u.role_id,
      role: u.role ? { id: u.role.id, name: u.role.name, permissions: u.role.permissions } : null,
      is_active: u.is_active,
      has_pin: Boolean(u.pin_hash),
      last_login_at: u.last_login_at,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));

    sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
});

// Create user / employee
router.post('/', authenticate, requireTenant, authorize(PERMISSIONS.USER_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, role_id, branch_id, pin } = req.body;

    if (!name || !email || !password || !role_id) {
      throw new BadRequestError('Name, email, password, and role are required');
    }

    const existing = await userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictError('A user with this email address already exists');

    const role = await roleRepo.findOne({ where: { id: role_id, business_id: req.businessId } });
    if (!role) throw new BadRequestError('Invalid role selected');

    if (branch_id) {
      const branch = await branchRepo.findOne({ where: { id: branch_id, business_id: req.businessId } });
      if (!branch) throw new BadRequestError('Invalid branch selected');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let pinHash: string | null = null;
    if (pin && typeof pin === 'string' && pin.trim().length >= 4) {
      pinHash = await bcrypt.hash(pin.trim(), 10);
    }

    const user = userRepo.create({
      business_id: req.businessId!,
      branch_id: branch_id || null,
      role_id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      password_hash: passwordHash,
      pin_hash: pinHash,
      is_active: true,
    });

    await userRepo.save(user);

    const created = await userRepo.findOne({
      where: { id: user.id },
      relations: ['role', 'branch'],
    });

    sendSuccess(res, {
      ...created,
      has_pin: Boolean(pinHash),
    }, 'Employee created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Update user / employee
router.patch('/:id', authenticate, requireTenant, authorize(PERMISSIONS.USER_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!user) throw new NotFoundError('User not found');

    const { name, phone, role_id, branch_id, is_active, password, pin } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;
    if (role_id !== undefined) {
      const role = await roleRepo.findOne({ where: { id: role_id, business_id: req.businessId } });
      if (!role) throw new BadRequestError('Invalid role');
      user.role_id = role_id;
    }
    if (branch_id !== undefined) {
      user.branch_id = branch_id || null;
    }
    if (is_active !== undefined) {
      // Prevent deactivating own account
      if (req.user?.userId === user.id && !is_active) {
        throw new ForbiddenError('You cannot deactivate your own account');
      }
      user.is_active = is_active;
    }
    if (password && typeof password === 'string' && password.length >= 6) {
      user.password_hash = await bcrypt.hash(password, 10);
    }
    if (pin !== undefined) {
      if (!pin || pin === '') {
        user.pin_hash = null;
      } else if (typeof pin === 'string' && pin.trim().length >= 4) {
        user.pin_hash = await bcrypt.hash(pin.trim(), 10);
      }
    }

    await userRepo.save(user);

    const updated = await userRepo.findOne({
      where: { id: user.id },
      relations: ['role', 'branch'],
    });

    sendSuccess(res, {
      ...updated,
      has_pin: Boolean(user.pin_hash),
    }, 'Employee updated successfully');
  } catch (err) {
    next(err);
  }
});

// Toggle active status
router.post('/:id/toggle-status', authenticate, requireTenant, authorize(PERMISSIONS.USER_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
      relations: ['role'],
    });
    if (!user) throw new NotFoundError('User not found');

    if (req.user?.userId === user.id) {
      throw new ForbiddenError('You cannot change status of your own account');
    }

    user.is_active = !user.is_active;
    await userRepo.save(user);

    sendSuccess(res, { id: user.id, is_active: user.is_active }, `Employee ${user.is_active ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    next(err);
  }
});

// Delete user
router.delete('/:id', authenticate, requireTenant, authorize(PERMISSIONS.USER_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
      relations: ['role'],
    });
    if (!user) throw new NotFoundError('User not found');

    if (req.user?.userId === user.id) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    // Check if user is the only OWNER
    if (user.role?.name === 'OWNER') {
      const ownerCount = await userRepo.createQueryBuilder('u')
        .innerJoin('u.role', 'r')
        .where('u.business_id = :businessId', { businessId: req.businessId })
        .andWhere('r.name = :roleName', { roleName: 'OWNER' })
        .andWhere('u.is_active = true')
        .getCount();

      if (ownerCount <= 1) {
        throw new ForbiddenError('Cannot delete the primary owner of the business');
      }
    }

    try {
      await userRepo.remove(user);
      sendSuccess(res, null, 'Employee deleted successfully');
    } catch (dbErr: any) {
      // If foreign keys (orders, invoices, etc.) prevent deletion, soft-deactivate instead
      user.is_active = false;
      await userRepo.save(user);
      sendSuccess(res, null, 'Employee has related sales records and was deactivated instead of permanently deleted');
    }
  } catch (err) {
    next(err);
  }
});

export const userRoutes = router;

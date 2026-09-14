import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Supplier } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const supplierRepo = AppDataSource.getRepository(Supplier);

router.use(authenticate);
router.use(requireTenant);

// List suppliers
router.get('/', authorize(PERMISSIONS.SUPPLIER_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suppliers = await supplierRepo.find({
      where: { business_id: req.businessId },
      order: { name: 'ASC' },
    });
    sendSuccess(res, suppliers);
  } catch (err) {
    next(err);
  }
});

// Create supplier
router.post('/', authorize(PERMISSIONS.SUPPLIER_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email, address } = req.body;
    const supplier = supplierRepo.create({
      business_id: req.businessId!,
      name,
      phone,
      email,
      address,
      is_active: true,
    });
    await supplierRepo.save(supplier);
    sendSuccess(res, supplier, 'Supplier created successfully', 201);
  } catch (err) {
    next(err);
  }
});

export const supplierRoutes = router;

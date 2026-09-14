import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Business } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const businessRepo = AppDataSource.getRepository(Business);

// Get current business details
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const business = await businessRepo.findOne({ where: { id: req.params.id } });
    if (!business) throw new NotFoundError('Business not found');
    sendSuccess(res, business);
  } catch (err) {
    next(err);
  }
});

// Update business
router.patch('/:id', authenticate, authorize(PERMISSIONS.BUSINESS_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const business = await businessRepo.findOne({ where: { id: req.params.id } });
    if (!business) throw new NotFoundError('Business not found');

    const { name, address, phone, email, logo_url, currency, timezone } = req.body;
    if (name !== undefined) business.name = name;
    if (address !== undefined) business.address = address;
    if (phone !== undefined) business.phone = phone;
    if (email !== undefined) business.email = email;
    if (logo_url !== undefined) business.logo_url = logo_url;
    if (currency !== undefined) business.currency = currency;
    if (timezone !== undefined) business.timezone = timezone;

    await businessRepo.save(business);
    sendSuccess(res, business, 'Business updated successfully');
  } catch (err) {
    next(err);
  }
});

export const businessRoutes = router;

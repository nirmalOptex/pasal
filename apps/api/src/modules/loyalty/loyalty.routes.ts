import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { LoyaltyRule, LoyaltyTransaction, Customer } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError, BadRequestError } from '@shared/errors/app-error';
import { LoyaltyTransactionType } from '@chhiyapasal/shared-types';

const router = Router();
const ruleRepo = AppDataSource.getRepository(LoyaltyRule);
const txRepo = AppDataSource.getRepository(LoyaltyTransaction);
const customerRepo = AppDataSource.getRepository(Customer);

router.use(authenticate);
router.use(requireTenant);

// Get or create loyalty configuration
router.get('/rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let rule = await ruleRepo.findOne({ where: { business_id: req.businessId } });
    if (!rule) {
      rule = ruleRepo.create({
        business_id: req.businessId!,
        spend_amount: 100,
        points_earned: 1,
        point_redemption_value: 1,
        is_active: true,
      });
      await ruleRepo.save(rule);
    }
    sendSuccess(res, rule);
  } catch (err) {
    next(err);
  }
});

// Update loyalty rule
router.post('/rules', authorize(PERMISSIONS.LOYALTY_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { spend_amount, points_earned, point_redemption_value, is_active } = req.body;
    let rule = await ruleRepo.findOne({ where: { business_id: req.businessId } });
    if (!rule) {
      rule = ruleRepo.create({ business_id: req.businessId! });
    }
    if (spend_amount !== undefined) rule.spend_amount = spend_amount;
    if (points_earned !== undefined) rule.points_earned = points_earned;
    if (point_redemption_value !== undefined) rule.point_redemption_value = point_redemption_value;
    if (is_active !== undefined) rule.is_active = is_active;

    await ruleRepo.save(rule);
    sendSuccess(res, rule, 'Loyalty rules updated successfully');
  } catch (err) {
    next(err);
  }
});

// Redeem loyalty points
router.post('/redeem', authorize(PERMISSIONS.PAYMENT_PROCESS), async (req: Request, res: Response, next: NextFunction) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { customerId, pointsToRedeem, orderId } = req.body;
    const points = parseInt(pointsToRedeem, 10);

    if (!points || points <= 0) {
      throw new BadRequestError('Points to redeem must be greater than zero');
    }

    const customer = await queryRunner.manager.findOne(Customer, {
      where: { id: customerId, business_id: req.businessId },
    });
    if (!customer) throw new NotFoundError('Customer not found');

    if (customer.loyalty_points < points) {
      throw new BadRequestError(`Insufficient points: Customer has ${customer.loyalty_points} points`);
    }

    const newPoints = customer.loyalty_points - points;
    customer.loyalty_points = newPoints;
    await queryRunner.manager.save(customer);

    const tx = queryRunner.manager.create(LoyaltyTransaction, {
      business_id: req.businessId!,
      customer_id: customer.id,
      order_id: orderId || null,
      type: LoyaltyTransactionType.REDEEM,
      points: -points,
      balance_after: newPoints,
      notes: 'Points redeemed for discount',
      created_by: req.user!.userId,
    });
    await queryRunner.manager.save(tx);

    await queryRunner.commitTransaction();

    sendSuccess(res, { customer, transaction: tx }, 'Points redeemed successfully');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    next(err);
  } finally {
    await queryRunner.release();
  }
});

export const loyaltyRoutes = router;

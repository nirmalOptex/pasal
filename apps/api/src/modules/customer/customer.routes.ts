import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Customer, CreditAccount, Order, Invoice } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const customerRepo = AppDataSource.getRepository(Customer);
const creditAccountRepo = AppDataSource.getRepository(CreditAccount);

router.use(authenticate);
router.use(requireTenant);

// List customers with search
router.get('/', authorize(PERMISSIONS.CUSTOMER_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const query = customerRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.credit_account', 'credit')
      .where('c.business_id = :businessId', { businessId: req.businessId });

    if (search) {
      query.andWhere('(LOWER(c.name) LIKE LOWER(:search) OR c.phone LIKE :search)', { search: `%${search}%` });
    }

    const customers = await query.orderBy('c.name', 'ASC').getMany();
    sendSuccess(res, customers);
  } catch (err) {
    next(err);
  }
});

// Create customer
router.post('/', authorize(PERMISSIONS.CUSTOMER_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email, credit_limit } = req.body;
    const customer = customerRepo.create({
      business_id: req.businessId!,
      name,
      phone,
      email,
      credit_balance: 0,
      loyalty_points: 0,
      is_active: true,
    });
    await customerRepo.save(customer);

    // Automatically create credit account
    const creditAccount = creditAccountRepo.create({
      business_id: req.businessId!,
      customer_id: customer.id,
      balance: 0,
      credit_limit: credit_limit || null,
    });
    await creditAccountRepo.save(creditAccount);

    customer.credit_account = creditAccount;
    sendSuccess(res, customer, 'Customer created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Get customer profile + history
router.get('/:id', authorize(PERMISSIONS.CUSTOMER_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customerRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
      relations: ['credit_account', 'credit_account.transactions'],
    });
    if (!customer) throw new NotFoundError('Customer not found');

    const orders = await AppDataSource.getRepository(Order).find({
      where: { customer_id: customer.id },
      order: { created_at: 'DESC' },
      take: 10,
    });

    sendSuccess(res, { customer, recentOrders: orders });
  } catch (err) {
    next(err);
  }
});

export const customerRoutes = router;

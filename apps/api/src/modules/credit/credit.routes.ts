import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { CreditAccount, CreditTransaction, Customer } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError, BadRequestError } from '@shared/errors/app-error';
import { CreditTransactionType } from '@chhiyapasal/shared-types';

const router = Router();
const accountRepo = AppDataSource.getRepository(CreditAccount);
const transactionRepo = AppDataSource.getRepository(CreditTransaction);
const customerRepo = AppDataSource.getRepository(Customer);

router.use(authenticate);
router.use(requireTenant);

// List all outstanding credit accounts (Khata book summary)
router.get('/accounts', authorize(PERMISSIONS.CREDIT_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await accountRepo.find({
      where: { business_id: req.businessId },
      relations: ['customer'],
      order: { balance: 'DESC' },
    });
    sendSuccess(res, accounts);
  } catch (err) {
    next(err);
  }
});

// Settle customer credit (Customer pays off their Khata)
router.post('/settle', authorize(PERMISSIONS.CREDIT_SETTLE), async (req: Request, res: Response, next: NextFunction) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { customerId, amount, notes } = req.body;
    const settleAmount = Number(amount);

    if (!settleAmount || settleAmount <= 0) {
      throw new BadRequestError('Settlement amount must be greater than zero');
    }

    const account = await queryRunner.manager.findOne(CreditAccount, {
      where: { customer_id: customerId, business_id: req.businessId },
    });

    if (!account) throw new NotFoundError('Credit account not found for customer');

    const currentBalance = Number(account.balance);
    if (settleAmount > currentBalance) {
      throw new BadRequestError(`Settlement amount (${settleAmount}) exceeds current balance (${currentBalance})`);
    }

    const newBalance = currentBalance - settleAmount;
    account.balance = newBalance;
    await queryRunner.manager.save(account);

    // Record settlement CREDIT transaction (lowers debt)
    const transaction = queryRunner.manager.create(CreditTransaction, {
      business_id: req.businessId!,
      credit_account_id: account.id,
      type: CreditTransactionType.CREDIT,
      amount: settleAmount,
      balance_after: newBalance,
      notes: notes || 'Credit balance settlement / Khata payment',
      created_by: req.user!.userId,
    });
    await queryRunner.manager.save(transaction);

    // Sync Customer denormalized balance
    await queryRunner.manager.update(Customer, { id: customerId }, { credit_balance: newBalance });

    await queryRunner.commitTransaction();

    sendSuccess(res, { account, transaction }, 'Khata settlement recorded successfully', 201);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    next(err);
  } finally {
    await queryRunner.release();
  }
});

// Get transaction history for an account
router.get('/transactions/:accountId', authorize(PERMISSIONS.CREDIT_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await transactionRepo.find({
      where: { credit_account_id: req.params.accountId, business_id: req.businessId },
      relations: ['invoice', 'creator'],
      order: { created_at: 'DESC' },
    });
    sendSuccess(res, transactions);
  } catch (err) {
    next(err);
  }
});

export const creditRoutes = router;

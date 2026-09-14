import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Expense, ExpenseCategory } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant, requireBranch } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const expenseRepo = AppDataSource.getRepository(Expense);
const categoryRepo = AppDataSource.getRepository(ExpenseCategory);

router.use(authenticate);
router.use(requireTenant);

// List expense categories
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryRepo.find({
      where: [{ business_id: req.businessId }, { business_id: null as any }],
      order: { name: 'ASC' },
    });
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
});

// List expenses with date filtering
router.get('/', authorize(PERMISSIONS.EXPENSE_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, categoryId } = req.query;
    const query = expenseRepo.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .leftJoinAndSelect('expense.creator', 'creator')
      .where('expense.business_id = :businessId', { businessId: req.businessId });

    if (req.branchId) {
      query.andWhere('expense.branch_id = :branchId', { branchId: req.branchId });
    }
    if (startDate) {
      query.andWhere('expense.expense_date >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('expense.expense_date <= :endDate', { endDate });
    }
    if (categoryId) {
      query.andWhere('expense.category_id = :categoryId', { categoryId });
    }

    const expenses = await query.orderBy('expense.expense_date', 'DESC').getMany();
    sendSuccess(res, expenses);
  } catch (err) {
    next(err);
  }
});

// Record expense
router.post('/', requireBranch, authorize(PERMISSIONS.EXPENSE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category_id, amount, description, vendor, expense_date } = req.body;
    const expense = expenseRepo.create({
      business_id: req.businessId!,
      branch_id: req.branchId!,
      category_id: category_id || null,
      amount: Number(amount),
      description: description || null,
      vendor: vendor || null,
      expense_date: expense_date || new Date().toISOString().slice(0, 10),
      created_by: req.user!.userId,
    });
    await expenseRepo.save(expense);
    const created = await expenseRepo.findOne({
      where: { id: expense.id },
      relations: ['category', 'creator'],
    });
    sendSuccess(res, created, 'Expense recorded successfully', 201);
  } catch (err) {
    next(err);
  }
});

export const expenseRoutes = router;

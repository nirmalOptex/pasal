import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Category } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const categoryRepo = AppDataSource.getRepository(Category);

// List categories
router.get('/', authenticate, requireTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryRepo.find({
      where: { business_id: req.businessId },
      order: { sort_order: 'ASC', name: 'ASC' },
      relations: ['products'],
    });
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
});

// Create category
router.post('/', authenticate, requireTenant, authorize(PERMISSIONS.MENU_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, image_url, sort_order } = req.body;
    const category = categoryRepo.create({
      business_id: req.businessId!,
      name,
      description,
      image_url,
      sort_order: sort_order || 0,
      is_active: true,
    });
    await categoryRepo.save(category);
    sendSuccess(res, category, 'Category created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Update category
router.patch('/:id', authenticate, requireTenant, authorize(PERMISSIONS.MENU_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!category) throw new NotFoundError('Category not found');

    const { name, description, image_url, sort_order, is_active } = req.body;
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (image_url !== undefined) category.image_url = image_url;
    if (sort_order !== undefined) category.sort_order = sort_order;
    if (is_active !== undefined) category.is_active = is_active;

    await categoryRepo.save(category);
    sendSuccess(res, category, 'Category updated successfully');
  } catch (err) {
    next(err);
  }
});

// Delete category
router.delete('/:id', authenticate, requireTenant, authorize(PERMISSIONS.MENU_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!category) throw new NotFoundError('Category not found');

    await categoryRepo.remove(category);
    sendSuccess(res, null, 'Category deleted successfully');
  } catch (err) {
    next(err);
  }
});

export const categoryRoutes = router;

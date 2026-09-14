import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Product } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const productRepo = AppDataSource.getRepository(Product);

// List products
router.get('/', authenticate, requireTenant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, search, isAvailable } = req.query;
    const query = productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.business_id = :businessId', { businessId: req.businessId });

    if (categoryId) {
      query.andWhere('product.category_id = :categoryId', { categoryId });
    }
    if (search) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:search)', { search: `%${search}%` });
    }
    if (isAvailable !== undefined) {
      query.andWhere('product.is_available = :isAvailable', { isAvailable: isAvailable === 'true' });
    }

    const products = await query.orderBy('product.sort_order', 'ASC').addOrderBy('product.name', 'ASC').getMany();
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
});

// Create product
router.post('/', authenticate, requireTenant, authorize(PERMISSIONS.MENU_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category_id, name, description, price, image_url, tax_rate, sort_order, is_available } = req.body;
    const product = productRepo.create({
      business_id: req.businessId!,
      category_id,
      name,
      description,
      price,
      image_url,
      tax_rate: tax_rate || 0,
      sort_order: sort_order || 0,
      is_available: is_available !== undefined ? is_available : true,
      is_active: true,
    });
    await productRepo.save(product);
    const created = await productRepo.findOne({ where: { id: product.id }, relations: ['category'] });
    sendSuccess(res, created, 'Product created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Update product
router.patch('/:id', authenticate, requireTenant, authorize(PERMISSIONS.MENU_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!product) throw new NotFoundError('Product not found');

    const { category_id, name, description, price, image_url, tax_rate, sort_order, is_active, is_available } = req.body;
    if (category_id !== undefined) product.category_id = category_id;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (image_url !== undefined) product.image_url = image_url;
    if (tax_rate !== undefined) product.tax_rate = tax_rate;
    if (sort_order !== undefined) product.sort_order = sort_order;
    if (is_active !== undefined) product.is_active = is_active;
    if (is_available !== undefined) product.is_available = is_available;

    await productRepo.save(product);
    const updated = await productRepo.findOne({ where: { id: product.id }, relations: ['category'] });
    sendSuccess(res, updated, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
});

// Delete product
router.delete('/:id', authenticate, requireTenant, authorize(PERMISSIONS.MENU_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productRepo.findOne({
      where: { id: req.params.id, business_id: req.businessId },
    });
    if (!product) throw new NotFoundError('Product not found');

    await productRepo.remove(product);
    sendSuccess(res, null, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
});

export const productRoutes = router;

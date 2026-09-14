import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { Recipe, RecipeItem, Product } from '@entities/index';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { NotFoundError } from '@shared/errors/app-error';

const router = Router();
const recipeRepo = AppDataSource.getRepository(Recipe);
const productRepo = AppDataSource.getRepository(Product);

router.use(authenticate);
router.use(requireTenant);

// Get recipe for product
router.get('/product/:productId', authorize(PERMISSIONS.RECIPE_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recipe = await recipeRepo.findOne({
      where: { product_id: req.params.productId },
      relations: ['items', 'items.inventory_item'],
    });
    sendSuccess(res, recipe);
  } catch (err) {
    next(err);
  }
});

// Create or update recipe for product
router.post('/product/:productId', authorize(PERMISSIONS.RECIPE_MANAGE), async (req: Request, res: Response, next: NextFunction) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const product = await queryRunner.manager.findOne(Product, {
      where: { id: req.params.productId, business_id: req.businessId },
    });
    if (!product) throw new NotFoundError('Product not found');

    const { name, yield_quantity, notes, items } = req.body;

    let recipe = await queryRunner.manager.findOne(Recipe, {
      where: { product_id: product.id },
      relations: ['items'],
    });

    if (recipe) {
      // Remove old items
      if (recipe.items && recipe.items.length > 0) {
        await queryRunner.manager.remove(recipe.items);
      }
      recipe.name = name;
      recipe.yield_quantity = yield_quantity || 1;
      recipe.notes = notes;
      recipe.version += 1;
    } else {
      recipe = queryRunner.manager.create(Recipe, {
        product_id: product.id,
        name: name || `${product.name} Recipe`,
        yield_quantity: yield_quantity || 1,
        notes,
        version: 1,
      });
    }

    await queryRunner.manager.save(recipe);

    if (items && Array.isArray(items)) {
      const recipeItems = items.map((i: any) =>
        queryRunner.manager.create(RecipeItem, {
          recipe_id: recipe!.id,
          inventory_item_id: i.inventoryItemId,
          quantity: i.quantity,
          unit: i.unit,
        })
      );
      await queryRunner.manager.save(recipeItems);
    }

    await queryRunner.commitTransaction();

    const saved = await recipeRepo.findOne({
      where: { id: recipe.id },
      relations: ['items', 'items.inventory_item'],
    });

    sendSuccess(res, saved, 'Recipe saved successfully', 201);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    next(err);
  } finally {
    await queryRunner.release();
  }
});

export const recipeRoutes = router;

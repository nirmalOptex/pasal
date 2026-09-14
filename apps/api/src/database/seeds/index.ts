import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import {
  Business,
  Branch,
  Role,
  User,
  Category,
  Product,
  TableArea,
  Table,
  InventoryItem,
  Recipe,
  RecipeItem,
  Customer,
  CreditAccount,
  LoyaltyRule,
  ExpenseCategory,
} from '../../entities';
import { UserRoleType, TableStatus } from '@chhiyapasal/shared-types';
import { ROLE_DEFAULT_PERMISSIONS } from '../../shared/constants/permissions';

async function seed() {
  console.log('🌱 Starting ChiyaPasal Database Seed...');
  await AppDataSource.initialize();

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Create Business
    const business = queryRunner.manager.create(Business, {
      name: 'Matka Chiya & Khaja Ghar',
      address: 'Basantapur Durbar Square, Kathmandu',
      phone: '+977-9801234567',
      email: 'admin@chhiyapasal.np',
      currency: 'NPR',
      timezone: 'Asia/Kathmandu',
    });
    await queryRunner.manager.save(business);

    // 2. Roles
    const roles: Role[] = [];
    for (const [roleName, permissions] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
      const r = queryRunner.manager.create(Role, {
        business_id: business.id,
        name: roleName,
        permissions,
        is_system: true,
      });
      roles.push(r);
    }
    await queryRunner.manager.save(roles);
    const ownerRole = roles.find((r) => r.name === UserRoleType.OWNER)!;
    const cashierRole = roles.find((r) => r.name === UserRoleType.CASHIER)!;
    const kitchenRole = roles.find((r) => r.name === UserRoleType.KITCHEN_STAFF)!;
    const waiterRole = roles.find((r) => r.name === UserRoleType.WAITER)!;

    // 3. Branch
    const branch = queryRunner.manager.create(Branch, {
      business_id: business.id,
      name: 'Basantapur Flagship',
      address: 'Basantapur, Kathmandu',
      phone: '+977-9801234567',
    });
    await queryRunner.manager.save(branch);

    // 4. Users
    const passwordHash = await bcrypt.hash('admin123', 10);
    const ownerPinHash = await bcrypt.hash('0000', 10);
    const cashierPinHash = await bcrypt.hash('1111', 10);
    const kitchenPinHash = await bcrypt.hash('2222', 10);
    const waiterPinHash = await bcrypt.hash('3333', 10);

    const adminUser = queryRunner.manager.create(User, {
      business_id: business.id,
      branch_id: branch.id,
      role_id: ownerRole.id,
      name: 'Nirmal Adhikari (Owner)',
      email: 'admin@chhiyapasal.np',
      phone: '+977-9800000001',
      password_hash: passwordHash,
      pin_hash: ownerPinHash,
    });

    const cashierUser = queryRunner.manager.create(User, {
      business_id: business.id,
      branch_id: branch.id,
      role_id: cashierRole.id,
      name: 'Ramesh Thapa (Cashier)',
      email: 'cashier@chhiyapasal.np',
      phone: '+977-9800000002',
      password_hash: passwordHash,
      pin_hash: cashierPinHash,
    });

    const kitchenUser = queryRunner.manager.create(User, {
      business_id: business.id,
      branch_id: branch.id,
      role_id: kitchenRole.id,
      name: 'Bishnu Dai (Chef)',
      email: 'kitchen@chhiyapasal.np',
      phone: '+977-9800000003',
      password_hash: passwordHash,
      pin_hash: kitchenPinHash,
    });

    const waiterUser = queryRunner.manager.create(User, {
      business_id: business.id,
      branch_id: branch.id,
      role_id: waiterRole.id,
      name: 'Suman Giri (Waiter)',
      email: 'waiter@chhiyapasal.np',
      phone: '+977-9800000004',
      password_hash: passwordHash,
      pin_hash: waiterPinHash,
    });

    await queryRunner.manager.save([adminUser, cashierUser, kitchenUser, waiterUser]);

    // 5. Table Areas & Tables
    const indoor = queryRunner.manager.create(TableArea, {
      branch_id: branch.id,
      name: 'Indoor Dining',
      description: 'Cozy traditional decor with low wooden benches',
    });
    const rooftop = queryRunner.manager.create(TableArea, {
      branch_id: branch.id,
      name: 'Rooftop View',
      description: 'Durbar Square scenic view seating',
    });
    await queryRunner.manager.save([indoor, rooftop]);

    const tables = [
      queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: indoor.id, name: 'T1 (Window)', capacity: 4, status: TableStatus.AVAILABLE }),
      queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: indoor.id, name: 'T2 (Corner)', capacity: 4, status: TableStatus.AVAILABLE }),
      queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: indoor.id, name: 'T3 (Booth)', capacity: 6, status: TableStatus.AVAILABLE }),
      queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: rooftop.id, name: 'R1 (View)', capacity: 4, status: TableStatus.AVAILABLE }),
      queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: rooftop.id, name: 'R2 (Garden)', capacity: 4, status: TableStatus.AVAILABLE }),
    ];
    await queryRunner.manager.save(tables);

    // 6. Categories
    const catChiya = queryRunner.manager.create(Category, { business_id: business.id, name: 'Special Chiya (Tea)', sort_order: 1 });
    const catCoffee = queryRunner.manager.create(Category, { business_id: business.id, name: 'Coffee & Drinks', sort_order: 2 });
    const catMomo = queryRunner.manager.create(Category, { business_id: business.id, name: 'Momo & Chowmein', sort_order: 3 });
    const catKhaja = queryRunner.manager.create(Category, { business_id: business.id, name: 'Khaja & Snacks', sort_order: 4 });
    const catBakery = queryRunner.manager.create(Category, { business_id: business.id, name: 'Bakery & Sweets', sort_order: 5 });
    await queryRunner.manager.save([catChiya, catCoffee, catMomo, catKhaja, catBakery]);

    // 7. Products
    const products = [
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catChiya.id, name: 'Special Matka Chiya', price: 50, tax_rate: 0, sort_order: 1 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catChiya.id, name: 'Masala Dudh Chiya', price: 40, tax_rate: 0, sort_order: 2 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catChiya.id, name: 'Adhuwa (Ginger) Chiya', price: 35, tax_rate: 0, sort_order: 3 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catChiya.id, name: 'Black Lemon Tea', price: 30, tax_rate: 0, sort_order: 4 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catCoffee.id, name: 'Filter Hot Coffee', price: 80, tax_rate: 0, sort_order: 1 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catCoffee.id, name: 'Iced Cold Coffee', price: 120, tax_rate: 0, sort_order: 2 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catMomo.id, name: 'Steam Chicken Momo', price: 180, tax_rate: 13, sort_order: 1 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catMomo.id, name: 'Jhol Chicken Momo', price: 200, tax_rate: 13, sort_order: 2 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catMomo.id, name: 'Buff Steam Momo', price: 150, tax_rate: 13, sort_order: 3 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catMomo.id, name: 'Veg Fried Momo', price: 140, tax_rate: 13, sort_order: 4 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catMomo.id, name: 'Chicken Chowmein', price: 170, tax_rate: 13, sort_order: 5 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catKhaja.id, name: 'Aloo Paratha with Dahi', price: 110, tax_rate: 0, sort_order: 1 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catKhaja.id, name: 'Samosa Tarkari (2 pcs)', price: 70, tax_rate: 0, sort_order: 2 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catKhaja.id, name: 'Chana Anda Chiura Set', price: 120, tax_rate: 0, sort_order: 3 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catBakery.id, name: 'Crispy Jerry (2 pcs)', price: 40, tax_rate: 0, sort_order: 1 }),
      queryRunner.manager.create(Product, { business_id: business.id, category_id: catBakery.id, name: 'Sel Roti (Fresh)', price: 30, tax_rate: 0, sort_order: 2 }),
    ];
    await queryRunner.manager.save(products);

    // 8. Sample Inventory Items
    const milk = queryRunner.manager.create(InventoryItem, { business_id: business.id, name: 'Cow Milk (DDC)', unit: 'ltr', current_stock: 50, low_stock_threshold: 10, cost_per_unit: 90 });
    const teaLeaves = queryRunner.manager.create(InventoryItem, { business_id: business.id, name: 'Ilam CTC Tea Leaves', unit: 'kg', current_stock: 15, low_stock_threshold: 3, cost_per_unit: 450 });
    const sugar = queryRunner.manager.create(InventoryItem, { business_id: business.id, name: 'Sugar', unit: 'kg', current_stock: 40, low_stock_threshold: 5, cost_per_unit: 105 });
    const chicken = queryRunner.manager.create(InventoryItem, { business_id: business.id, name: 'Minced Chicken', unit: 'kg', current_stock: 25, low_stock_threshold: 5, cost_per_unit: 420 });
    await queryRunner.manager.save([milk, teaLeaves, sugar, chicken]);

    // 9. Recipe for Matka Chiya
    const matkaChiya = products.find((p) => p.name === 'Special Matka Chiya')!;
    const recipe = queryRunner.manager.create(Recipe, {
      product_id: matkaChiya.id,
      name: 'Matka Chiya Recipe (1 Cup)',
      yield_quantity: 1,
    });
    await queryRunner.manager.save(recipe);

    const recipeItems = [
      queryRunner.manager.create(RecipeItem, { recipe_id: recipe.id, inventory_item_id: milk.id, quantity: 0.15, unit: 'ltr' }),
      queryRunner.manager.create(RecipeItem, { recipe_id: recipe.id, inventory_item_id: teaLeaves.id, quantity: 0.01, unit: 'kg' }),
      queryRunner.manager.create(RecipeItem, { recipe_id: recipe.id, inventory_item_id: sugar.id, quantity: 0.015, unit: 'kg' }),
    ];
    await queryRunner.manager.save(recipeItems);

    // 10. Sample Customer with Credit / Khata
    const customer = queryRunner.manager.create(Customer, {
      business_id: business.id,
      name: 'Ram Prasad Sharma',
      phone: '9841234567',
      email: 'ram.sharma@example.com',
      credit_balance: 350,
      loyalty_points: 25,
    });
    await queryRunner.manager.save(customer);

    const creditAccount = queryRunner.manager.create(CreditAccount, {
      business_id: business.id,
      customer_id: customer.id,
      balance: 350,
      credit_limit: 5000,
    });
    await queryRunner.manager.save(creditAccount);

    // 11. Loyalty Rule (Rs. 100 = 1 pt)
    const loyaltyRule = queryRunner.manager.create(LoyaltyRule, {
      business_id: business.id,
      spend_amount: 100,
      points_earned: 1,
      point_redemption_value: 1,
    });
    await queryRunner.manager.save(loyaltyRule);

    // 12. Expense Categories
    const expenseCategories = [
      queryRunner.manager.create(ExpenseCategory, { business_id: business.id, name: 'Rent & Lease' }),
      queryRunner.manager.create(ExpenseCategory, { business_id: business.id, name: 'Electricity & Water' }),
      queryRunner.manager.create(ExpenseCategory, { business_id: business.id, name: 'Staff Salaries' }),
      queryRunner.manager.create(ExpenseCategory, { business_id: business.id, name: 'Raw Ingredients' }),
      queryRunner.manager.create(ExpenseCategory, { business_id: business.id, name: 'LPG Gas Cylinder' }),
      queryRunner.manager.create(ExpenseCategory, { business_id: business.id, name: 'Packaging & Disposables' }),
    ];
    await queryRunner.manager.save(expenseCategories);

    await queryRunner.commitTransaction();
    console.log('✅ Seed completed successfully!');
    console.log('Credentials:');
    console.log('  Admin:   admin@chhiyapasal.np   / admin123');
    console.log('  Cashier: cashier@chhiyapasal.np / admin123');
    console.log('  Kitchen: kitchen@chhiyapasal.np / admin123');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed();
